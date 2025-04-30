const bcrypt = require('bcrypt');

async function handleChatrooms(connection, data, dbGetAsync, dbRunAsync, fastify) {
  if (!data.chatroom_name) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `No chatroom name provided`,
      sender: "system"
    }));
    return;
  }
  let is_private = !!data.is_private;
  let password_hash = null;
  if (is_private) {
    if (!data.password || data.password.length < 4) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `Private chatroom requires a password (min 4 characters).`,
        sender: "system"
      }));
      return;
    }
    password_hash = await bcrypt.hash(data.password, 10);
  }
  let chatroom = await dbGetAsync("SELECT id FROM chatrooms WHERE name = ?", [data.chatroom_name]);
  if (chatroom) {
    connection.send(JSON.stringify({
      type: data.type,
      message: `Chatroom '${data.chatroom_name}' already exists.`,
      sender: "system"
    }));
    return;
  }
  await dbRunAsync("INSERT INTO chatrooms (name, owner_id, is_private, password_hash) VALUES (?, ?, ?, ?)", [data.chatroom_name, connection.userId, is_private, password_hash]);
  chatroom = await dbGetAsync("SELECT id FROM chatrooms WHERE name = ?", [data.chatroom_name]);
  await dbRunAsync("INSERT INTO chatroom_members (chatroom_id, user_id, role) VALUES (?, ?, ?)", [chatroom.id, connection.userId, 'owner']);
  connection.send(JSON.stringify({
    type: data.type,
    message: `Chatroom '${data.chatroom_name}' created${is_private ? " (private)" : ""}`,
    chatroomId: chatroom.id,
    chatroom_name: data.chatroom_name,
    sender: connection.username
  }));
  fastify.log.info(`[Chatroom] ${connection.username} created ${is_private ? "private" : "public"} chatroom '${data.chatroom_name}'`);
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
    if (chatroom.is_private) {
        if (!data.password) {
          connection.send(JSON.stringify({
            type: data.type,
            message: `Password required to join '${data.chatroom_name}'`,
            sender: "system"
          }));
          return;
        }
        const match = await bcrypt.compare(data.password, chatroom.password_hash);
        if (!match) {
          connection.send(JSON.stringify({
            type: data.type,
            message: `Incorrect password for '${data.chatroom_name}'`,
            sender: "system"
          }));
          return;
        }
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

async function handleSetAdmin(connection, data, dbGetAsync, dbRunAsync, fastify) {
    if (!data.chatroom_name || !data.destinatary) {
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
    const destinataryId = await dbGetAsync("SELECT id FROM users WHERE username = ?", [data.destinatary]);
    if (!destinataryId) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `User '${data.destinatary}' not found.`,
        sender: "system"
      }));
      fastify.log.warn(`[Chatroom: set admin] Target user '${data.destinatary}' not found.`);
      return;
    }
    const targetMembership = await dbGetAsync("SELECT * FROM chatroom_members WHERE chatroom_id = ? AND user_id = ?", [chatroom.id, destinataryId.id]);
    if (!targetMembership || targetMembership.is_banned || targetMembership.is_muted) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `User '${data.destinatary}' must be a member and not muted or banned to become admin.`,
        sender: "system"
      }));
      fastify.log.warn(`[Chatroom: set admin] ${data.destinatary} is either not a member or is muted/banned in '${data.chatroom_name}'`);
      return;
    }  
    await dbRunAsync("UPDATE chatroom_members SET role = 'admin' WHERE chatroom_id = ? AND user_id = ?", [chatroom.id, destinataryId.id]);  
    connection.send(JSON.stringify({
      type: data.type,
      message: `${data.destinatary} is now an admin in '${data.chatroom_name}'`,
      chatroomId: chatroom.id,
      chatroom_name: data.chatroom_name,
      sender: "system"
    }));
    fastify.log.info(`[Chatroom: set admin] ${connection.username} set ${data.destinatary} as an admin in '${data.chatroom_name}'`);
  }
  
