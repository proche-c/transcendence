async function chatRoutes(fastify, options) {
  fastify.get('/', { websocket: true }, (connection, req) => {
    try {
      if (!fastify.websocketClients) {
        fastify.websocketClients = [];
      }

      fastify.websocketClients.push(connection);

      fastify.log.info(`New chat client connected: ${req.socket.remoteAddress}`);

      connection.on('message', (message) => {
        fastify.log.info(`Received message: ${message}`);

        fastify.websocketClients.forEach((clientSocket) => {
          if (clientSocket.readyState === clientSocket.OPEN) {
            clientSocket.send(message);
          }
        });
      });

      connection.on('close', () => {
        fastify.websocketClients = fastify.websocketClients.filter(
          (socket) => socket !== connection
        );
        fastify.log.info(`Client disconnected: ${req.socket.remoteAddress}`);
      });

    } catch (err) {
      fastify.log.error({ err }, 'WebSocket error during connection');
    }
  });
}

module.exports = chatRoutes;
