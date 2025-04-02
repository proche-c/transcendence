// Fastify server using node.js that manages an API listening on port 3000
require('dotenv').config({ path: '../.env' }); // Load environment variables from a .env file into process.env
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);


const fastify = require('fastify')({ logger: true }); //loading the fastify Framework and activate the logs
const sqlite3 = require('sqlite3').verbose(); // SQLite3 library
const fs = require('fs'); // File system library
const path = require('path'); // Path library
const bcrypt = require('bcrypt'); // Bcrypt library for hashing passwords
const jwt = require('@fastify/jwt'); // JWT library for authentication
const oauthPlugin = require('@fastify/oauth2'); // OAuth2 library for authentication


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
fastify.get('/', async (request, reply) => 
    {
    return { message: 'Pong!' };
    });

// Get all users (Protected route)
fastify.get('/users', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
        const users = await dbAllAsync('SELECT id, username, email FROM users');
        return reply.send(users);
    } catch (error) {
        return reply.status(500).send({ message: 'Error retrieving users' });
    }
});


// Route to the SQLite database
const dbPath = "./sqlite_data/database.sqlite";
//const dbPath = "/home/node/app/sqlite_data/database.sqlite";

// Create or open the SQLite Database
const db = new sqlite3.Database(dbPath, (err) => 
    {
    if (err) 
        {
        console.error('Database opening failed', err.message);
        } 
    else 
    {
        console.log('Connection to database completed');
        const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8'); // Read and execute the SQL file to initialise the database
        db.exec(initSQL, (err) => {
            if (err) 
                {
                console.error('Error while executing the file init.sql:', err.message);
                }
            else {
                console.log('Database initiated successfully');
                
                // Seeds execution
                const seedSQL = fs.readFileSync(path.join(__dirname, 'seeds.sql'), 'utf8');
                db.exec(seedSQL, (err) => {
                    if (err) {
                        console.error('Error while executing seeds.sql:', err.message);
                    } else {
                        console.log('Database seeded successfully');
                    }
                });
            }
        });
    }
});

// Promisified function to handle DB get
function dbGetAsync(query, params) 
{
    return new Promise((resolve, reject) => 
        {
            db.get(query, params, (err, row) => 
                {
                if (err) reject(err);
                    resolve(row);
                });
        });
}

// Promisified function to handle DB all
function dbAllAsync(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Promisified function to handle DB run
function dbRunAsync(query, params) 
{
    return new Promise((resolve, reject) => 
        {
        db.run(query, params, function (err) 
        {
            if (err) reject(err);
            resolve(this);
        });
        });
}

// Inscription route for a new user
fastify.post('/register', async (request, reply) => 
    {
    const { username, email, password } = request.body;

    // Check if the fields are filled
    if (!username || !email || !password) 
        {
        return reply.status(400).send({ message: 'All fields need to be filled' });
        }

    try {
        // Check if the user already exists
        const row = await dbGetAsync('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);

        if (row) 
            {
            return reply.status(400).send({ message: 'The username or email already exists' });
            }

        // Password hash
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert a new user in the database
        const result = await dbRunAsync('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, hashedPassword]);

        // Successfully created user, return response
        return reply.status(201).send({ message: 'User successfully created', userId: result.lastID });

        } 
        catch (err) 
        {
            return reply.status(500).send({ message: 'Error while processing the request', error: err.message });
        }
    });

// User login with JWT token generation
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


// Add friend
fastify.post('/friends', async (request, reply) => {
    const { user_id, friend_id } = request.body;
    if (!user_id || !friend_id) return reply.status(400).send({ message: 'User ID and Friend ID are required' });
    try {
        await dbRunAsync('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)', [user_id, friend_id]);
        return reply.status(201).send({ message: 'Friend request sent' });
    } catch (error) {
        return reply.status(500).send({ message: 'Error adding friend', error: error.message });
    }
});

// Get friends
fastify.get('/friends/:user_id', async (request, reply) => {
    const { user_id } = request.params;
    if (!user_id) return reply.status(400).send({ message: 'User ID is required' });
    try {
        const friends = await dbAllAsync('SELECT * FROM friends WHERE user_id = ?', [user_id]);
        return reply.send(friends);
    } catch (error) {
        return reply.status(500).send({ message: 'Error getting friends', error: error.message });
    }
});

// Create tournament
fastify.post('/tournaments', async (request, reply) => {
    const { name, start_date } = request.body;
    if (!name || !start_date) return reply.status(400).send({ message: 'Name and start date are required' });
    try {
        const result = await dbRunAsync('INSERT INTO tournaments (name, start_date) VALUES (?, ?)', [name, start_date]);
        return reply.status(201).send({ message: 'Tournament created', tournamentId: result.lastID });
    } catch (error) {
        return reply.status(500).send({ message: 'Error creating tournament', error: error.message });
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
    callbackUri: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8000/auth/google/callback'
});

// Google authentication route
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

// Google callback route
app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    function(req, res) {
      res.redirect('/dashboard'); // Redirection après connexion réussie
    }
  );
  

// Start the server
const start = async () => 
    {
    try 
    {
        await fastify.listen({ port: 8000, host: '0.0.0.0' });
        console.log('Server is running on http://localhost:8000');
    } 
    catch (err) 
    {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();