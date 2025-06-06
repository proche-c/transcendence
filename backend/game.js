async function gameRoutes(fastify, options) {
  const bcrypt = options.bcrypt;
  const db = options.db; 
  const dbGetAsync = options.dbGetAsync;
  const dbRunAsync = options.dbRunAsync;
  const dbAllAsync = options.dbAllAsync;
  //const userSockets = new Map();
  if (!fastify.websocketGames) {
    fastify.websocketGames = [];
  }

  const gameState = {
    running: false,
    players: {
      player1: { x: 30, y: 200 },
      player2: { x: 740, y: 200 }
    },
    ball: { x: 400, y: 250, speedX: 5, speedY: 5 },
    scores: { player1: 0, player2: 0 }
  };

  fastify.register(async function (fastify) {
    fastify.get('/', { websocket: true }, async (connection, req) => {
      console.log('Nueva conexión WebSocket para juego');
      
      // Generar ID único para esta conexión
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      connection.id = connectionId;
      
      connection.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          console.log(`[Debug] Mensaje recibido [${data.type}] de ${connectionId}`);
          
          switch (data.type) {
            // Eliminar todos estos casos relacionados con tournament:
            // case 'tournament_join':
            // case 'tournament_get_state':
            // case 'tournament_reset':
            
            // Mantener solo los casos de juego normal:
            case 'join':
              // ... código existente para juego normal ...
              break;
            
            case 'move':
              // ... código existente para movimiento ...
              break;
              
            default:
              // ... resto del código existente ...
              break;
          }
          
        } catch (error) {
          console.error(`[Error] Procesando mensaje: ${error}`);
          connection.send(JSON.stringify({
            type: 'error',
            message: 'Error procesando mensaje'
          }));
        }
      });

      connection.on('close', () => {
        console.log(`Conexión WebSocket cerrada: ${connectionId}`);
        
        // Eliminar esta línea:
        // tournamentManager.handleDisconnect(connectionId);
        
        // ... resto del código de desconexión existente ...
      });
      
      // Eliminar estas líneas:
      // tournamentManager.registerConnection(connectionId, connection);
      // connection.send(JSON.stringify({
      //   type: 'tournament_state',
      //   state: tournamentManager.getTournamentState()
      // }));
      
    } catch (err) {
      fastify.log.error({ err }, 'WebSocket error during connection');
    }
  });

  function startGame() {
    function updateGame() {
      if (!gameState.running) return;

      gameState.ball.x += gameState.ball.speedX;
      gameState.ball.y += gameState.ball.speedY;

      // Rebote contra bordes superior/inferior del canvas
      if (gameState.ball.y <= 0 || gameState.ball.y >= 500) {
        gameState.ball.speedY *= -1;
      }

      ["player1", "player2"].forEach(playerKey => {
        const player = gameState.players[playerKey];

        const isPlayer1 = playerKey === "player1";
        const paddleX = player.x;
        const ballX = gameState.ball.x;

        const collisionX = isPlayer1
          ? ballX <= paddleX + 10 && ballX >= paddleX
          : ballX >= paddleX - 10 && ballX <= paddleX;

        if (collisionX && gameState.ball.y >= player.y && gameState.ball.y <= player.y + 80) {
          gameState.ball.speedX *= -1;
          const relativeIntersectY = (player.y + 40) - gameState.ball.y;
          const normalized = relativeIntersectY / 40;
          gameState.ball.speedY = -normalized * 6;
        }
      });

      // Gol
      if (gameState.ball.x <= 0) {
        gameState.scores.player2 += 1;
        checkGameOver();
        resetBall();
      } else if (gameState.ball.x >= 800) {
        gameState.scores.player1 += 1;
        checkGameOver();
        resetBall();
      }

      fastify.websocketGames.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({ type: "update", gameState }));
        }
      });

      setTimeout(updateGame, 1000 / 60);
    }

    updateGame();
  }

  function checkGameOver() {
    if (gameState.scores.player1 >= 10) {
      endGame("Jugador 1 gana!", 1);
    } else if (gameState.scores.player2 >= 10) {
      endGame("Jugador 2 gana!", 2);
    }
  }

  async function endGame(winnerMessage, winnerNumber) {
    gameState.running = false;
    
    // Obtenir les connexions dels jugadors
    const player1Connection = fastify.websocketGames.find(c => c.playerNumber === 1);
    const player2Connection = fastify.websocketGames.find(c => c.playerNumber === 2);
    
    // Obtenir els IDs d'usuari
    if (player1Connection && player2Connection && 
        player1Connection.userId && player2Connection.userId) {
      
      const player1Id = player1Connection.userId;
      const player2Id = player2Connection.userId;
      
      try {
        // Actualitzar estadístiques dels jugadors
        await updatePlayerStats(player1Id, gameState.scores.player1, gameState.scores.player2, winnerNumber === 1);
        await updatePlayerStats(player2Id, gameState.scores.player2, gameState.scores.player1, winnerNumber === 2);
        await updateRankings();
        fastify.log.info(`Partida finalitzada: ${player1Connection.username} vs ${player2Connection.username}, resultat: ${gameState.scores.player1}-${gameState.scores.player2}`);
      } catch (error) {
        fastify.log.error(`Error al actualitzar estadístiques: ${error.message}`);
      }
    } else {
      fastify.log.warn("No s'han pogut actualitzar les estadístiques: falta informació dels jugadors");
    }
    
    // Notificar als jugadors
    fastify.websocketGames.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify({ 
          type: "end", 
          message: winnerMessage,
          finalScore: gameState.scores
        }));
      }
    });

    // Reiniciar l'estat del joc
    gameState.ball = { x: 400, y: 250, speedX: 5, speedY: 5 };
    gameState.scores = { player1: 0, player2: 0 };
  }
  
  async function updatePlayerStats(userId, goalsFor, goalsAgainst, isWinner) {
    try {
      // Actualitzar estadístiques de l'usuari
      await dbRunAsync(
        `UPDATE users 
         SET 
           total_matches = total_matches + 1,
           total_wins = total_wins + ?,
           total_losses = total_losses + ?,
           goals_for = goals_for + ?,
           goals_against = goals_against + ?
         WHERE id = ?`,
        [isWinner ? 1 : 0, isWinner ? 0 : 1, goalsFor, goalsAgainst, userId]
      );
      
      fastify.log.info(`Estadístiques actualitzades per a l'usuari ${userId}`);
    } catch (error) {
      fastify.log.error(`Error actualitzant estadístiques: ${error.message}`);
    }
  }

   async function updateRankings() {
  try {
    await dbRunAsync(`
      WITH ranked AS (
        SELECT
          id,
          RANK() OVER (
            ORDER BY 
              -- Primer els jugadors amb partides, després els que no en tenen
              CASE WHEN total_matches > 0 THEN 0 ELSE 1 END,
              -- Ordenació per victòries (descendent)
              total_wins DESC,
              -- En cas d'empat, diferència de gols (descendent)
              (goals_for - goals_against) DESC,
              -- En cas d'empat entre jugadors sense partides, ordenem per ID (els més antics primer)
              id ASC
          ) AS pos
        FROM users
      )
      UPDATE users
      SET ranking = (
        SELECT pos FROM ranked WHERE ranked.id = users.id
      );
    `);
    
    fastify.log.info("Rànquing global actualitzat");
  } catch (error) {
    fastify.log.error(`Error actualitzant rànquing: ${error.message}`);
  }
}

  function resetBall() {
    if (!gameState.running) return;

    gameState.ball.x = 400;
    gameState.ball.y = 250;
    gameState.ball.speedX = gameState.ball.speedX > 0 ? -10 : 10;
    gameState.ball.speedY = 0;

    fastify.websocketGames.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify({ type: "score", scores: gameState.scores }));
      }
    });
  }
}

module.exports = gameRoutes;