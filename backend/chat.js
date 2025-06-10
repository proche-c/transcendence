/*
      FROM FRONT I NEED:
type - always
Normalmente ya tengo la info sobre el usuario que envie cosas,
y siempre devuelvo el type, el mensaje mio(en el caso de error, es la causa del error, 
o si todo está bien, también devuelvo el mensaje con la info (está en message))
type 0(global): message
type 1(dms): message, destinatary (devuelvo todo + chatID)
type 2(invite): message, destinatary
type 3(create chatroom): chatroom_name, password (if the channel is private, 
            also if it is private, need to change the bool in the db to True) (devuelvo todo + chatroomID )
type 4(join channel): chatroom_name, password(if channel is private)
type 5(send chatroom message): message, chatroom_name
type 6(set admin): chatroom_name, destinatary
type 7(block user (not in the chatroom)): destinatary
type 8(unblock user): destinatary
type 9(ban in the chat): destinatary, chatroom_name
type 10(unban in the chat): destinatary, chatroom_name
type 11(mute in the chat): destinatary, chatroom_name
type 12(unmute in the chat): destinatary, chatroom_name
*/

const {
  handleChatrooms,
  handleJoinChannel,
  handleChatMessages,
  handleSetAdmin,
  handleBanUser,
  handleUnbanUser,
  handleMuteUser,
  handleUnmuteUser,
  handleKickUser
} = require('./chatroomHandler');

const xss = require('xss');
function sanitizeInput(input) {
  return typeof input === 'string' ? xss(input.trim()) : input;
}

async function chatRoutes(fastify, options) {
  const bcrypt = options.bcrypt;
  const db = options.db; 
  const dbGetAsync = options.dbGetAsync;
  const dbRunAsync = options.dbRunAsync;
  const dbAllAsync = options.dbAllAsync;
  const userSockets = new Map();

  fastify.get('/', { websocket: true }, async (connection, req) => {
    try {
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
        if (typeof data.message === 'string') {
          data.message = sanitizeInput(data.message);
        }
        if (typeof data.password === 'string') {
          data.password = sanitizeInput(data.password);
        }
        if (typeof data.destinatary === 'string') {
          data.destinatary = sanitizeInput(data.destinatary);
        }
        if (typeof data.chatroomName === 'string') {
          data.chatroomName = sanitizeInput(data.chatroom_name);
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
            await handleSetAdmin(connection, data, dbGetAsync, dbRunAsync, fastify);
            break; 
          case 7:
            await handleBlockUser(connection, data, dbGetAsync, dbRunAsync, fastify)
            break;
          case 8: 
            await handleUnblockUser(connection, data, dbGetAsync, dbRunAsync, fastify);
            break;
          case 9:
            await handleBanUser(connection, data, dbGetAsync, dbRunAsync, userSockets, fastify);
            break;
          case 10:
            await handleUnbanUser(connection, data, dbGetAsync, dbRunAsync, fastify);
            break;
          case 11:
            await handleMuteUser(connection, data, dbGetAsync, dbRunAsync, fastify);
            break;
          case 12:
            await handleUnmuteUser(connection, data, dbGetAsync, dbRunAsync, fastify);
            break;
          case 13:
            await handleKickUser(connection, data, dbGetAsync, dbRunAsync,fastify, userSockets)
            break;
          case 'ping':
            break;
          default:
            connection.send(JSON.stringify({ type: data.type, message: "Unknown message type" }));    
        }
      });
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

async function handleGlobalMessages(connection, userSockets, data, fastify) {
  if (!data.message || typeof data.message !== 'string' || !data.message.trim()) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `[Global Message ERROR] Cannot send empty message.`,
      sender: "system", // i dont know here "system" or the sender's username/id
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
  const isBlocked = await dbGetAsync('SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?', [recipient.id, connection.userId]);
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
  if (isBlocked) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `[DM ERROR] You are blocked by ${data.destinatary}.`,
      sender: "system"
    }));
    fastify.log.warn(`[DM BLOCKED] ${connection.username} tried to DM ${data.destinatary} but was blocked.`);
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
  const isBlocked = await dbGetAsync( 'SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?', [recipient.id, connection.userId]);
  if (isBlocked) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `[INVITE ERROR] You are blocked by ${data.destinatary}.`,
      sender: "system"
    }));
    fastify.log.warn(`[INVITE BLOCKED] ${connection.username} tried to invite ${data.destinatary} but was blocked.`);
    return;
  }
  
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

async function handleBlockUser(connection, data, dbGetAsync, dbRunAsync, fastify) {
  if (!data.destinatary) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `[BLOCK ERROR] No destinatary specified.`,
      sender: "system",
      destinatary: data.destinatary
    }));
    return;
  }
  const recipient = await dbGetAsync('SELECT id FROM users WHERE username = ?', [data.destinatary]);
  if (!recipient) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `[BLOCK ERROR] User '${data.destinatary}' not found.`,
      sender: "system",
      destinatary: null
    }));
    fastify.log.warn(`[BLOCK ERROR] User '${data.destinatary}' not found.`);
    return;
  }
  const alreadyBlocked = await dbGetAsync(
    'SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
    [connection.userId, recipient.id]
  );
  if (alreadyBlocked) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `${data.destinatary} is already blocked.`,
      sender: "system"
    }));
    return;
  }
  await dbRunAsync(
    "INSERT INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)",
    [connection.userId, recipient.id]);
  connection.send(JSON.stringify({
    type: data.type,
    message: `You blocked ${data.destinatary} successfully`,
    sender: connection.username,
    destinatary: data.destinatary
  }));

  fastify.log.info(`[WebSocket: block] ${connection.username} blocked ${data.destinatary}`);
}

async function handleUnblockUser(connection, data, dbGetAsync, dbRunAsync, fastify) {
  if (!data.destinatary) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `[UNBLOCK ERROR] No destinatary specified.`,
      sender: "system",
      destinatary: data.destinatary
    }));
    return;
  }
  const recipient = await dbGetAsync('SELECT id FROM users WHERE username = ?', [data.destinatary]);
  if (!recipient) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `[UNBLOCK ERROR] User '${data.destinatary}' not found.`,
      sender: "system",
      destinatary: null
    }));
    fastify.log.warn(`[UNBLOCK ERROR] User '${data.destinatary}' not found.`);
    return;
  }
  const blocked = await dbGetAsync('SELECT * FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?', [connection.userId, recipient.id]);
  if (!blocked) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `${data.destinatary} is not blocked.`,
    }));
    return;
  }
  await dbRunAsync('DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',[connection.userId, recipient.id]);
  connection.send(JSON.stringify({
    type: data.type,
    message: `You unblocked ${data.destinatary} successfully`,
    sender: connection.username,
    destinatary: data.destinatary
  }));
  fastify.log.info(`[WebSocket: unblock] ${connection.username} unblocked ${data.destinatary}`);
}

