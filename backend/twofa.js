module.exports = async function (fastify, options) {
    const { dbGetAsync, dbRunAsync } = options;

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

}
