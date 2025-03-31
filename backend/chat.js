async function chatRoutes(fastify, options) {
  const db = options.db; // getting the db passed from server.js
  const dbGetAsync = options.dbGetAsync;
  const dbRunAsync = options.dbRunAsync;
  // Creating a map to store user sockets: key = userId, value = connection instance
  const userSockets = new Map();

  fastify.get('/', { websocket: true }, async (connection, req) => {
    try {
      // Extract token from query string to authenticate
      // const query = new URLSearchParams(req.url.split('?')[1]);
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
      
        const { type, message, destinatary } = data;
      
        if (typeof message !== 'string') {
          fastify.log.warn(`[WebSocket] Invalid or missing 'message' from ${connection.username}: ${rawMessage}`);
          return;
        }
      
        const senderId = connection.userId;
      
        //  Only broadcast global messages
        if (type === 0) {
          userSockets.forEach((clientSocket) => {
            if (clientSocket.readyState === clientSocket.OPEN) {
              clientSocket.send(JSON.stringify({
                type,
                message,
                sender: connection.username,
                destinatary: null
              }));
            }
          });
      
          fastify.log.info(`[WebSocket] Broadcasted message from ${connection.username}`);
        }
       // Handling dms
        else if (type === 1) {
          if (!destinatary) {
            connection.send(JSON.stringify({
              type,
              message: `[DM ERROR] No destinatary specified.`,
              sender: "system",
              destinatary
            }));
            return;
          }

          const recipient = await dbGetAsync('SELECT id FROM users WHERE username = ?', [destinatary]);
          if (!recipient) {
            connection.send(JSON.stringify({
              type,
              message: `[DM ERROR] User '${destinatary}' not found.`,
              sender: "system",
              destinatary
            }));
            fastify.log.warn(`[DM ERROR] User '${destinatary}' not found.`)
            return;
          }

          const user1_id = Math.min(connection.userId, recipient.id);
          const user2_id = Math.max(connection.userId, recipient.id);

          // Finding chat 
          let chat = await dbGetAsync(
            'SELECT id FROM chats WHERE user1_id = ? AND user2_id = ?',
            [user1_id, user2_id]
          );
          // if chat doesn't exist, creating it
          if (!chat) {
            await dbRunAsync(
              'INSERT INTO chats (user1_id, user2_id) VALUES (?, ?)',
              [user1_id, user2_id]
            );
            chat = await dbGetAsync(
              'SELECT id FROM chats WHERE user1_id = ? AND user2_id = ?',
              [user1_id, user2_id]
            );
          }

          // Save message with chat_id
          await dbRunAsync(
            'INSERT INTO messages (chat_id, sender_id, message, type) VALUES (?, ?, ?, ?)',
            [chat.id, connection.userId, message, 1]
          );

          const responseData = {
            type,
            message,
            sender: connection.username,
            destinatary,
            chatId: chat.id
          };

          const recipientSocket = userSockets.get(recipient.id);
          if (recipientSocket && recipientSocket.readyState === recipientSocket.OPEN) {
            recipientSocket.send(JSON.stringify(responseData));
          }

          connection.send(JSON.stringify(responseData));

          fastify.log.info(`[WebSocket] DM saved to chat ${chat.id} from ${connection.username} to ${destinatary}`);
        }
        // type 2 = invite
        // inviting to play 
        else if (type === 2) {
          if (!destinatary) {
            connection.send(JSON.stringify({
              type,
              message: `[INVITE ERROR] No destinatary specified.`,
              sender: "system",
              destinatary
            }));
            return;
          }

          const recipient = await dbGetAsync('SELECT id FROM users WHERE username = ?', [destinatary]);
          if (!recipient) {
            connection.send(JSON.stringify({
              type,
              message: `[INVITE ERROR] User '${destinatary}' not found.`,
              sender: "system",
              destinatary
            }));
            fastify.log.warn(`[DM ERROR] User '${destinatary}' not found.`)
            return;
          }

          const recipientSocket = userSockets.get(recipient.id);
          if (recipientSocket && recipientSocket.readyState === recipientSocket.OPEN) {
            recipientSocket.send(JSON.stringify({
              type,
              message: `${connection.username} has invited you to a Pong match!`,
              sender: connection.username,
              destinatary
            }));
          }
          connection.send(JSON.stringify({
            type,
            message: `Pong invite sent to ${destinatary}`,
            sender: connection.username,
            destinatary
          }));
          fastify.log.info(`[WebSocket] ${connection.username} invited ${destinatary}`);
        }
      });
  
      // Handling disconnection
      connection.on('close', () => {
        userSockets.delete(userId);
        fastify.log.info(`User ${username} disconnected`);
      });

    } catch (err) {
      fastify.log.error({ err }, 'WebSocket error during connection');
    }
  });

  // Exposing the userSockets map globally in Fastify
  fastify.decorate('userSockets', userSockets);
}

module.exports = chatRoutes;