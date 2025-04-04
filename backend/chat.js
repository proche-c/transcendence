async function chatRoutes(fastify, options) {
  const db = options.db; // getting the db passed from server.js
  const dbGetAsync = options.dbGetAsync;
  const dbRunAsync = options.dbRunAsync;
  const dbAllAsync = options.dbAllAsync;
  const userSockets = new Map();

  fastify.get('/', { websocket: true }, async (connection, req) => {
    try {
      // Extract token from query string to authenticate
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
                  
        switch (data.type) {
          case 0:
            await handleGlobalMessages(connection, userSockets, data, fastify);
            break;
          case 1:
            await handleDMs(connection, data, dbGetAsync, dbRunAsync, userSockets, fastify);
            break;
          case 2:
            await handleInvite(connection, data, dbGetAsync, userSockets, fastify);
            break;
          case 3:
            await handleChatrooms(connection, data, dbGetAsync, dbRunAsync, fastify);
            break;
          case 4:
            await handleJoinChannel(connection, data, dbGetAsync, dbRunAsync, fastify);
            break;
          case 5:
            await handleChatMessages(connection, data, userSockets, dbGetAsync, dbRunAsync, dbAllAsync, fastify);
            break;
          case 6: 
            await handleSetAdmin(connection, data, userSockets, dbGetAsync, dbRunAsync, dbAllAsync);
            break;  
          default:
            connection.send(JSON.stringify({ type: data.type, message: "Unknown message type" }));    
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

/*----------------HANDLING MESSAGES ----------------*/

async function handleGlobalMessages(connection, userSockets, data, fastify) {
  if (!data.message || typeof data.message !== 'string' || !data.message.trim()) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `[Global Message ERROR] Cannot send empty message.`,
      sender: "system",
    }));
    return;
  }
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




async function handleDMs(connection, data, dbGetAsync, dbRunAsync, userSockets, fastify) {
  if (!data.destinatary) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `[DM ERROR] No destinatary specified.`,
      sender: "system",
      destinatary: data.destinatary
    }));
    return;
  }
  if (!data.message || typeof data.message !== 'string' || !data.message.trim()) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `[DM ERROR] Cannot send empty message.`,
      sender: "system",
      destinatary: data.destinatary
    }));
    return;
  }  
  const recipient = await dbGetAsync('SELECT id FROM users WHERE username = ?', [data.destinatary]);
  
    //PROBABLY HERE WILL NEED TO HANDLE THE BLOCKED USERS!!!!!!!!!!!

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
 
  let chat = await dbGetAsync(
    'SELECT id FROM chats WHERE user1_id = ? AND user2_id = ?', [user1_id, user2_id]);
  
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

  await dbRunAsync(
    'INSERT INTO messages (chat_id, sender_id, message, type) VALUES (?, ?, ?, ?)',
    [chat.id, connection.userId, data.message, 1] );

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
  connection.send(JSON.stringify({
    type: data.type,
    message: data.message,
    sender: connection.username,
    destinatary: data.destinatary,
    chatId: chat.id
  }));  
  fastify.log.info(`[WebSocket: DMs] DM saved to chat ${chat.id} from ${connection.username} to ${data.destinatary}`);
}



async function handleInvite(connection, data, dbGetAsync, userSockets, fastify) {
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
  
  //PROBABLY HERE WILL NEED TO HANDLE THE BLOCKED USERS!!!!!!!!!!!

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
  fastify.log.info(`[Websocket: invite]${connection.username} invited ${data.destinatary}`);
}

/*----------------HANDLING CHATROOMS MESSAGES AND GENERAL ----------------*/


