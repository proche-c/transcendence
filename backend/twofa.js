const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const bcrypt = require('bcrypt');

module.exports = async function (fastify, options) {
    const { dbGetAsync, dbRunAsync } = options;

// 2fa setup
fastify.post('/2fa/setup', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    //console.log("Token received on server side: ", request.cookies.token);
    const userId = request.user.id;

    const secret = speakeasy.generateSecret({
        name: `PongApp (${request.user.username})`, // Name of the service printed in the authenticator app
    });

    await dbRunAsync('UPDATE users SET twofa_secret = ?, is_twofa_enabled = 1 WHERE id = ?', [secret.base32, userId]);

    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    return reply.send({
        message: '2FA setup',
        qrCode,
        //secret: secret.base32, // to hide in production
    });
});

// Verify 2FA code
fastify.post('/2fa/verify', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    request.log.info("➡️ /2fa/verify called");
    //request.log.info({ cookies: request.cookies, user: request.user }, "🔍 Info received");
   
    const { token } = request.body;
    //console.log("🔢 2FA code received:", token);

    const userId = request.user.id;

    const user = await dbGetAsync('SELECT twofa_secret FROM users WHERE id = ?', [userId]);
    if (!user || !user.twofa_secret) {
        return reply.status(400).send({ message: '2FA not set up' });
    }

    const verified = speakeasy.totp.verify({
        secret: user.twofa_secret,
        encoding: 'base32',
        token,
        window: 2
    });
    console.log("✅ speakeasy check:", verified);

    if (!verified) 
    {
        return reply.status(401).send({ message: 'Invalid 2FA code' });
    }
    return reply.send({ message: '2FA verified successfully' });
});

// Disable 2FA with password confirmation
fastify.post('/2fa/disable', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const { password } = request.body;

    if (!password) {
    return reply.status(400).send({ message: 'Password is required to disable 2FA' });
  }

  const user = await dbGetAsync('SELECT password_hash FROM users WHERE id = ?', [userId]);
  if (!user) {
    return reply.status(404).send({ message: 'User not found' });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  
  if (!isMatch) {
    return reply.status(401).send({ message: 'Invalid password' });
  }

    await dbRunAsync('UPDATE users SET twofa_secret = NULL, is_twofa_enabled = 0 WHERE id = ?', [userId]);

    return reply.send({ message: '2FA disabled' });
});
}