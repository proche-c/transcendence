// Fastify server using Node.js that manages an API listening on port 8000
const dotenv = require('dotenv').config(); // Load environment variables from a .env file into process.env
const fastify = require('fastify')({ logger: true }); // Loading Fastify framework with logging enabled
const sqlite3 = require('sqlite3').verbose(); // SQLite3 library
const fs = require('fs'); // File system library
const path = require('path'); // Path library
//const bcrypt = require('bcrypt'); // Bcrypt for password hashing
const jwt = require('@fastify/jwt'); // JWT for authentication
//const oauthPlugin = require('@fastify/oauth2'); // OAuth2 for authentication
const cors = require('@fastify/cors'); // CORS plugin
const speakeasy = require('speakeasy'); // Two-factor authentication library
const qrcode = require('qrcode'); // QR code generation library
//const { z } = require('zod'); // Zod for schema validation
const fastifyWebsocket = require("@fastify/websocket");
fastify.register(fastifyWebsocket);
const fastifyCookie = require("@fastify/cookie");
fastify.register(fastifyCookie);
const { SERVER_IP } = require('./config.js');

// Afegeix aquesta configuració abans de fastify.listen
const options = {
  https: {
    key: fs.readFileSync(path.join(__dirname, 'certificates/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certificates/cert.pem')),
    minVersion: 'TLSv1.2', // Minimum TLS version
    maxVersion: 'TLSv1.3',
    ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384',
    honorCipherOrder: true
  },
  port: 8000,
  host: "0.0.0.0"
};

//********************TO SERVE STATIC FILES(AVATAR IMGS)******************** */

const fastifyStatic = require('@fastify/static');

const uploadssPath = path.join(__dirname, 'uploads');
console.log("Serving statics from: ", uploadssPath);

fastify.register(fastifyStatic, {
    root: uploadssPath,
    prefix: '/static/',
});

// Register CORS middleware
fastify.register(cors, {
  origin: true, // Especifica el origen permitido
  credentials: true, // Permite el envío de cookies y cabeceras de autenticación
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
});

// Register JWT with a secret key
fastify.register(jwt, { secret: 'supersecretkey' });

// Decorate Fastify with an authentication middleware
fastify.decorate("authenticate", async (request, reply) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        return reply.status(401).send({ message: 'Unauthorized' });
    }
});

// Define a simple route
fastify.get('/', async (request, reply) => {
    return { message: 'Pong!' };
});

// Route to the SQLite database
const dbPath = "/home/node/app/sqlite_data/database.sqlite"; //!!!IMPORTANT (THIS IS THE ONE IN COMPOSE FILE)
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

const authMiddleware = require('./authMiddleware')(dbGetAsync);

const userRoutes = require("./users");
fastify.register(userRoutes, {
  prefix: "/users",
  db,
  dbAllAsync,
  dbGetAsync,
  dbRunAsync,
});

const chatRoutes = require("./chat");
fastify.register(chatRoutes, {
  prefix: "/chat",
  db,
  dbGetAsync, 
  dbRunAsync,
  dbAllAsync,
});

const profileRoutes = require("./profile");
fastify.register(profileRoutes, {
  dbGetAsync,
  dbRunAsync,
  dbAllAsync,
  authMiddleware,
});

const statsRoutes = require("./stats");
fastify.register(statsRoutes, {
  dbGetAsync,
  dbRunAsync,
  dbAllAsync,
  authMiddleware,
});

const gameRoutes = require("./game");
fastify.register(gameRoutes, {
  prefix: "/game",
  db,
  dbGetAsync, 
  dbRunAsync,
  dbAllAsync,
});

fastify.register(require('./login'), { dbGetAsync });
fastify.register(require('./register'), { dbGetAsync, dbRunAsync });
fastify.register(require('./googleAuth'),  {dbGetAsync,dbRunAsync,});
fastify.register(require('./twofa.js'),  { dbGetAsync, dbRunAsync, dbAllAsync });

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
    await fastify.listen(options);
    console.log(`Server is running on https://${SERVER_IP}:8443/api`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();