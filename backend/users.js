const authMiddlewareFactory = require("./authMiddleware");

async function userRoutes(fastify, options) {
  const dbAllAsync = options.dbAllAsync;
  const dbGetAsync = options.dbGetAsync;
  const dbRunAsync = options.dbRunAsync;
  const authMiddleware = authMiddlewareFactory(dbGetAsync, fastify);

  // Get all users
  fastify.get("/", { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const users = await dbAllAsync("SELECT id, username, avatar FROM users");
      reply.send(users);
    } catch (err) {
      fastify.log.error({ err }, "DB error, cannot load the users");
      reply.status(500).send({ message: "Internal server error" });
    }
  });

  // List of accepted friends
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

  // Send a friend request
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
      return reply.send({ message: "Friend request sent" });
    } 
    catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ message: "Error sending friend request" });
    }
  });

  // Get one-to-one chats and chatrooms
  fastify.get("/chats", { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user.id;
    try {
      const oneToOneChats = await dbAllAsync(
        `SELECT c.id, u.username AS other_user, u.avatar
         FROM chats c
         JOIN users u ON (u.id = CASE
           WHEN c.user1_id = ? THEN c.user2_id
           ELSE c.user1_id
         END)
         WHERE c.user1_id = ? OR c.user2_id = ?`,
        [userId, userId, userId]
      );
      const chatrooms = await dbAllAsync(
        `SELECT cr.id, cr.name, cr.owner_id, cr.is_private, crm.role
         FROM chatroom_members crm
         JOIN chatrooms cr ON crm.chatroom_id = cr.id
         WHERE crm.user_id = ?`,
        [userId]
      );
      return reply.send({
        oneToOneChats,
        chatrooms,
      });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ message: "Failed to fetch chats" });
    }
  });
}

module.exports = userRoutes;

