// Fastify server using Node.js that manages an API listening on port 8000
const fastify = require("fastify")({ logger: true }); // Loading Fastify framework with logging enabled
const sqlite3 = require("sqlite3").verbose(); // SQLite3 library
const fs = require("fs"); // File system library
const path = require("path"); // Path library
const bcrypt = require("bcrypt"); // Bcrypt for password hashing
const jwt = require("@fastify/jwt"); // JWT for authentication
const oauthPlugin = require("@fastify/oauth2"); // OAuth2 for authentication
const cors = require("@fastify/cors"); // CORS plugin
const crypto = require('crypto');
const pump = require('pump');
const multipart = require("@fastify/multipart");
const { v4: uuidv4 } = require("uuid");
// const authMiddleware = require('./authMiddleware')(dbGetAsync);
const fastifyWebsocket = require("@fastify/websocket");
fastify.register(fastifyWebsocket);
const fastifyCookie = require("@fastify/cookie");
fastify.register(fastifyCookie);

//********************TO SERVE STATIC FILES(AVATAR IMGS)******************** */

const fastifyStatic = require("@fastify/static");
const uploadssPath = path.join(__dirname, "uploads");
console.log("Serving statics from: ", uploadssPath);

fastify.register(fastifyStatic, {
  root: uploadssPath,
  prefix: "/static/",
});

/***************************** Register CORS middleware **********************/
fastify.register(cors, { 
    origin: ["https://localhost:8443", "http://localhost:5500/frontend/"], // Especifica el origen permitido
    credentials: true // Permite el envío de cookies y cabeceras de autenticación
});

// Register JWT with a secret key
fastify.register(jwt, { secret: "supersecretkey" });

// Decorate Fastify with an authentication middleware
fastify.decorate("authenticate", async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ message: "Unauthorized" });
  }
});

// Define a simple route
fastify.get("/", async (request, reply) => {
  return { message: "Pong!" };
});

// Route to the SQLite database
const dbPath = "./sqlite_data/database.sqlite";
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database opening failed:", err.message);
  } else {
    console.log("Connected to database");

    // Initialize database
    try {
      const initSQL = fs.readFileSync(path.join(__dirname, "init.sql"), "utf8");
      db.exec(initSQL, (err) => {
        if (err) {
          console.error("Error executing init.sql:", err.message);
        } else {
          console.log("Database initialized");
          const seedSQL = fs.readFileSync(
            path.join(__dirname, "seeds.sql"),
            "utf8",
          );
          db.exec(seedSQL, (err) => {
            if (err) console.error("Error executing seeds.sql:", err.message);
            else console.log("Database seeded");
          });
        }
      });
    } catch (fileError) {
      console.error("Error reading SQL files:", fileError.message);
    }
  }
});

// Promisified functions for database queries
const dbGetAsync = (query, params) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
};

const dbAllAsync = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
};

const dbRunAsync = (query, params) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      resolve(this);
    });
  });
};

const authMiddleware = require("./authMiddleware")(dbGetAsync, fastify);

const userRoutes = require("./users");
fastify.register(userRoutes, {
  prefix: "/users",
  db,
  dbAllAsync,
  dbGetAsync,
});

// Register the chat plugin
const chatRoutes = require("./chat");
fastify.register(chatRoutes, {
  prefix: "/chat",
  db, // SQLite connection
  dbGetAsync, //promisified DB getter
  dbRunAsync, //  promisified DB runner
  dbAllAsync,
});

// User registration route
fastify.post("/register", async (request, reply) => {
  const { username, email, password } = request.body;
  if (!username || !email || !password) {
    return reply.status(400).send({ message: "All fields are required" });
  }

  try {
    const row = await dbGetAsync(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, username],
    );
    if (row) {
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
    return reply
      .status(500)
      .send({ message: "Error processing request", error: err.message });
  }
});

