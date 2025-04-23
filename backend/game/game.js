async function gameRoutes(fastify, options) {
  if (!fastify.websocketGames) {
    fastify.websocketGames = [];
  }

  // Estado del juego con ambos jugadores inicializados
  const gameState = {
    running: false,
    players: {
      player1: { x: 20, y: 150 },
      player2: { x: 560, y: 150 }
    },
    ball: { x: 300, y: 200, speedX: 5, speedY: 5 },
    scores: { player1: 0, player2: 0 }
  };

  fastify.get('/game', { websocket: true }, (connection, req) => {
    try {
      const playerId = Math.random().toString(36).substring(2, 10);
      const playerNumber = !fastify.websocketGames.find(c => c.playerNumber === 1) ? 1 : 2;

      if (fastify.websocketGames.length >= 2) {
        connection.socket.send(JSON.stringify({ type: "error", message: "Sala llena" }));
        connection.socket.close();
        return;
      }

      connection.playerNumber = playerNumber;
      connection.playerId = playerId;

      fastify.websocketGames.push(connection);
      fastify.log.info(`Jugador ${playerNumber} conectado: ${playerId}`);

      connection.socket.send(JSON.stringify({ type: "init", playerId, playerNumber, gameState }));

      connection.socket.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === "move") {
          console.log(`Received move from player ${connection.playerNumber}: y=${data.y}`);
          const pn = connection.playerNumber;
          if (pn === 1 || pn === 2) {
            gameState.players[`player${pn}`].y = data.y;
          }
        }

        if (data.type === "start" && data.message === "jugar" && !gameState.running) {
          gameState.running = true;
          startGame();
        }
      });

      connection.socket.on('close', () => {
        fastify.websocketGames = fastify.websocketGames.filter(client => client !== connection);
        fastify.log.info(`Jugador desconectado: ${playerId}`);
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

      if (gameState.ball.y <= 0 || gameState.ball.y >= 400) {
        gameState.ball.speedY *= -1;
      }

      ["player1", "player2"].forEach(playerKey => {
        const player = gameState.players[playerKey];

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

      setTimeout(updateGame, 1000 / 60);
    }

    updateGame();
  }

  function checkGameOver() {
    if (gameState.scores.player1 >= 4) {
      endGame("Jugador 1 gana!");
    } else if (gameState.scores.player2 >= 4) {
      endGame("Jugador 2 gana!");
    }
  }

  function endGame(winnerMessage) {
    gameState.running = false;

    fastify.websocketGames.forEach(client => {
      if (client.socket.readyState === client.socket.OPEN) {
        client.socket.send(JSON.stringify({ type: "end", message: winnerMessage }));
      }
    });

    gameState.ball = { x: 300, y: 200, speedX: 5, speedY: 5 };
    gameState.scores = { player1: 0, player2: 0 };
  }

  function resetBall() {
    if (!gameState.running) return;

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
