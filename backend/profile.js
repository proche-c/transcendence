const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const pump = require("pump");
const multipart = require("@fastify/multipart");
const authMiddlewareAUX = require("./authMiddleware");

module.exports = async function profileRoutes(fastify, options) {
  const dbGetAsync = options.dbGetAsync;
  const dbRunAsync = options.dbRunAsync;
  const uploadssPath = path.join(__dirname, "../uploads/avatars");

  const authMiddleware = authMiddlewareAUX (dbGetAsync, fastify);

  fastify.register(multipart);

  fastify.get("/profile", { preHandler: authMiddleware }, async (request, reply) => {
    const data = {
      username: request.user.username,
      email: request.user.email,
      avatar: request.user.avatar,
    };
    return reply.send({ user: data });
  });

  fastify.post("/edit-profile", { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const data = await request.file();

      let fields = {};
      let uploadedFile = null;

      if (data) {
        fields = data.fields || {};
        uploadedFile = data.file;
      }

      const username = fields.username?.value;

      if (username && username.trim() !== "") {
        const existingUser = await dbGetAsync("SELECT id FROM users WHERE username = ?", [username.trim()]);
        if (existingUser) {
          return reply.status(400).send({ message: "Username already exists" });
        }
        await dbRunAsync("UPDATE users SET username = ? WHERE id = ?", [username.trim(), userId]);
      }

      if (uploadedFile && data.filename) {
        const ext = path.extname(data.filename);
        const fileName = crypto.randomBytes(16).toString("hex") + ext;
        const uploadPath = path.join(uploadssPath, fileName);

        await pump(uploadedFile, fs.createWriteStream(uploadPath));
        const avatarPath = `/static/avatars/${fileName}`;
        await dbRunAsync("UPDATE users SET avatar = ? WHERE id = ?", [avatarPath, userId]);
      }

      return reply.send({ message: "Profile updated successfully." });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Error updating profile" });
    }
  });
};
