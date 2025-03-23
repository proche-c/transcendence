// Fastify server using Node.js that manages an API listening on port 8000
const fastify = require('fastify')({ logger: true }); // Loading Fastify framework with logging enabled
const sqlite3 = require('sqlite3').verbose(); // SQLite3 library
const fs = require('fs'); // File system library
const path = require('path'); // Path library
const bcrypt = require('bcrypt'); // Bcrypt for password hashing
const jwt = require('@fastify/jwt'); // JWT for authentication
const oauthPlugin = require('@fastify/oauth2'); // OAuth2 for authentication
const cors = require('@fastify/cors'); // CORS plugin

// Register CORS middleware
fastify.register(cors, {
    origin: ['https://localhost'], // Allow requests only from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
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
        const result = await dbRunAsync('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, hashedPassword]);

        return reply.status(201).send({ message: 'User created', userId: result.lastID });
    } catch (err) {
        return reply.status(500).send({ message: 'Error processing request', error: err.message });
    }
});

// User login with JWT
fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;
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

        const token = fastify.jwt.sign({ userId: user.id, username: user.username });
        return reply.send({ message: 'Login successful', token });
    } catch (err) {
        return reply.status(500).send({ message: 'Error processing request', error: err.message });
    }
});

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

fastify.get('/auth/google/callback', async (request, reply) => {
    try {
        const token = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
        return reply.send({ token });
    } catch (err) {
        return reply.status(500).send({ message: 'Google authentication failed', error: err.message });
    }
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
