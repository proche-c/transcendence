const bcrypt = require('bcrypt');
const { z } = require("zod");



module.exports = async function (fastify, options) {
    const { dbGetAsync, dbRunAsync } = options;

    // Schema to validate registration data
    const registerSchema = z.object({
        username: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(6),
      });

      const checkUsernameSchema = z.object({
        username: z.string().min(3),
      });
    
      const checkEmailSchema = z.object({
        email: z.string().email(),
      });


      fastify.post("/register", async (request, reply) => {
        const parseResult = registerSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.status(400).send({
            message: "Invalid request data",
            errors: parseResult.error.format(),
          });
        }
    
        const { username, email, password } = parseResult.data;
  
    try {
      const existing = await dbGetAsync(
        "SELECT * FROM users WHERE email = ? OR username = ?",
        [email, username],
      );
      if (existing) {
        return reply
          .status(400)
          .send({ message: "Username or email already exists" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await dbRunAsync(
        "INSERT INTO users (username, email, password_hash, avatar) VALUES (?, ?, ?, ?)",
        [username, email, hashedPassword, "avatars/default.jpg"],
      );
  
      return reply
        .status(201)
        .send({ message: "User created", userId: result.lastID });
    } catch (err) {
      return reply.status(500).send({ message: "Internal server error" }); //removed error details for security
    }
  });

  // Check if an username already exists
  fastify.get('/check-username', async (request, reply) => {
    const parseResult = checkUsernameSchema.safeParse(request.query);
    if (!parseResult.success) {
      return reply.status(400).send({
        message: "Invalid username",
        errors: parseResult.error.format(),
      });
    }

    const { username } = parseResult.data;

    try {
        const user = await dbGetAsync('SELECT * FROM users WHERE username = ?', [username]);
        return reply.send({ available: !!user });
    } catch (err) {
        return reply.status(500).send({ message: 'Error checking username', error: err.message });
    }
});

// Check if an email already exists
fastify.get('/check-email', async (request, reply) => {
    const parseResult = checkEmailSchema.safeParse(request.query);
    if (!parseResult.success) {
        return reply.status(400).send({
            message: 'Invalid email',
            errors: parseResult.error.format(),
         });
    }

    const { email } = parseResult.data;

    try {
        const user = await dbGetAsync('SELECT * FROM users WHERE email = ?', [email]);
        return reply.send({ available: !!user });
    } catch (err) {
        return reply.status(500).send({
            message: 'Error checking email', 
            error: err.message,
         });
    }
});
};