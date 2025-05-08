async function gameRoutes(fastify, options) {
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
          const pn = connection.playerNumber;
          if (pn === 1 || pn === 2) {
            gameState.players[`player${pn}`].y = data.y;
          }
        }

        if (data.type === "start" && data.message === "jugar" && !gameState.running && playerNumber == 2) {
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

    gameState.ball = { x: 400, y: 250, speedX: 5, speedY: 5 };
    gameState.scores = { player1: 0, player2: 0 };
  }

  function resetBall() {
    if (!gameState.running) return;

    gameState.ball.x = 400;
    gameState.ball.y = 250;
    gameState.ball.speedX = gameState.ball.speedX > 0 ? -10 : 10;
    gameState.ball.speedY = 0;

    fastify.websocketGames.forEach(client => {
      if (client.socket.readyState === client.socket.OPEN) {
        client.socket.send(JSON.stringify({ type: "score", scores: gameState.scores }));
      }
    });
  }
}

module.exports = gameRoutes;
