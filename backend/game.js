async function gameRoutes(fastify, options) {
  const bcrypt = options.bcrypt;
  const db = options.db; 
  const dbGetAsync = options.dbGetAsync;
  const dbRunAsync = options.dbRunAsync;
  const dbAllAsync = options.dbAllAsync;
  
  // Inicialitzem les estructures de dades per a múltiples partides
  fastify.gameRooms = new Map(); // Map per emmagatzemar les sales amb els seus jugadors i estats
  fastify.websocketGames = []; // Mantenim aquest array per compatibilitat

  fastify.get('/', { websocket: true }, (connection, req) => {
    try {
      // Verificació d'autenticació
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
      fastify.log.info(`User ${username} connected via WebSocket`);
      
      // Gestió de la connexió del jugador
      const playerId = Math.random().toString(36).substring(2, 10);
      
      // Buscar una sala disponible o crear-ne una nova
      let roomId = null;
      let playerNumber = null;
      let room = null;
      
      // Buscar una sala amb un lloc lliure
      for (const [id, existingRoom] of fastify.gameRooms.entries()) {
        if (existingRoom.players.length < 2 && !existingRoom.running) {
          roomId = id;
          playerNumber = 2; // El segon jugador
          room = existingRoom;
          break;
        }
      }
      
      // Si no hi ha cap sala disponible, crear-ne una nova
      if (!roomId) {
        roomId = Math.random().toString(36).substring(2, 10);
        playerNumber = 1; // El primer jugador
        
        // Crear nou estat de joc per aquesta sala
        const gameState = {
          running: false,
          players: {
            player1: { x: 30, y: 200 },
            player2: { x: 740, y: 200 }
          },
          ball: { x: 400, y: 250, speedX: 5, speedY: 5 },
          scores: { player1: 0, player2: 0 }
        };
        
        room = {
          id: roomId,
          players: [],
          gameState: gameState,
          running: false
        };
        
        fastify.gameRooms.set(roomId, room);
        fastify.log.info(`Nova sala creada: ${roomId}`);
      }
      
      // Configurar la connexió amb les dades del jugador i sala
      connection.playerId = playerId;
      connection.playerNumber = playerNumber;
      connection.roomId = roomId;
      
      // Afegir jugador a la sala
      room.players.push(connection);
      
      // Afegir també a l'array general per compatibilitat
      fastify.websocketGames.push(connection);
      
      fastify.log.info(`Jugador ${playerNumber} connectat a la sala ${roomId}: ${playerId}`);
      
      // Enviar informació inicial al jugador
      connection.send(JSON.stringify({ 
        type: "init", 
        playerId, 
        playerNumber, 
        gameState: room.gameState,
        roomId
      }));
      
      // Comprovar si podem començar el joc en aquesta sala
      if (room.players.length === 2 && !room.running) {
        fastify.log.info(`Iniciant partida a la sala ${roomId}...`);
        room.running = true;
        room.gameState.running = true;
        
        // Iniciar el joc per a aquesta sala
        startGame(roomId);
        
        // Notificar als jugadors
        room.players.forEach(client => {
          if (client.readyState === client.OPEN) {
            client.send(JSON.stringify({ 
              type: "gameStart", 
              message: "La partida ha començat!"
            }));
          }
        });
      }

      // Gestionar els missatges dels jugadors
      connection.on('message', (message) => {
        const data = JSON.parse(message);
        const room = fastify.gameRooms.get(connection.roomId);
        
        if (!room) return;
        
        if (data.type === "move") {
          const pn = connection.playerNumber;
          if (pn === 1 || pn === 2) {
            room.gameState.players[`player${pn}`].y = data.y;
          }
        }
      });

            // Gestionar la desconnexió
      connection.on('close', () => {
        fastify.websocketGames = fastify.websocketGames.filter(client => client !== connection);
        
        const room = fastify.gameRooms.get(connection.roomId);
        if (room) {
          // Notificar als jugadors restants abans d'eliminar la sala
          room.players.filter(client => client !== connection).forEach(client => {
            if (client.readyState === client.OPEN) {
              client.send(JSON.stringify({ 
                type: "gameEnd", 
                message: "Un jugador s'ha desconnectat. La partida ha finalitzat.",
                forceDisconnect: true
              }));
            }
          });
          
          // Eliminar la sala immediatament
          fastify.gameRooms.delete(connection.roomId);
          fastify.log.info(`Sala ${connection.roomId} eliminada perquè un jugador s'ha desconnectat`);
        }
        
        fastify.log.info(`Jugador desconnectat: ${connection.playerId} de la sala ${connection.roomId}`);
      });

    } catch (err) {
      fastify.log.error({ err }, "Error en WebSocket de juego");
    }
  });

  // Funció per iniciar una partida en una sala específica
  function startGame(roomId) {
    const room = fastify.gameRooms.get(roomId);
    if (!room || !room.running) return;
    
    function updateGame() {
      if (!room.running || !room.gameState.running) return;
      
      const gameState = room.gameState;
      
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
        checkGameOver(roomId);
        resetBall(roomId);
      } else if (gameState.ball.x >= 800) {
        gameState.scores.player1 += 1;
        checkGameOver(roomId);
        resetBall(roomId);
      }

      // Enviar actualitzacions només als jugadors d'aquesta sala
      room.players.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({ type: "update", gameState }));
        }
      });

      if (room.running && gameState.running) {
        setTimeout(() => updateGame(), 1000 / 75);
      }
    }

    updateGame();
  }

  // Comprovar si la partida ha acabat
  function checkGameOver(roomId) {
    const room = fastify.gameRooms.get(roomId);
    if (!room) return;
    
    const gameState = room.gameState;
    
    if (gameState.scores.player1 >= 4) {
      endGame(roomId, "Player 1 wins!", 1);
    } else if (gameState.scores.player2 >= 4) {
      endGame(roomId, "Player 2 wins!", 2);
    }
  }

  // Finalitzar la partida
   // Finalitzar la partida
  async function endGame(roomId, winnerMessage, winnerNumber) {
    const room = fastify.gameRooms.get(roomId);
    if (!room) return;
    
    room.running = false;
    room.gameState.running = false;
    
    // Obtenir les connexions dels jugadors
    const player1Connection = room.players.find(c => c.playerNumber === 1);
    const player2Connection = room.players.find(c => c.playerNumber === 2);
    
    // Obtenir els IDs d'usuari
    if (player1Connection && player2Connection && 
        player1Connection.userId && player2Connection.userId) {
      
      const player1Id = player1Connection.userId;
      const player2Id = player2Connection.userId;
      
      try {
        // Actualitzar estadístiques dels jugadors
        await updatePlayerStats(player1Id, room.gameState.scores.player1, room.gameState.scores.player2, winnerNumber === 1);
        await updatePlayerStats(player2Id, room.gameState.scores.player2, room.gameState.scores.player1, winnerNumber === 2);
        await updateRankings();
        fastify.log.info(`Partida finalitzada a sala ${roomId}: ${player1Connection.username} vs ${player2Connection.username}, resultat: ${room.gameState.scores.player1}-${room.gameState.scores.player2}`);
      } catch (error) {
        fastify.log.error(`Error al actualitzar estadístiques: ${error.message}`);
      }
    } else {
      fastify.log.warn(`No s'han pogut actualitzar les estadístiques a sala ${roomId}: falta informació dels jugadors`);
    }
    
    // Notificar als jugadors
    room.players.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify({ 
          type: "end", 
          message: winnerMessage,
          finalScore: room.gameState.scores,
          gameOver: true // Nou camp per indicar fi definitiu del joc
        }));
      }
    });

    // Eliminar la sala després d'uns segons
    setTimeout(() => {
      if (fastify.gameRooms.has(roomId)) {
        fastify.gameRooms.delete(roomId);
        fastify.log.info(`Sala ${roomId} eliminada després de finalitzar la partida`);
      }
    }, 3000); // Donem 10 segons perquè els jugadors vegin el resultat
  }
  
  // Actualitzar estadístiques d'un jugador
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

  // Actualitzar el rànquing global
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

  // Reiniciar la pilota després d'un gol
   function resetBall(roomId) {
    const room = fastify.gameRooms.get(roomId);
    if (!room || !room.running) return;

    const gameState = room.gameState;
    
    // Guarda qui ha rebut el gol (basant-nos en la posició actual de la pilota)
    const goalReceivedByPlayer = (gameState.ball.x <= 0) ? 1 : 2;
    
    gameState.ball.x = 400;
    gameState.ball.y = 250;
    gameState.ball.speedX = 0; // Aturem la pilota temporalment
    gameState.ball.speedY = 0;

    // Enviar puntuació actualitzada
    room.players.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify({ type: "score", scores: gameState.scores }));
      }
    });
    
    // Esperar 2 segons i després moure la pilota cap al jugador que ha rebut el gol
    setTimeout(() => {
      if (room && room.running) {
        // Si el gol el va rebre el jugador 1, la pilota va cap a l'esquerra (-10)
        // Si el gol el va rebre el jugador 2, la pilota va cap a la dreta (10)
        gameState.ball.speedX = (goalReceivedByPlayer === 1) ? -10 : 10;
      }
    }, 2000);
  }
  
  // Programar neteja periòdica de sales inactives
  setInterval(() => {
    const now = Date.now();
    for (const [roomId, room] of fastify.gameRooms.entries()) {
      // Si la sala porta més de 5 minuts sense activitat, l'eliminem
      if (!room.running && (!room.lastActivity || now - room.lastActivity > 5 * 60 * 1000)) {
        fastify.gameRooms.delete(roomId);
        fastify.log.info(`Sala ${roomId} eliminada per inactivitat`);
      }
    }
  }, 60 * 1000); // Comprovar cada minut
}

module.exports = gameRoutes;