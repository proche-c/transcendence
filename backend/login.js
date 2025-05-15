const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const { z } = require("zod");

// Schema to validate login data
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twofa_token: z.string().optional(),
});

module.exports = async function (fastify, options) {
  const { dbGetAsync } = options;

  fastify.post("/login", async (request, reply) => {
    // Validation of request data 
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
      if (!user) {
        return reply.status(404).send({ message: "User not found" });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return reply.status(401).send({ message: "Incorrect password" });
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

      const isTwoFAEnabled = user.is_twofa_enabled === 1;

      // Set cookie with JWT token
      reply.setCookie("token", token, {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        domain: "localhost",
        path: "/",
        maxAge: 60 * 70,
      });

      return reply.send({
        message: isTwoFAEnabled ? "2FA required" : "2FA not enabled",
        token,
        twofa_required: isTwoFAEnabled,
      });

    } catch (err) {
      return reply.status(500).send({
        message: "Error processing request",
        error: err.message,
      });
    }
  });
};
