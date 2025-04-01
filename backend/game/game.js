async function gameRoutes(fastify, options) {
  if (!fastify.websocketGames) {
    fastify.websocketGames = [];
  }

  // Estado del juego
  const gameState = {
    running: false, // Nuevo estado para saber si el juego ha empezado
    players: {},  // Jugadores conectados
    ball: { x: 300, y: 200, speedX: 5, speedY: 5 }, // Pelota
    scores: { player1: 0, player2: 0 } // Puntuaciones
  };

  fastify.get('/game', { websocket: true }, (connection, req) => {
    try {
      const playerId = Math.random().toString(36).substring(2, 10);
      const playerNumber = Object.keys(gameState.players).length + 1;

      if (playerNumber > 2) {
        connection.socket.send(JSON.stringify({ type: "error", message: "Sala llena" }));
        connection.socket.close();
        return;
      }

      gameState.players[playerId] = { x: playerNumber === 1 ? 20 : 560, y: 150 };

      fastify.websocketGames.push(connection);
      fastify.log.info(`Jugador ${playerNumber} conectado: ${playerId}`);

      connection.socket.send(JSON.stringify({ type: "init", playerId, playerNumber, gameState }));

      connection.socket.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === "move" && gameState.players[playerId]) {
          gameState.players[playerId].y = data.y;
        }

        // Un jugador escribe "jugar" → inicia el juego
        if (data.type === "start" && data.message === "jugar" && !gameState.running) {
          gameState.running = true;
          startGame();
        }
      });

      connection.socket.on('close', () => {
        fastify.websocketGames = fastify.websocketGames.filter(client => client !== connection);
        delete gameState.players[playerId];
        fastify.log.info(`Jugador desconectado: ${playerId}`);
      });

    } catch (err) {
      fastify.log.error({ err }, "Error en WebSocket de juego");
    }
  });

  // Función que inicia el juego y lo actualiza
  function startGame() {
    function updateGame() {
      if (!gameState.running) return; // Si el juego no está en marcha, salir

      gameState.ball.x += gameState.ball.speedX;
      gameState.ball.y += gameState.ball.speedY;

      if (gameState.ball.y <= 0 || gameState.ball.y >= 400) {
        gameState.ball.speedY *= -1;
      }

      Object.keys(gameState.players).forEach(playerId => {
        const player = gameState.players[playerId];

        if (
          (gameState.ball.x <= player.x + 10 && gameState.ball.x >= player.x) ||
          (gameState.ball.x >= player.x - 10 && gameState.ball.x <= player.x)
        ) {
          if (gameState.ball.y >= player.y && gameState.ball.y <= player.y + 80) {
            gameState.ball.speedX *= -1;
          }
        }
      });

      if (gameState.ball.x <= 0) {
        gameState.scores.player2 += 1;
        checkGameOver();
        resetBall();
      } else if (gameState.ball.x >= 600) {
        gameState.scores.player1 += 1;
        checkGameOver();
        resetBall();
      }

      fastify.websocketGames.forEach(client => {
        if (client.socket.readyState === client.socket.OPEN) {
          client.socket.send(JSON.stringify({ type: "update", gameState }));
        }
      });

      setTimeout(updateGame, 1000 / 30);
    }

    updateGame();
  }

  // Verificar si el juego ha terminado (un jugador llega a 4 puntos)
  function checkGameOver() {
    if (gameState.scores.player1 >= 4) {
      endGame("Jugador 1 gana!");
    } else if (gameState.scores.player2 >= 4) {
      endGame("Jugador 2 gana!");
    }
  }

  // Detener el juego y notificar a los clientes
  function endGame(winnerMessage) {
    gameState.running = false;
    
    fastify.websocketGames.forEach(client => {
      if (client.socket.readyState === client.socket.OPEN) {
        client.socket.send(JSON.stringify({ type: "end", message: winnerMessage }));
      }
    });

    // Reiniciar el estado del juego
    gameState.ball = { x: 300, y: 200, speedX: 5, speedY: 5 };
    gameState.scores = { player1: 0, player2: 0 };
  }

  // Reiniciar la pelota en el centro después de un punto
  function resetBall() {
    if (!gameState.running) return; // Evita reiniciar si el juego terminó

    gameState.ball.x = 300;
    gameState.ball.y = 200;
    gameState.ball.speedX = gameState.ball.speedX > 0 ? -5 : 5;
    gameState.ball.speedY = 5;

    fastify.websocketGames.forEach(client => {
      if (client.socket.readyState === client.socket.OPEN) {
        client.socket.send(JSON.stringify({ type: "score", scores: gameState.scores }));
      }
    });
  }
}

module.exports = gameRoutes;
