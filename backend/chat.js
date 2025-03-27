async function chatRoutes(fastify, options) {
  // Creating a map to store user sockets: key = userId, value = connection instance
  const userSockets = new Map();

  fastify.get('/', { websocket: true }, async (connection, req) => {
    try {
      // Extract token from query string to authenticate
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

      // Attaching user data to the connection
      connection.userId = userId;
      connection.username = username;

      // Storing the connection in the map
      userSockets.set(userId, connection);
      fastify.log.info(`User ${username} connected via WebSocket`);

      // Handling incoming messages (rawMessage = string from the front)
      connection.on('message', async (rawMessage) => {
        fastify.log.info(`[WebSocket] Received raw message: ${rawMessage}`);
      
        let data;
        try {
          data = JSON.parse(rawMessage);
          fastify.log.debug({ data }, '[WebSocket] Parsed message successfully');
        } catch (err) {
          fastify.log.warn(`[WebSocket] Invalid JSON format from user ${connection.username}: ${rawMessage}`);
          return;
        }
      
        const { type, message } = data;
      
        if (typeof message !== 'string') {
          fastify.log.warn(`[WebSocket] Invalid or missing 'message' from ${connection.username}: ${rawMessage}`);
          return;
        }
      
        fastify.log.info(`[WebSocket] Message type "${type}" from ${connection.username}: ${message}`);
      
        //  Only broadcast global messages
        if (type === 0) {
          userSockets.forEach((clientSocket) => {
            if (
              clientSocket.readyState === clientSocket.OPEN &&
              clientSocket !== connection
            ) {
              clientSocket.send(`${connection.username}: ${message}`);
            }
          });
      
          fastify.log.info(`[WebSocket] Broadcasted message from ${connection.username} to ${userSockets.size - 1} clients`);
        }
      });
      // Need to handle more message types here
      // Handling disconnection
      connection.on('close', () => {
        userSockets.delete(userId);
        fastify.log.info(`User ${username} disconnected`);
      });

    } catch (err) {
      fastify.log.error({ err }, 'WebSocket error during connection');
    }
  });

  // Expose the userSockets map globally in Fastify
  fastify.decorate('userSockets', userSockets);
}

module.exports = chatRoutes;
