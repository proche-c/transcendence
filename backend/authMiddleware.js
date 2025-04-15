// TENGO QUE QUITAR EL PASSWORD DE LA RESPONSE!!!!!

module.exports = function (dbGetAsync, fastify) {
    return async function verifyJWT(request, reply) {
        try {
            const token = request.cookies.token;
            if (!token)
                return reply.status(407).send({ message: 'No token provided'});
            const decoded = await fastify.jwt.verify(token);
            // fastify.log.err('***********decoded');
            console.log('-------------*****ENTRO EN VERIFICAR TOKEN');
            console.log('********estoy en decoded');
            const user = await dbGetAsync('SELECT * FROM users WHERE id = ?', [decoded.userId]);

            if (!user) {
                return reply.status(404).send({ message: 'User not found'});
            }

            request.user = user;
        } catch (err) {
            return reply.status(403).send({ message: 'Unauthorized bitch' });
        }
    }
}