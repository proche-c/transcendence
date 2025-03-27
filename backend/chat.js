async function chatRoutes(fastify, options) {
  // Creating a map to store the socket and userID(key = userID, value = connection socket)
  const userSockets = new Map();

  fastify.get('/', { websocket: true }, async (connection, req) => {
    try {

      // searching for token to prevent unauthenticated access
      const query = new URLSearchParams(req.url.split('?')[1]);
      const token = query.get('token');

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
      userSockets.set(userId, connection);
      fastify.log.info(`User ${username} connected via WebSocket`);

      connection.on('message', (message) => {
        fastify.log.info(`Message from ${username}: ${message}`);

        userSockets.forEach((clientSocket, id) => {
          if (clientSocket.readyState === clientSocket.OPEN && id !== userId) {
            clientSocket.send(`${username}: ${message}`);
          }
        });
      });

      connection.on('close', () => {
        userSockets.delete(userId);
        fastify.log.info(`User ${username} disconnected`);
      });

    } catch (err) {
      fastify.log.error({ err }, 'WebSocket error during connection');
    }
  });
  fastify.decorate('userSockets', userSockets);

}

module.exports = chatRoutes;
