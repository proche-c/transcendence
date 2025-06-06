const {
  handleTournamentJoin,
  handleTournamentState,
  handleTournamentReset
} = require('./tournamentHandler');

async function tournamentRoutes(fastify, options) {
  const db = options.db;
  const dbGetAsync = options.dbGetAsync;
  const dbRunAsync = options.dbRunAsync;
  const dbAllAsync = options.dbAllAsync;
  const userSockets = new Map();

  fastify.get('/', { websocket: true }, async (connection, req) => {
    try {
      const token = req.cookies.token;
      if (!token) {
        fastify.log.warn('WebSocket tournament connection rejected: no token');
        connection.close();
        return;
      }

      let payload;
      try {
        payload = fastify.jwt.verify(token);
      } catch (err) {
        fastify.log.warn('WebSocket tournament JWT verification failed');
        connection.close();
        return;
      }

      const { userId, username } = payload;
      connection.userId = userId;
      connection.username = username;
      userSockets.set(userId, connection);
      fastify.log.info(`User ${username} connected to tournament WebSocket`);

      connection.on('message', async (rawMessage) => {
        let data;
        try {
          data = JSON.parse(rawMessage);
        } catch (err) {
          connection.send(JSON.stringify({ type: 'error', message: "Invalid message format" }));
          return;
        }

        switch (data.type) {
          case 'tournament_join':
            await handleTournamentJoin(connection, data, dbGetAsync, dbRunAsync, dbAllAsync, fastify);
            break;
          
          case 'tournament_get_state':
            await handleTournamentState(connection, data, dbGetAsync, dbAllAsync, fastify);
            break;
          
          case 'tournament_reset':
            await handleTournamentReset(connection, data, dbGetAsync, dbRunAsync, fastify);
            break;
          
          default:
            connection.send(JSON.stringify({ 
              type: 'error', 
              message: "Unknown tournament message type" 
            }));
        }
      });

      connection.on('close', () => {
        userSockets.delete(userId);
        fastify.log.info(`User ${username} disconnected from tournament`);
        
        // Marcar como desconectado en la base de datos
        dbRunAsync(
          "UPDATE tournament_players SET is_connected = 0 WHERE user_id = ? AND tournament_id IN (SELECT id FROM tournaments WHERE status IN ('waiting', 'in_progress'))",
          [userId]
        ).catch(err => fastify.log.error('Error updating tournament player connection status:', err));
      });

    } catch (err) {
      fastify.log.error({ err }, 'WebSocket tournament error during connection');
    }
  });

  // Exponer el mapa de sockets para uso global
  fastify.decorate('tournamentSockets', userSockets);
}

module.exports = tournamentRoutes;