async function handleBanUser(connection, data, dbGetAsync, dbRunAsync, userSockets, fastify) {
    if (!data.destinatary || !data.chatroom_name) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[BAN ERROR] Missing destinatary or chatroom name.`,
        sender: "system"
      }));
      return;
    } 
    const recipient = await dbGetAsync('SELECT id FROM users WHERE username = ?', [data.destinatary]);  
    if (!recipient) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[BAN ERROR] User '${data.destinatary}' not found.`,
        sender: "system"
      }));
      return;
    }   
    if (recipient.id === connection.userId) {
        connection.send(JSON.stringify({
          type: data.type,
          message: `[BAN ERROR] You cannot ban yourself.`,
          sender: "system"
        }));
        return;
      }      
    const chatroom = await dbGetAsync('SELECT id FROM chatrooms WHERE name = ?', [data.chatroom_name]); 
    if (!chatroom) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[BAN ERROR] Chatroom '${data.chatroom_name}' not found.`,
        sender: "system"
      }));
      return;
    }  
    const senderRole = await dbGetAsync('SELECT role FROM chatroom_members WHERE chatroom_id = ? AND user_id = ?', [chatroom.id, connection.userId]);  
    if (!senderRole || !['owner', 'admin'].includes(senderRole.role)) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[BAN ERROR] You are not an admin or owner of this chatroom.`,
        sender: "system"
      }));
      return;
    }  
    const recipientMembership = await dbGetAsync('SELECT is_banned FROM chatroom_members WHERE chatroom_id = ? AND user_id = ?', [chatroom.id, recipient.id]);  
    if (!recipientMembership) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[BAN ERROR] ${data.destinatary} is not in the chatroom.`,
        sender: "system"
      }));
      return;
    }
    if (recipientMembership.is_banned) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `${data.destinatary} is already banned from ${data.chatroom_name}.`,
        sender: "system"
      }));
      return;
    }
    if (recipientMembership.role === 'owner') {
        connection.send(JSON.stringify({
          type: data.type,
          message: `${data.destinatary} is an owner of ${data.chatroom_name} and cannot be banned.`,
          sender: "system"
        }));
        return;
      }
    await dbRunAsync(
      'UPDATE chatroom_members SET is_banned = 1 WHERE chatroom_id = ? AND user_id = ?',
      [chatroom.id, recipient.id]
    );  
    connection.send(JSON.stringify({
      type: data.type,
      message: `You banned ${data.destinatary} from ${data.chatroom_name}`,
      sender: "system"
    }));  
    fastify.log.info(`[WebSocket: ban] ${connection.username} banned ${data.destinatary} from ${data.chatroom_name}`);
    const recipientSocket = [...userSockets.values()].find(sock => sock.userId === recipient.id);
    if (recipientSocket && recipientSocket.readyState === recipientSocket.OPEN) {
      recipientSocket.send(JSON.stringify({
        type: "system",
        message: `You have been banned from ${data.chatroom_name}`,
        chatroom_id: chatroom.id
      }));
    }
  }
  
async function handleUnbanUser(connection, data, dbGetAsync, dbRunAsync, fastify) {
    if (!data.destinatary || !data.chatroom_name) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[UNBAN ERROR] Missing destinatary or chatroom name.`,
        sender: "system"
      }));
      return;
    }
    const destinataryUsername = data.destinatary.trim().toLowerCase();
    const recipient = await dbGetAsync('SELECT id FROM users WHERE LOWER(username) = ?', [destinataryUsername]);
    if (!recipient) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[UNBAN ERROR] User '${data.destinatary}' not found.`,
        sender: "system"
      }));
      return;
    } 
    const chatroom = await dbGetAsync('SELECT id FROM chatrooms WHERE name = ?', [data.chatroom_name]);  
    if (!chatroom) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[UNBAN ERROR] Chatroom '${data.chatroom_name}' not found.`,
        sender: "system"
      }));
      return;
    } 
    const senderRole = await dbGetAsync(
      'SELECT role FROM chatroom_members WHERE chatroom_id = ? AND user_id = ?',
      [chatroom.id, connection.userId]
    ); 
    if (!senderRole || !['admin', 'owner'].includes(senderRole.role)) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[UNBAN ERROR] You are not an admin or owner of this chatroom.`,
        sender: "system"
      }));
      return;
    }  
    const recipientMembership = await dbGetAsync('SELECT is_banned FROM chatroom_members WHERE chatroom_id = ? AND user_id = ?', [chatroom.id, recipient.id]);  
    if (!recipientMembership) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[UNBAN ERROR] ${data.destinatary} is not a member of the chatroom.`,
        sender: "system"
      }));
      return;
    } 
    if (!recipientMembership.is_banned) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `${data.destinatary} is not banned from ${data.chatroom_name}.`,
        sender: "system"
      }));
      return;
    } 
    await dbRunAsync(
      'UPDATE chatroom_members SET is_banned = 0 WHERE chatroom_id = ? AND user_id = ?',
      [chatroom.id, recipient.id]
    );  
    connection.send(JSON.stringify({
      type: data.type,
      message: `You unbanned ${data.destinatary} from ${data.chatroom_name}`,
      sender: "system"
    })); 
    fastify.log.info(`[WebSocket: unban] ${connection.username} unbanned ${data.destinatary} from ${data.chatroom_name}`);
  }
  
