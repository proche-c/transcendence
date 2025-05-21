const oauthPlugin = require('@fastify/oauth2');
const fetch = require('node-fetch');
const path = require('path');

module.exports = async function (fastify, options) {
  const { dbGetAsync, dbRunAsync } = options;

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
    callbackUri: 'https://localhost:8443/auth/google/callback'
  });

  // Google callback route
  fastify.get('/auth/google/callback', async (request, reply) => {
    try {
      const token = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

      const googleUserRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });

      const googleUser = await googleUserRes.json();

      if (!googleUser || !googleUser.email) {
        return reply.status(400).send({ message: 'Unable to fetch Google profile' });
      }

      const { email, name: username, picture: avatar } = googleUser;

      let user = await dbGetAsync('SELECT * FROM users WHERE email = ?', [email]);

      if (!user) {
        const result = await dbRunAsync(
          'INSERT INTO users (email, username, avatar) VALUES (?, ?, ?)',
          [email, username, avatar || 'avatars/default.jpg']
        );

        user = {
          id: result.lastID,
          username,
          email,
          avatar: avatar || 'avatars/default.jpg',
        };
      }

      // Create JWT token
      const jwtToken = fastify.jwt.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        },
        { expiresIn: "1h" }
      );

      // Set cookie like in /login route
      reply.setCookie("token", jwtToken, {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        domain: "localhost",
        path: "/",
        maxAge: 60 * 70, // 70 minutes
      });

      return reply.redirect('http://localhost:5500/frontend/#profile');
    } catch (err) {
      return reply.status(500).send({ message: 'Google authentication failed', error: err.message });
    }
  });
};