// User login with JWT
fastify.post("/login", async (request, reply) => {
  const { email, password } = request.body;
  if (!email || !password) {
    return reply.status(400).send({ message: "All fields are required" });
  }

  try {
    const user = await dbGetAsync("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (!user) {
      return reply.status(404).send({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return reply.status(401).send({ message: "Incorrect password" });
    }

    const token = fastify.jwt.sign(
      { userId: user.id, username: user.username },
      { expiresIn: "1h" },
    );

    // Added by paula to save token in cookies, saver way
    reply
      .setCookie("token", token, {
        httpOnly: false,
        secure: true, // true si usas HTTPSmake sta
        sameSite: "none",
        domain: "localhost",
        path: "/",
        expires: new Date(Date.now() + 60 * 70 * 1000), // Expira en 1 hora
        // O usa Max-Age en segundos:
        maxAge: 60 * 70, // 1 hora
      })
      .send({ message: "Login successful" });
  } catch (err) {
    return reply
      .status(500)
      .send({ message: "Error processing request", error: err.message });
  }
});





/************************** ENDPOINTS TO BUILD PROFILE*************** */

// endpoint to get Data for profile, missing some parameters like total maatches, won matches... needed on BBDD


fastify.get(
  "/profile",
  { preHandler: authMiddleware },
  async (request, reply) => {
    const data = {
      username: request.user.username,
      email: request.user.email,
      avatar: request.user.avatar,
    };
    return reply.send({ user: data });
  },
);

// Endpoint to get Data for edit-profile, avatar and username are the parameters user may modified
fastify.register(multipart);
fastify.post('/edit-profile', { preHandler: authMiddleware }, async (request, reply) => {
  try {
    const userId = request.user.id;
    const data = await request.file(); //contains the fields edited + file(avatar) + filename
    const { fields } = data; 
    const username = fields.username?.value;
    
    if (username && username.trim() !== '') {
      const existingUser = await dbGetAsync('SELECT id FROM users WHERE username = ?', [username.trim()]);
      if (existingUser) {
        return reply.status(400).send({ message: 'Username already exists' });
      }
      await dbRunAsync('UPDATE users SET username = ? WHERE id = ?', [username.trim(), userId]);
    }

    if (data && data.file && data.filename) {
      const ext = path.extname(data.filename); //getting the extention
      const fileName = crypto.randomBytes(16).toString('hex') + ext; //generating a random name
      const uploadPath = path.join(uploadssPath, fileName);

      await pump(data.file, fs.createWriteStream(uploadPath));

      const avatarPath = `/static/${fileName}`; 
      await dbRunAsync('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, userId]);
    }

    return reply.send({ message: 'Profile updated successfully.' });
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ message: 'Error updating profile' });
  }
});


// Get tournaments
fastify.get("/tournaments", async (request, reply) => {
  try {
    const tournaments = await dbAllAsync("SELECT * FROM tournaments");
    return reply.send(tournaments);
  } catch (error) {
    return reply
      .status(500)
      .send({ message: "Error getting tournaments", error: error.message });
  }
});

// Create tournament
fastify.post("/tournaments", async (request, reply) => {
  const { name, start_date } = request.body;
  if (!name || !start_date) {
    return reply
      .status(400)
      .send({ message: "Name and start date are required" });
  }

  try {
    const result = await dbRunAsync(
      "INSERT INTO tournaments (name, start_date) VALUES (?, ?)",
      [name, start_date],
    );
    return reply
      .status(201)
      .send({ message: "Tournament created", tournamentId: result.lastID });
  } catch (error) {
    return reply
      .status(500)
      .send({ message: "Error creating tournament", error: error.message });
  }
});

// Google OAuth2 configuration
fastify.register(oauthPlugin, {
  name: "googleOAuth2",
  scope: ["profile", "email"],
  credentials: {
    client: {
      id: process.env.GOOGLE_CLIENT_ID,
      secret: process.env.GOOGLE_CLIENT_SECRET,
    },
    auth: oauthPlugin.GOOGLE_CONFIGURATION,
  },
  startRedirectPath: "/login/google",
  callbackUri: "http://localhost:8000/auth/google/callback",
});

fastify.get("/auth/google/callback", async (request, reply) => {
  try {
    const token =
      await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
        request,
      );
    return reply.send({ token });
  } catch (err) {
    return reply
      .status(500)
      .send({ message: "Google authentication failed", error: err.message });
  }
});

//Added by paula to verify authentication througt frontend request
fastify.get("/check-auth", async (request, reply) => {
  try {
    const token = request.cookies.token; // Leer la cookie del request
    console.log("**Cookies in check-auth:");
    console.log(token);
    if (!token) {
      return reply.status(401).send({ message: "Not authenticated" });
    }

    // Verificar el JWT
    const decoded = await fastify.jwt.verify(token);

    return reply.send({
      message: "Authenticated",
      user: decoded, // Enviar datos del usuario autenticado
    });
  } catch (error) {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 8000, host: "0.0.0.0" });
    console.log("Server is running on http://localhost:8000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