async function handleChatrooms(connection, data, dbGetAsync, dbRunAsync, fastify) {
  if (!data.chatroom_name) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `No chatroom name provided`,
      sender: "system",
      chatroom_name: null
    }));
    fastify.log.warn(`[Chatroom] ${connection.username} did not provide chatroom name`);
    return;
  }

  if (data.chatroom_name.length > 50) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `Chatroom name too long (max 50 characters).`,
      sender: "system",
      chatroom_name: data.chatroom_name
    }));
    fastify.log.warn(`[Chatroom] ${connection.username} tried to create a chatroom with a name that's too long`);
    return;
  }
  
  let chatroom = await dbGetAsync("SELECT id FROM chatrooms WHERE name = ?", [data.chatroom_name]);
  if (chatroom) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `Chatroom '${data.chatroom_name}' already exists`,
      sender: "system",
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
    message: `Chatroom '${data.chatroom_name}' was created`,
    sender: connection.username,
    chatroomId: chatroom.id,
    chatroom_name: data.chatroom_name
  }));
  fastify.log.info(`[Chatroom] ${connection.username} created chatroom '${data.chatroom_name}'`);
}




async function handleJoinChannel(connection, data, dbGetAsync, dbRunAsync, fastify) {
  if (!data.chatroom_name) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `No chatroom name provided`,
      sender: "system"
    }));
    fastify.log.warn(`[Chatroom] ${connection.username} did not provide chatroom name`);
    return;
  }

  const chatroom = await dbGetAsync("SELECT id FROM chatrooms WHERE name = ?", [data.chatroom_name]);
  if (!chatroom) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `No such chatroom`,
      sender: "system"
    }));
    fastify.log.warn(`[Chatroom] ${connection.username} tried to join non-existent chatroom '${data.chatroom_name}'`);
    return;
  }

  const user = await dbGetAsync("SELECT * FROM chatroom_members WHERE chatroom_id = ? AND user_id = ?", [chatroom.id, connection.userId]);

  if (user) {
    if (user.is_banned) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `You are banned from the chatroom ${data.chatroom_name}`,
        sender: "system",
        chatroomId: chatroom.id,
        chatroom_name: data.chatroom_name
      }));
      fastify.log.warn(`[Chatroom] ${connection.username} (banned) tried to rejoin chatroom '${data.chatroom_name}'`);
      return;
    }

    connection.send(JSON.stringify({
      type: data.type,
      message: `You are already a member of the chatroom ${data.chatroom_name}`,
      sender: "system",
      chatroomId: chatroom.id,
      chatroom_name: data.chatroom_name
    }));
    fastify.log.info(`[Chatroom] ${connection.username} tried to rejoin chatroom '${data.chatroom_name}'`);
    return;
  }

  await dbRunAsync("INSERT INTO chatroom_members (chatroom_id, user_id, role, is_muted, is_banned) VALUES (?, ?, 'member', 0, 0)", [chatroom.id, connection.userId]);

  connection.send(JSON.stringify({
    type: data.type,
    message: `Joined chatroom '${data.chatroom_name}' successfully`,
    chatroomId: chatroom.id,
    chatroom_name: data.chatroom_name,
    sender: connection.username
  }));
  fastify.log.info(`[Chatroom] ${connection.username} joined chatroom '${data.chatroom_name}'`);
}



async function handleChatMessages (connection, data, userSockets, dbGetAsync, dbRunAsync, dbAllAsync, fastify) {
  if (!data.chatroom_name) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `No chatroom name provided`,
      sender: "system"
    }));
    fastify.log.warn(`[Chatroom] ${connection.username} did not provide chatroom name`);
    return;
  }

  let chatroom = await dbGetAsync("SELECT id FROM chatrooms WHERE name = ?", [data.chatroom_name]);
  if (!chatroom) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `No such chatroom`,
      sender: "system",
      chatroom_name: data.chatroom_name,
    }));
    fastify.log.warn(`[Chatroom] ${connection.username} tried to send a message to a non-existent room '${data.chatroom_name}'`);
    return;
  }

  const user = await dbGetAsync("SELECT * FROM chatroom_members WHERE chatroom_id = ? AND user_id = ?", [chatroom.id, connection.userId]);
  if (!user) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `You are not a member of the chatroom ${data.chatroom_name}`,
      sender: "system",
      chatroom_name: data.chatroom_name,
      chatroomId: chatroom.id
    }));
    fastify.log.warn(`[Chatroom] ${connection.username} tried to send message to chatroom '${data.chatroom_name}' without membership`);
    return;
  }

  if (user.is_banned || user.is_muted) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `You are banned or muted from the chatroom ${data.chatroom_name}`,
      sender: "system",
      chatroom_name: data.chatroom_name,
      chatroomId: chatroom.id
    }));
    fastify.log.warn(`[Chatroom] ${connection.username} (banned/muted) tried to send message in '${data.chatroom_name}'`);
    return;
  }

  if (!data.message || typeof data.message !== 'string' || !data.message.trim()) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `Cannot send empty message`,
      sender: "system"
    }));
    return;
  }

  await dbRunAsync("INSERT INTO chatroom_messages (chatroom_id, sender_id, message) VALUES (?, ?, ?)", [chatroom.id, connection.userId, data.message]);

  const chat_members = await dbAllAsync("SELECT user_id FROM chatroom_members WHERE chatroom_id = ? AND is_banned = 0 AND is_muted = 0", [chatroom.id]);

  let deliveredCount = 0;

  for (const member of chat_members) {
    const memberSocket = userSockets.get(member.user_id);
    if (memberSocket && memberSocket.readyState === memberSocket.OPEN) {
      memberSocket.send(JSON.stringify({
        type: data.type,
        message: data.message,
        sender: connection.username,
        chatroomId: chatroom.id,
        chatroom_name: data.chatroom_name
      }));
      deliveredCount++;
    }
  }
  fastify.log.info(`[Chatroom] ${connection.username} sent message to '${data.chatroom_name}' — delivered to ${deliveredCount} users`);
}

