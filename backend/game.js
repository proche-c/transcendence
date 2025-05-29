const TournamentManager = require('./tournamentManager');

async function gameRoutes(fastify, options) {
  const { dbGetAsync, dbRunAsync } = options;
  const authMiddleware = authMiddlewareAUX(dbGetAsync, fastify);

  // Instancia global del torneo
  const tournament = new TournamentManager();
  const gameRooms = new Map();
  const waitingPlayers = [];

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

  fastify.get('/', { websocket: true }, (connection, req) => {
    try {
      const token = req.cookies.token;
      if (!token) {
        fastify.log.warn('WebSocket connection rejected: no token');
        connection.close();
        return;
      }
      let payload;
      try {
        payload = fastify.jwt.verify(token);
      } catch (err) {
        fastify.log.warn('WebSocket JWT verification failed');
        connection.close();
        return;
      }
      const { userId, username } = payload;
      connection.userId = userId;
      connection.username = username;
      //userSockets.set(userId, connection);
      fastify.log.info(`User ${username} connected via WebSocket`);
    }catch (err) {
      fastify.log.error({ err }, 'WebSocket error during connection');
    }
    
    try {
      const playerId = Math.random().toString(36).substring(2, 10);
      const playerNumber = !fastify.websocketGames.find(c => c.playerNumber === 1) ? 1 : 2;

      if (fastify.websocketGames.length >= 2) {
        connection.send(JSON.stringify({ type: "error", message: "Sala plena" }));
        connection.close();
        return;
      }

      connection.playerNumber = playerNumber;
      connection.playerId = playerId;

      // Afegim primer el jugador i després comprovem si podem començar el joc
      fastify.websocketGames.push(connection);
      fastify.log.info(`Jugador ${playerNumber} conectado: ${playerId}`);

      connection.send(JSON.stringify({ type: "init", playerId, playerNumber, gameState }));
      
      // Comprovació DESPRÉS d'afegir el jugador a l'array
      if (fastify.websocketGames.length === 2 && !gameState.running) {
        fastify.log.info('Dos jugadors connectats. Iniciant el joc automàticament...');
        gameState.running = true;
        startGame();
        
        // Notificar a tots els jugadors que el joc ha començat
        fastify.websocketGames.forEach(client => {
          if (client.readyState === client.OPEN) {
            client.send(JSON.stringify({ 
              type: "gameStart", 
              message: "La partida ha començat!"
            }));
          }
        });
      }

      connection.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === "move") {
          const pn = connection.playerNumber;
          if (pn === 1 || pn === 2) {
            gameState.players[`player${pn}`].y = data.y;
          }
        }
      });

      connection.on('close', () => {
        fastify.websocketGames = fastify.websocketGames.filter(client => client !== connection);
        fastify.log.info(`Jugador desconectado: ${playerId}`);
        
        // Si un jugador es desconnecta, aturem el joc
        if (gameState.running) {
          gameState.running = false;
          fastify.log.info('Jugador desconnectat. Aturant el joc.');
          
          // Notificar a tots els jugadors restants
          fastify.websocketGames.forEach(client => {
            if (client.readyState === client.OPEN) {
              client.send(JSON.stringify({ 
                type: "gameEnd", 
                message: "Un jugador s'ha desconnectat. La partida ha finalitzat."
              }));
            }
          });
        }
      });

    } catch (err) {
      fastify.log.error({ err }, "Error en WebSocket de juego");
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

  // WebSocket para juegos y torneos
  fastify.register(async function (fastify) {
    fastify.get('/game', { websocket: true }, async (connection, req) => {
      console.log('Nueva conexión WebSocket para juego');
      
      connection.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          switch (data.type) {
            // Nuevos casos para torneo
            case 'tournament_join':
              const joinResult = tournament.addPlayer(connection.id, data.alias);
              connection.send(JSON.stringify({
                type: 'tournament_join_result',
                ...joinResult,
                tournamentState: tournament.getTournamentState()
              }));
              break;

            case 'tournament_match_result':
              const result = tournament.reportMatchResult(data.winnerId);
              connection.send(JSON.stringify({
                type: 'tournament_match_result_response',
                ...result
              }));
              break;

            case 'tournament_get_state':
              connection.send(JSON.stringify({
                type: 'tournament_state',
                state: tournament.getTournamentState()
              }));
              break;

            case 'tournament_reset':
              tournament.reset();
              connection.send(JSON.stringify({
                type: 'tournament_state',
                state: tournament.getTournamentState()
              }));
              break;

            // ...existing game logic cases remain unchanged...

            default:
              console.log('Tipo de mensaje no reconocido:', data.type);
              break;
          }
        } catch (error) {
          console.error('Error procesando mensaje del juego:', error);
        }
      });

      connection.on('close', () => {
        // Manejar desconexión en torneo
        tournament.handleDisconnect(connection.id);
        
        // ...existing cleanup code...
      });

      // Enviar estado inicial del torneo
      connection.send(JSON.stringify({
        type: 'tournament_state',
        state: tournament.getTournamentState()
      }));
    });
  });

  // Nuevas rutas API para torneo
  fastify.get('/api/tournament/state', async (request, reply) => {
    return tournament.getTournamentState();
  });

  fastify.post('/api/tournament/reset', { preHandler: authMiddleware }, async (request, reply) => {
    tournament.reset();
    return { success: true, message: 'Torneo reiniciado' };
  });
}

module.exports = gameRoutes;