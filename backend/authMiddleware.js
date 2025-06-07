//JWT Verification Middleware

module.exports = function (dbGetAsync, fastify) {
  return async function verifyJWT(request, reply) {
    //console.log("IN MIDDLEWARE");
    try {
      const token = request.cookies.token;
      //console.log("AFTER SEE TOKEN");
      if (!token)
        return reply.status(401).send({ message: "No token provided" });
      const decoded = await fastify.jwt.verify(token);
      //fastify.log.err('***********decoded');
      console.log("Auth Middleware check");
      //console.log("********estoy en decoded");
      const user = await dbGetAsync("SELECT * FROM users WHERE id = ?", [
        decoded.userId,
      ]);

      if (!user) {
        return reply.status(404).send({ message: "User not found" });
      }

      request.user = user;
      delete request.user.password_hash; // Remove password from user object
      delete request.user.twofa_secret; // Remove 2FA secret from user object
      //console.log("imprimo user en middleware");
      console.log(request.user);
    } catch (err) {
      return reply.status(401).send({ message: "Unauthorized" });
    }
  };
};
