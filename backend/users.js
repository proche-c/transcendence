// async function userRoutes(fastify, options) {
//   const dbAllAsync = options.dbAllAsync;
//   const dbGetAsync = options.dbGetAsync;

//   const authMiddleware = require("./authMiddleware")(dbGetAsync, fastify);

//   fastify.get("/", { preHandler: authMiddleware }, async (request, reply) => {
//     try {
//       const users = await dbAllAsync("SELECT id, username, avatar FROM users");
//       reply.send(users);
//     } catch (err) {
//       fastify.log.error({ err }, "DB error, cannot load the users");
//       reply.status(500).send({ message: "Internal server error" });
//     }
//   });
// }

// module.exports = userRoutes;
