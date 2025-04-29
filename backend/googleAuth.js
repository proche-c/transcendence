module.exports = async function (fastify, options) {

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

}