const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const { z } = require("zod");
const { SERVER_IP } = require('./config');

// Schema to validate login data
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twofa_token: z.string().optional(),
});

module.exports = async function (fastify, options) {
  const { dbGetAsync } = options;

  fastify.post("/login", async (request, reply) => {
    // Validate request body 
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        message: "Invalid request data",
        errors: parseResult.error.format(),
      });
    }

    const { email, password, twofa_token } = parseResult.data;

    try {
      const user = await dbGetAsync("SELECT * FROM users WHERE email = ?", [email]);

      // bruteforce protection 
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return reply.status(401).send({ message: "Invalid credentials" });
    } 

      // check if 2FA is enabled
      if (user.is_twofa_enabled) {
        if (!twofa_token) {
          return reply.status(401).send({ message: "2FA token required" });
        }

        const verified = speakeasy.totp.verify({
          secret: user.twofa_secret,
          encoding: "base32",
          token: twofa_token,
        });

        if (!verified) {
          return reply.status(401).send({ message: "Invalid 2FA token" });
        }
      }

      // Generate JWT token
      const token = fastify.jwt.sign(
        { userId: user.id, username: user.username },
        { expiresIn: "1h" }
      );

      //const isTwoFAEnabled = user.is_twofa_enabled === 1;

      // Set cookie with JWT token
      reply.setCookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 60 * 60,
      });

      return reply.send({
        message: "Login successful",
        //token, // has been removed for security reasons in production
        twofa_required: false,
      });

    } catch (err) {
      return reply.status(500).send({
        message: "Error processing request",
        error: err.message,
      });
    }
  });
};