async function handleMuteUser(connection, data, dbGetAsync, dbRunAsync, fastify) {
    if (!data.destinatary || !data.chatroom_name) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[MUTE ERROR] Missing destinatary or chatroom name.`,
        sender: "system"
      }));
      return;
    }  
    const recipient = await dbGetAsync('SELECT id FROM users WHERE username = ?', [data.destinatary]);
    if (!recipient) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[MUTE ERROR] User '${data.destinatary}' not found.`,
        sender: "system"
      }));
      return;
    }
    if (recipient.role === 'owner') {
        connection.send(JSON.stringify({
          type: data.type,
          message: `${data.destinatary} is an owner of ${data.chatroom_name} and cannot be muted.`,
          sender: "system"
        }));
        return;
      }  
    const chatroom = await dbGetAsync('SELECT id FROM chatrooms WHERE name = ?', [data.chatroom_name]);
    if (!chatroom) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[MUTE ERROR] Chatroom '${data.chatroom_name}' not found.`,
        sender: "system"
      }));
      return;
    } 
    const senderRole = await dbGetAsync('SELECT role FROM chatroom_members WHERE chatroom_id = ? AND user_id = ?', [chatroom.id, connection.userId]);  
    if (!senderRole || !['admin', 'owner'].includes(senderRole.role)) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[MUTE ERROR] You are not an admin or owner of this chatroom.`,
        sender: "system"
      }));
      return;
    } 
    await dbRunAsync('UPDATE chatroom_members SET is_muted = 1 WHERE chatroom_id = ? AND user_id = ?', [chatroom.id, recipient.id]); 
    connection.send(JSON.stringify({
      type: data.type,
      message: `${data.destinatary} has been muted in ${data.chatroom_name}`,
      sender: "system"
    }));  
    const recipientSocket = [...fastify.userSockets.values()].find(sock => sock.userId === recipient.id);
    if (recipientSocket && recipientSocket.readyState === recipientSocket.OPEN) {
      recipientSocket.send(JSON.stringify({
        type: "system",
        message: `You have been muted in ${data.chatroom_name}.`
      }));
    }  
    fastify.log.info(`[WebSocket: mute] ${connection.username} muted ${data.destinatary} in ${data.chatroom_name}`);
  }
  
