const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const pump = require("pump");
const multipart = require("@fastify/multipart");
const authMiddlewareAUX = require("./authMiddleware");

module.exports = async function statsRoutes(fastify, options) {
  const dbGetAsync = options.dbGetAsync;
  const dbRunAsync = options.dbRunAsync;
  const authMiddleware = authMiddlewareAUX(dbGetAsync, fastify);
  fastify.register(multipart);

// Función para asegurarnos de que exista un registro en user_stats
/*async function ensureUserStats(userId) {
    const row = await dbGetAsync(
      'SELECT user_id FROM user_stats WHERE user_id = ?',
      [userId]
    );
    if (!row) {
      await dbRunAsync(
        'INSERT INTO user_stats (user_id) VALUES (?)',
        [userId]
      );
    }
  }*/
  
  // Ruta POST /api/stats

fastify.post('/api/stats', { preHandler: authMiddleware }, async (request, reply) => {
  const userId = request.user.id;

  try {
    // Leer todos los campos del multipart
    const parts = request.parts();

    let goalsFor, goalsAgainst;

    for await (const part of parts) {
      if (part.type === 'field') {
        if (part.fieldname === 'goalsFor') {
          goalsFor = Number(await part.value);
        } else if (part.fieldname === 'goalsAgainst') {
          goalsAgainst = Number(await part.value);
        }
      }
    }

    // Validar datos
    if (typeof goalsFor !== 'number' || isNaN(goalsFor) ||
        typeof goalsAgainst !== 'number' || isNaN(goalsAgainst)) {
      return reply.code(400).send({ error: 'Invalid or missing goals data' });
    }

    // Actualizar estadísticas del usuario
    await dbRunAsync(
      `UPDATE users
         SET total_matches = total_matches + 1,
             total_wins    = total_wins + CASE WHEN ? > ? THEN 1 ELSE 0 END,
             total_losses  = total_losses + CASE WHEN ? < ? THEN 1 ELSE 0 END,
             goals_for     = goals_for + ?,
             goals_against = goals_against + ?
       WHERE id = ?`,
      [goalsFor, goalsAgainst, goalsFor, goalsAgainst, goalsFor, goalsAgainst, userId]
    );

    // Actualizar ranking global en la tabla `users`
    await dbRunAsync(`
      WITH ranked AS (
        SELECT
          id,
          RANK() OVER (
            ORDER BY total_wins DESC, (goals_for - goals_against) DESC
          ) AS pos
        FROM users
      )
      UPDATE users
      SET ranking = (
        SELECT pos FROM ranked WHERE ranked.id = users.id
      );
    `);

    return reply.code(200).send({ success: true });

  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'DB error' });
  }
});
}
