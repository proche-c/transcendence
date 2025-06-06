const { handleTournamentMessage } = require('./tournamentHandler');

async function tournamentRoutes(fastify, options) {
  const db = options.db;
  const dbGetAsync = options.dbGetAsync;
  const dbRunAsync = options.dbRunAsync;
  const dbAllAsync = options.dbAllAsync;

  // Mapa para almacenar conexiones WebSocket del torneo
  const tournamentConnections = new Map();

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
      
      tournamentConnections.set(userId, connection);
      fastify.log.info(`User ${username} connected to tournament WebSocket`);

      // Enviar estado inicial del torneo
      await sendTournamentState(connection);

      connection.on('message', async (rawMessage) => {
        await handleTournamentMessage(
          connection, 
          rawMessage, 
          dbGetAsync, 
          dbRunAsync, 
          dbAllAsync, 
          fastify,
          tournamentConnections
        );
      });

      connection.on('close', () => {
        tournamentConnections.delete(userId);
        fastify.log.info(`User ${username} disconnected from tournament`);
        
        // Marcar como desconectado en la base de datos
        updatePlayerConnectionStatus(userId, false);
      });

    } catch (err) {
      fastify.log.error({ err }, 'WebSocket tournament error during connection');
    }
  });

  // Función para enviar estado inicial
  async function sendTournamentState(connection) {
    try {
      const tournament = await dbGetAsync(
        "SELECT * FROM tournaments WHERE status IN ('waiting', 'in_progress') ORDER BY created_at DESC LIMIT 1"
      );

      if (!tournament) {
        connection.send(JSON.stringify({
          type: 'tournament_state',
          state: {
            status: 'no_tournament',
            players: [],
            current_players: 0,
            max_players: 4
          }
        }));
        return;
      }

      const players = await dbAllAsync(
        `SELECT tp.*, u.username 
         FROM tournament_participants tp 
         JOIN users u ON tp.user_id = u.id 
         WHERE tp.tournament_id = ? 
         ORDER BY tp.joined_at`,
        [tournament.id]
      );

      connection.send(JSON.stringify({
        type: 'tournament_state',
        state: {
          status: tournament.status,
          players: players.map(p => ({
            name: p.player_name,
            connected: p.is_connected,
            id: p.user_id
          })),
          current_players: tournament.current_players,
          max_players: tournament.max_players,
          tournament_id: tournament.id
        }
      }));

    } catch (error) {
      fastify.log.error(`Error sending tournament state: ${error.message}`);
    }
  }

  // Función para actualizar estado de conexión
  async function updatePlayerConnectionStatus(userId, isConnected) {
    try {
      await dbRunAsync(
        "UPDATE tournament_participants SET is_connected = ? WHERE user_id = ? AND tournament_id IN (SELECT id FROM tournaments WHERE status IN ('waiting', 'in_progress'))",
        [isConnected ? 1 : 0, userId]
      );
    } catch (error) {
      fastify.log.error(`Error updating connection status: ${error.message}`);
    }
  }

  // Exponer las conexiones para broadcasting
  fastify.decorate('tournamentConnections', tournamentConnections);
}

module.exports = tournamentRoutes;