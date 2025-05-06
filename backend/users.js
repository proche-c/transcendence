async function userRoutes(fastify, options) {
  const dbAllAsync = options.dbAllAsync;
  const dbGetAsync = options.dbGetAsync;
  const dbRunAsync = options.dbRunAsync;
  const authMiddleware = require("./authMiddleware")(dbGetAsync, fastify);
// get all users
  fastify.get("/", { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const users = await dbAllAsync("SELECT id, username, avatar FROM users");
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
      await dbRunAsync( "INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'pending')",[userId, targetUser.id]);
      return reply.send({ message: "Friend request sent" });
    } 
    catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ message: "Error sending friend request" });
    }
  });
}

module.exports = userRoutes;
