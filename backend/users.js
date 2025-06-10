async function userRoutes(fastify, options) {
  const dbAllAsync = options.dbAllAsync;
  const dbGetAsync = options.dbGetAsync;
  const dbRunAsync = options.dbRunAsync;
  const authMiddleware = require("./authMiddleware")(dbGetAsync, fastify);
// get all users
  fastify.get("/", { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const users = await dbAllAsync("SELECT id, username, avatar, total_matches, total_wins, total_losses, goals_for, goals_against, ranking FROM users");
      reply.send(users);
    } catch (err) {
      fastify.log.error({ err }, "DB error, cannot load the users");
      reply.status(500).send({ message: "Internal server error" });
    }
  });

  //  /users/friends — list of accepted friends
  fastify.get("/friends", { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const rows = await dbAllAsync(
        `SELECT u.id, u.username, u.avatar, f.status
         FROM friends f
         JOIN users u ON u.id = f.friend_id
         WHERE f.user_id = ? AND f.status = 'accepted'`,
        [userId]
      );
      return reply.send({ friends: rows });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ message: "Error fetching friends list" });
    }
  });

  //  /users/friends — send a friend request
  fastify.post("/friends", { preHandler: authMiddleware }, async (request, reply) => {
    const { username } = request.body;
    const userId = request.user.id;
    if (!username || username.trim() === "") {
      return reply.status(400).send({ message: "Username is required" });
    }
    try {
      const targetUser = await dbGetAsync("SELECT id FROM users WHERE username = ?", [username.trim()]);
      if (!targetUser) {
        return reply.status(404).send({ message: "User does not exist" });
      }
      if (targetUser.id === userId) {
        return reply.status(400).send({ message: "You cannot add yourself as a friend" });
      } 
      const existing = await dbGetAsync("SELECT * FROM friends WHERE user_id = ? AND friend_id = ?", [userId, targetUser.id]);
      if (existing) {
        return reply.status(400).send({ message: "Friend request already sent or exists" });
      }
      await dbRunAsync("INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'accepted')", [userId, targetUser.id]);
      await dbRunAsync("INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'accepted')", [targetUser.id, userId]);
      return reply.send({ message: "Friend added" });
    } 
    catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ message: "Error sending friend request" });
    }
  });

  fastify.get("/messages", { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user.id;
    const chatId = request.query.chatId;
  
    if (!chatId) {
      return reply.status(400).send({ message: "chatId is required" });
    }
    try {
      const messages = await dbAllAsync(
        `SELECT m.id, m.message, m.timestamp, u.username AS sender
         FROM messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.chat_id = ?
         ORDER BY m.timestamp ASC`,
        [chatId]
      );
      return reply.send({ chatId, messages });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ message: "Failed to fetch messages" });
    }
  }); 

  fastify.get("/chatroom-messages", { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user.id;
    const chatroomId = request.query.chatroomId;
  
    if (!chatroomId) {
      return reply.status(400).send({ message: "chatroomId is required" });
    }
  
    try {
      const member = await dbGetAsync(
        `SELECT * FROM chatroom_members WHERE chatroom_id = ? AND user_id = ?`,
        [chatroomId, userId]
      );
      if (!member) {
        return reply.status(403).send({ message: "You are not a member of this chatroom" });
      }
      const messages = await dbAllAsync(
        `SELECT m.id, m.message, m.created_at, u.username AS sender
         FROM chatroom_messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.chatroom_id = ?
         ORDER BY m.created_at ASC`,
        [chatroomId]
      );
      return reply.send({ chatroomId, messages });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ message: "Failed to fetch chatroom messages" });
    }
  });  

  fastify.get("/chatrooms", { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const chatrooms = await dbAllAsync(
        `SELECT id, name, is_private FROM chatrooms`
      );
      return reply.send({ chatrooms });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ message: "Failed to fetch chatrooms" });
    }
  });  
}

module.exports = userRoutes;