async function handleUnmuteUser(connection, data, dbGetAsync, dbRunAsync, fastify) {
    if (!data.destinatary || !data.chatroom_name) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[UNMUTE ERROR] Missing destinatary or chatroom name.`,
        sender: "system"
      }));
      return;
    }  
    const recipient = await dbGetAsync('SELECT id FROM users WHERE username = ?', [data.destinatary]);
    if (!recipient) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[UNMUTE ERROR] User '${data.destinatary}' not found.`,
        sender: "system"
      }));
      return;
    }  
    const chatroom = await dbGetAsync('SELECT id FROM chatrooms WHERE name = ?', [data.chatroom_name]);
    if (!chatroom) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[UNMUTE ERROR] Chatroom '${data.chatroom_name}' not found.`,
        sender: "system"
      }));
      return;
    }  
    const senderRole = await dbGetAsync('SELECT role FROM chatroom_members WHERE chatroom_id = ? AND user_id = ?', [chatroom.id, connection.userId]);  
    if (!senderRole || !['admin', 'owner'].includes(senderRole.role)) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[UNMUTE ERROR] You are not an admin or owner of this chatroom.`,
        sender: "system"
      }));
      return;
    }
    await dbRunAsync('UPDATE chatroom_members SET is_muted = 0 WHERE chatroom_id = ? AND user_id = ?',[chatroom.id, recipient.id]);
    connection.send(JSON.stringify({
      type: data.type,
      message: `${data.destinatary} has been unmuted in ${data.chatroom_name}`,
      sender: "system"
    }));  
    const recipientSocket = [...fastify.userSockets.values()].find(sock => sock.userId === recipient.id);
    if (recipientSocket && recipientSocket.readyState === recipientSocket.OPEN) {
      recipientSocket.send(JSON.stringify({
        type: "system",
        message: `You have been unmuted in ${data.chatroom_name}.`
      }));
    } 
    fastify.log.info(`[WebSocket: unmute] ${connection.username} unmuted ${data.destinatary} in ${data.chatroom_name}`);
  }
  
async function handleKickUser(connection, data, dbGetAsync, dbRunAsync, fastify, userSockets) {
    if (!data.destinatary || !data.chatroom_name) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[KICK ERROR] Missing destinatary or chatroom name.`,
        sender: "system"
      }));
      return;
    }  
    const recipient = await dbGetAsync('SELECT id FROM users WHERE username = ?', [data.destinatary]);
    if (!recipient) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[KICK ERROR] User '${data.destinatary}' not found.`,
        sender: "system"
      }));
      return;
    }
    if (recipient.id === connection.userId) {
        connection.send(JSON.stringify({
          type: data.type,
          message: `[KICK ERROR] You cannot kick yourself.`,
          sender: "system"
        }));
        return;
      }  
    const chatroom = await dbGetAsync('SELECT id FROM chatrooms WHERE name = ?', [data.chatroom_name]);
    if (!chatroom) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[KICK ERROR] Chatroom '${data.chatroom_name}' not found.`,
        sender: "system"
      }));
      return;
    }  
    const senderRole = await dbGetAsync('SELECT role FROM chatroom_members WHERE chatroom_id = ? AND user_id = ?', [chatroom.id, connection.userId]);  
    const recipientRole = await dbGetAsync(
      'SELECT role FROM chatroom_members WHERE chatroom_id = ? AND user_id = ?',
      [chatroom.id, recipient.id]
    ); 
    if (!senderRole || !['admin', 'owner'].includes(senderRole.role)) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[KICK ERROR] You are not an admin or owner of this chatroom.`,
        sender: "system"
      }));
      return;
    }  
    if (!recipientRole) {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[KICK ERROR] ${data.destinatary} is not a member of the chatroom.`,
        sender: "system"
      }));
      return;
    } 
    if (recipientRole.role === 'owner') {
      connection.send(JSON.stringify({
        type: data.type,
        message: `[KICK ERROR] You cannot kick the owner of the chatroom.`,
        sender: "system"
      }));
      return;
    } 
    await dbRunAsync('DELETE FROM chatroom_members WHERE chatroom_id = ? AND user_id = ?',[chatroom.id, recipient.id]);
    connection.send(JSON.stringify({
      type: data.type,
      message: `You kicked ${data.destinatary} from ${data.chatroom_name}`,
      sender: "system"
    }));
    fastify.log.info(`[WebSocket: kick] ${connection.username} kicked ${data.destinatary} from ${data.chatroom_name}`);
    const recipientSocket = [...userSockets.values()].find(sock => sock.userId === recipient.id);
    if (recipientSocket && recipientSocket.readyState === recipientSocket.OPEN) {
      recipientSocket.send(JSON.stringify({
        type: "system",
        message: `You have been kicked from ${data.chatroom_name}`,
        chatroom_id: chatroom.id
      }));
    }
  }
  
  module.exports = {
    handleChatrooms,
    handleJoinChannel,
    handleChatMessages,
    handleSetAdmin,
    handleBanUser,
    handleUnbanUser,
    handleMuteUser,
    handleUnmuteUser,
    handleKickUser,
  };