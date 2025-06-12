const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const pump = require("pump");
const multipart = require("@fastify/multipart");
const authMiddlewareAUX = require("./authMiddleware");

module.exports = async function profileRoutes(fastify, options) {
  const dbGetAsync = options.dbGetAsync;
  const dbRunAsync = options.dbRunAsync;
  const dbAllAsync = options.dbAllAsync;
  const uploadssPath = path.join(__dirname, "uploads/avatars");
  const authMiddleware = authMiddlewareAUX(dbGetAsync, fastify);
  fastify.register(multipart);

  //  current user's profile
  fastify.get("/profile", { preHandler: authMiddleware }, async (request, reply) => {
    const data = {
      username: request.user.username,
      email: request.user.email,
      avatar: request.user.avatar,
      twofa: request.user.is_twofa_enabled,
      total_matches: request.user.total_matches,
      total_wins: request.user.total_wins,
      total_losses: request.user.total_losses,
      goals_for: request.user.goals_for,
      goals_against: request.user.goals_against,
      ranking: request.user.ranking,
    };
    console.log("Imprimo user en backend profile");
    console.log(data);
    return reply.send({ user: data });
  });

  // edit-profile 
fastify.post("/edit-profile", { preHandler: authMiddleware }, async (request, reply) => {
  try {
    const userId = request.user.id;

    const parts = request.parts();
    let username = "";
    let uploadedFile = null;
    let filename = "";

    for await (const part of parts) {
      if (part.type === "file") {
        uploadedFile = part.file;
        filename = part.filename;
      } else if (part.type === "field" && part.fieldname === "username") {
        username = part.value.trim();
      }
    }

    if (username !== "") {
      const existingUser = await dbGetAsync("SELECT id FROM users WHERE username = ?", [username]);
      if (existingUser) {
        return reply.status(400).send({ message: "Username already exists" });
      }
      await dbRunAsync("UPDATE users SET username = ? WHERE id = ?", [username, userId]);
    }

    if (uploadedFile && filename) {
      const ext = path.extname(filename);
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

  // public profile 
  fastify.get("/public-profile", { preHandler: authMiddleware }, async (request, reply) => {
    const { username } = request.query;
    if (!username || username.trim() === "") {
      return reply.status(400).send({ message: "Username is required" });
    }
  
    try {
      const user = await dbGetAsync("SELECT id, username, avatar FROM users WHERE username = ?", [username.trim()]);  
      if (!user) {
        return reply.status(404).send({ message: "User not found" });
      }
      return reply.send({
        message: "Public profile loaded",
        profile: user,
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ message: "Error fetching public profile" });
    }
  });  

  fastify.get("/chats", { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user.id;
    try {
        const chats = await dbAllAsync(
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
        oneToOneChats: chats,
        chatrooms,
      });
    } catch (err) {
      request.log.error(err); 
      return reply.status(500).send({ message: "Failed to fetch chats" });
    }
  });
  
};