/*----------------HANDLING CHATROOMS (ADMIN/OWNER STUFF) ----------------*/


// here i need to receive also the potential admin nick (targetUser)
async function handleSetAdmin(connection, data, userSockets, dbGetAsync, dbRunAsync, dbAllAsync, fastify) {
  if (!data.chatroom_name || !data.targetUser) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `Chatroom name and target user are required.`,
      sender: "system"
    }));
    return;
  }

  const chatroom = await dbGetAsync("SELECT id FROM chatrooms WHERE name = ?", [data.chatroom_name]);
  if (!chatroom) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `Chatroom '${data.chatroom_name}' does not exist.`,
      sender: "system"
    }));
    fastify.log.warn(`[Chatroom: set admin] ${connection.username} tried to access non-existent chatroom '${data.chatroom_name}'`);
    return;
  }

  const user = await dbGetAsync("SELECT * FROM chatroom_members WHERE chatroom_id = ? AND user_id = ?", [chatroom.id, connection.userId]);
  if (!user || user.role !== 'owner') {
    connection.send(JSON.stringify({
      type: data.type,
      message: `Only the chatroom owner can assign admins.`,
      sender: "system"
    }));
    fastify.log.warn(`[Chatroom: set admin] ${connection.username} is not the owner of '${data.chatroom_name}'`);
    return;
  }

  const targetUserId = await dbGetAsync("SELECT id FROM users WHERE username = ?", [data.targetUser]);
  if (!targetUserId) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `User '${data.targetUser}' not found.`,
      sender: "system"
    }));
    fastify.log.warn(`[Chatroom: set admin] Target user '${data.targetUser}' not found.`);
    return;
  }

  const targetMembership = await dbGetAsync("SELECT * FROM chatroom_members WHERE chatroom_id = ? AND user_id = ?", [chatroom.id, targetUserId.id]);
  if (!targetMembership || targetMembership.is_banned || targetMembership.is_muted) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `User '${data.targetUser}' must be a member and not muted or banned to become admin.`,
      sender: "system"
    }));
    fastify.log.warn(`[Chatroom: set admin] ${data.targetUser} is either not a member or is muted/banned in '${data.chatroom_name}'`);
    return;
  }

  await dbRunAsync("UPDATE chatroom_members SET role = 'admin' WHERE chatroom_id = ? AND user_id = ?", [chatroom.id, targetUserId.id]);

  connection.send(JSON.stringify({
    type: data.type,
    message: `${data.targetUser} is now an admin in '${data.chatroom_name}'`,
    chatroomId: chatroom.id,
    chatroom_name: data.chatroom_name,
    sender: "system"
  }));

  fastify.log.info(`[Chatroom: set admin] ${connection.username} set ${data.targetUser} as an admin in '${data.chatroom_name}'`);
}
