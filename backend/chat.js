

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

      userSockets.set(userId, connection);
      fastify.log.info(`User ${username} connected via WebSocket`);

      connection.on('message', async (rawMessage) => {
        let data;
        try {
          data = JSON.parse(rawMessage);
        } catch (err) {
          connection.send(JSON.stringify({ type: -1, message: "Invalid message format" }));
          return;
        }
      
        const { type } = data;
            
        switch (type) {
          case 0:
            await handleGlobalMessages(connection, userSockets, data);
            break;
          case 1:
            await handleDMs(connection, data, dbGetAsync, dbRunAsync, userSockets);
            break;
          case 2:
            await handleInvite(connection, data, dbGetAsync, userSockets);
            break;
          case 3:
            await handleChatrooms(connection, data, dbGetAsync, dbRunAsync);
            break;
          case 4:
            await handleJoinChannel(connection, data, dbGetAsync, dbRunAsync)
          default:
            connection.send(JSON.stringify({ type, message: "Unknown message type" }));
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


async function handleGlobalMessages(connection, userSockets, data) {
  userSockets.forEach((clientSocket) => {
    if (clientSocket.readyState === clientSocket.OPEN) {
      clientSocket.send(JSON.stringify({
        type:data.type,
        message: data.message,
        sender: connection.username,
        destinatary: null
      }));
    }
  });

  fastify.log.info(`[WebSocket] Broadcasted message from ${connection.username}`);
}

async function handleDMs(connection, userSockets, data, dbGetAsync, dbRunAsync){
  if (!data.destinatary) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `[DM ERROR] No destinatary specified.`,
      sender: "system",
      destinatary: data.destinatary
    }));
    return;
  }
  const recipient = await dbGetAsync('SELECT id FROM users WHERE username = ?', [data.destinatary]);
  if (!recipient) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `[DM ERROR] User '${data.destinatary}' not found.`,
      sender: "system",
      destinatary: data.destinatary
    }));
    fastify.log.warn(`[DM ERROR] User '${data.destinatary}' not found.`)
    return;
  }
  const user1_id = Math.min(connection.userId, recipient.id);
  const user2_id = Math.max(connection.userId, recipient.id);

  // Finding chat 
  let chat = await dbGetAsync(
    'SELECT id FROM chats WHERE user1_id = ? AND user2_id = ?', [user1_id, user2_id]);
  
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
    [chat.id, connection.userId, data.message, 1]
  );
  const recipientSocket = userSockets.get(recipient.id);
  if (recipientSocket && recipientSocket.readyState === recipientSocket.OPEN) {
    recipientSocket.send(JSON.stringify({
      type: data.type,
      message: data.message,
      sender: connection.username,
      destinatary: data.destinatary,
      chatId: chat.id
    }));
  }
  // Dup the message for the sender 
  connection.send(JSON.stringify({
    type: data.type,
    message: data.message,
    sender: connection.username,
    destinatary: data.destinatary,
    chatId: chat.id
  }));
  fastify.log.info(`[WebSocket] DM saved to chat ${chat.id} from ${connection.username} to ${data.destinatary}`);
}

async function handleInvite(connection, userSockets, data, dbGetAsync) {
  if (!data.destinatary) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `[INVITE ERROR] No destinatary specified.`,
      sender: "system",
      destinatary: data.destinatary
    }));
    return;
  }
  const recipient = await dbGetAsync('SELECT id FROM users WHERE username = ?', [data.destinatary]);
  if (!recipient) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `[INVITE ERROR] User '${data.destinatary}' not found.`,
      sender: "system",
      destinatary: null
    }));
    fastify.log.warn(`[INVITE ERROR] User '${data.destinatary}' not found.`)
    return;
  }
  const recipientSocket = userSockets.get(recipient.id);
  if (recipientSocket && recipientSocket.readyState === recipientSocket.OPEN) {
    recipientSocket.send(JSON.stringify({
      type: data.type,
      message: `${connection.username} has invited you to a Pong match!`,
      sender: connection.username,
      destinatary: data.destinatary 
    }));
  }
  connection.send(JSON.stringify({
    type: data.type,
    message: `Pong invite sent to ${data.destinatary}`,
    sender: connection.username,
    destinatary: data.destinatary
  }));
  fastify.log.info(`${connection.username} invited ${data.destinatary}`);
}

async function handleChatrooms(connection, userSockets, data, dbGetAsync, dbRunAsync) {
  if (!data.chatroom_name) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `No chatroom name provided`,
      sender: connection.username,
      chatroom_name: null
    }));
    fastify.log.warn(`[Chatroom] ${connection.username} did not provide chatroom name`);
    return;
  }
  let chatroom = await dbGetAsync("SELECT id FROM chatrooms WHERE name = ?", [data.chatroom_name]);
  if (chatroom) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `Chatroom '${data.chatroom_name}' already exists`,
      sender: connection.username,
      chatroom_name: data.chatroom_name
    }));
    fastify.log.warn(`[Chatroom] ${connection.username} tried to create existing chatroom '${data.chatroom_name}'`);
    return;
  }
  await dbRunAsync(
    "INSERT INTO chatrooms (name, owner_id, is_private, password_hash) VALUES (?, ?, ?, ?)",
    [data.chatroom_name, connection.userId, false, null]
  );
  chatroom = await dbGetAsync("SELECT id FROM chatrooms WHERE name = ?", [data.chatroom_name]);

  await dbRunAsync(
    "INSERT INTO chatroom_members (chatroom_id, user_id, role) VALUES (?, ?, ?)",
    [chatroom.id, connection.userId, 'owner']
  );

  connection.send(JSON.stringify({
    type: data.type,
    message: `Chatroom '${chatroom_name}' was created`,
    sender: connection.username,
    chatroomId: chatroom.id,
    chatroom_name: data.chatroom_name
  }));
  fastify.log.info(`[Chatroom] ${connection.username} created chatroom '${data.chatroom_name}'`);
}


async function handleJoinChannel(connection, userSockets, data, dbGetAsync, dbRunAsync) { 
  if (!data.chatroom_name) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `No chatroom name provided`,
      sender: connection.username
    }));
    fastify.log.warn(`[Chatroom] ${connection.username} did not provide chatroom name`);
    return;
  }

  let chatroom = await dbGetAsync("SELECT id FROM chatrooms WHERE name = ?", [data.chatroom_name]);
  if (!chatroom) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `No such chatroom`,
      sender: connection.username
    }));
    fastify.log.warn(`[Chatroom] ${connection.username} wanted to join a room that doesn't exist`);
    return;
  }

  let user = await dbGetAsync("SELECT id FROM chatroom_members WHERE chatroom_id = ? AND user_id = ?", [chatroom.id] [connection.userId]);
  if (user) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `You already are a member of the chatroom ${data.chatroom_name}`,
      sender: connection.username
    }));
    fastify.log.warn(`[Chatroom] ${connection.username} already is a member of the chatroom ${data.chatroom_name}`);
    return;
  }
  await dbRunAsync("INSERT INTO chatroom_members (chatroom_id, user_id, role, is_muted, is_banned) VALUES (?, ?, 'member', 0, 0)", connection.userId, chatroom.id);
  connection.send(JSON.stringify({
    type: data.type,
    message: `Joined chatroom '${data.chatroom_name}' successfully`,
    chatroomId: chatroom.id,
    sender: connection.username
  }));
  fastify.log.info(`[Chatroom] ${connection.username} joined chatroom '${data.chatroom_name}'`);
}
