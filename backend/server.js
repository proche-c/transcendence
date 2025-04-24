// Fastify server using Node.js that manages an API listening on port 8000
const dotenv = require('dotenv').config(); // Load environment variables from a .env file into process.env
const fastify = require('fastify')({ logger: true }); // Loading Fastify framework with logging enabled
const sqlite3 = require('sqlite3').verbose(); // SQLite3 library
const fs = require('fs'); // File system library
const path = require('path'); // Path library
const bcrypt = require('bcrypt'); // Bcrypt for password hashing
const jwt = require('@fastify/jwt'); // JWT for authentication
const oauthPlugin = require('@fastify/oauth2'); // OAuth2 for authentication
const cors = require('@fastify/cors'); // CORS plugin
const speakeasy = require('speakeasy'); // Two-factor authentication library
const qrcode = require('qrcode'); // QR code generation library
// const authMiddleware = require('./authMiddleware')(dbGetAsync);

const fastifyWebsocket = require('@fastify/websocket');

fastify.register(fastifyWebsocket);

const fastifyCookie = require('@fastify/cookie');

fastify.register(fastifyCookie);

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
    origin: ["https://localhost:8443", "http://localhost:5500/frontend/"], // Especifica el origen permitido
    credentials: true // Permite el envío de cookies y cabeceras de autenticación
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
const dbPath = "./sqlite_data/database.sqlite";
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database opening failed:', err.message);
    } else {
        console.log('Connected to database');

        // Initialize database
        try {
            const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
            db.exec(initSQL, (err) => {
                if (err) {
                    console.error('Error executing init.sql:', err.message);
                } else {
                    console.log('Database initialized');
                    const seedSQL = fs.readFileSync(path.join(__dirname, 'seeds.sql'), 'utf8');
                    db.exec(seedSQL, (err) => {
                        if (err) console.error('Error executing seeds.sql:', err.message);
                        else console.log('Database seeded');
                    });
                }
            });
        } catch (fileError) {
            console.error('Error reading SQL files:', fileError.message);
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

const authMiddleware = require('./authMiddleware')(dbGetAsync, fastify);

// Register the chat plugin 
const chatRoutes = require('./chat');
fastify.register(chatRoutes, {
  prefix: '/chat',
  db,            // SQLite connection
  dbGetAsync,    //promisified DB getter
  dbRunAsync,     //  promisified DB runner
  dbAllAsync
});

// User registration route
fastify.post('/register', async (request, reply) => {
    const { username, email, password } = request.body;
    if (!username || !email || !password) {
        return reply.status(400).send({ message: 'All fields are required' });
    }

    try {
        const row = await dbGetAsync('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
        if (row) {
            return reply.status(400).send({ message: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await dbRunAsync('INSERT INTO users (username, email, password_hash, avatar) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, "avatars/default.jpg"]);

        return reply.status(201).send({ message: 'User created', userId: result.lastID });
    } catch (err) {
        return reply.status(500).send({ message: 'Error processing request', error: err.message });
    }
});

// User login with JWT
fastify.post('/login', async (request, reply) => {
    const { email, password, twofa_token } = request.body;
    if (!email || !password) {
        return reply.status(400).send({ message: 'All fields are required' });
    }

    try {
        const user = await dbGetAsync('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return reply.status(404).send({ message: 'User not found' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return reply.status(401).send({ message: 'Incorrect password' });
        }

        // --- Check if 2FA en enabled
        if (user.is_twofa_enabled) {
            if (!twofa_token) {
                return reply.status(401).send({ message: '2FA token required' });
            }

            const verified = speakeasy.totp.verify({
                secret: user.twofa_secret,
                encoding: 'base32',
                token: twofa_token,
            });

            if (!verified) {
                return reply.status(401).send({ message: 'Invalid 2FA token' });
            }
        }

        //if password and 2FA (if enabled) are ok, JWT creation
        const token = fastify.jwt.sign(
            { userId: user.id, username: user.username },
            { expiresIn: '1h'}
        );


        // Check if 2FA is activated for this user
        const isTwoFAEnabled = user.is_twofa_enabled === 1;


        // send the token in the cookie and in the answer
        reply.setCookie("token", token, {
            httpOnly: false,
            secure: true, // true if HTTPS
            sameSite: "none",
            domain: "localhost",
            path: "/",
            expires: new Date(Date.now() + 60 * 70 * 1000), // Expira en 1 hora
            // O usa Max-Age en segundos:
            maxAge: 60 * 70, // 1 hora
        });

        return reply.send({ message: isTwoFAEnabled ? '2FA required' : '2FA not enabled',
            token,
            twofa_required: isTwoFAEnabled });

    } catch (err) {
        return reply.status(500).send({ message: 'Error processing request', error: err.message });
    }
});

fastify.get('/profile', { preHandler: authMiddleware}, async (request, reply) => {
    const data = {
        username: request.user.username,
        email: request.user.email,
        avatar: request.user.avatar
    }
    return reply.send({ user: data});
})

fastify.get('/edit-profile', { preHandler: authMiddleware}, async (request, reply) => {
    const data = {
        username: request.user.username,
        avatar: request.user.avatar
    }
    return reply.send({ user: data});
})

// Get tournaments
fastify.get('/tournaments', async (request, reply) => {
    try {
        const tournaments = await dbAllAsync('SELECT * FROM tournaments');
        return reply.send(tournaments);
    } catch (error) {
        return reply.status(500).send({ message: 'Error getting tournaments', error: error.message });
    }
});

// Create tournament
fastify.post('/tournaments', async (request, reply) => {
    const { name, start_date } = request.body;
    if (!name || !start_date) {
        return reply.status(400).send({ message: 'Name and start date are required' });
    }

    try {
        const result = await dbRunAsync('INSERT INTO tournaments (name, start_date) VALUES (?, ?)', [name, start_date]);
        return reply.status(201).send({ message: 'Tournament created', tournamentId: result.lastID });
    } catch (error) {
        return reply.status(500).send({ message: 'Error creating tournament', error: error.message });
    }
});

// Google OAuth2 configuration
fastify.register(oauthPlugin, {
    name: 'googleOAuth2',
    scope: ['profile', 'email'],
    credentials: {
        client: {
            id: process.env.GOOGLE_CLIENT_ID,
            secret: process.env.GOOGLE_CLIENT_SECRET
        },
        auth: oauthPlugin.GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/login/google',
    callbackUri: 'http://localhost:8000/auth/google/callback'
});

// Google callback route
fastify.get('/auth/google/callback', async (request, reply) => {
    try {
        const token = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
        return reply.send({ token });
    } catch (err) {
        return reply.status(500).send({ message: 'Google authentication failed', error: err.message });
    }
});


//Added by paula to verify authentication througt frontend request
fastify.get('/check-auth', async (request, reply) => {
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
            user: decoded // Enviar datos del usuario autenticado
        });

    } catch (error) {
        return reply.status(401).send({ message: "Invalid or expired token" });
    }
});

// Two-factor authentication route
fastify.post('/2fa/setup', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;

    const secret = speakeasy.generateSecret({
        name: `PongApp (${request.user.username})`, // Name printed on Google Authenticator
    });

    await dbRunAsync('UPDATE users SET twofa_secret = ?, is_twofa_enabled = 1 WHERE id = ?', [secret.base32, userId]);

    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    return reply.send({
        message: '2FA setup',
        qrCode,
        secret: secret.base32, // to hide in production
    });
});

// Verify 2FA code
fastify.post('/2fa/verify', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { token } = request.body;
    const userId = request.user.userId;

    const user = await dbGetAsync('SELECT twofa_secret FROM users WHERE id = ?', [userId]);
    if (!user || !user.twofa_secret) {
        return reply.status(400).send({ message: '2FA not set up' });
    }

    const verified = speakeasy.totp.verify({
        secret: user.twofa_secret,
        encoding: 'base32',
        token,
    });

    if (!verified) {
        return reply.status(401).send({ message: 'Invalid 2FA code' });
    }

    return reply.send({ message: '2FA verified successfully' });
});

// Start the server
const start = async () => {
    try {
        await fastify.listen({ port: 8000, host: '0.0.0.0' });
        console.log('Server is running on http://localhost:8000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
