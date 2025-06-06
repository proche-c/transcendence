
async function handleTournamentMessage(connection, rawMessage, dbGetAsync, dbRunAsync, dbAllAsync, fastify, tournamentConnections) {
  let data;
  try {
    data = JSON.parse(rawMessage);
  } catch (err) {
    connection.send(JSON.stringify({ type: 'error', message: "Invalid message format" }));
    return;
  }

  switch (data.type) {
    case 'tournament_join':
      await handleTournamentJoin(connection, data, dbGetAsync, dbRunAsync, dbAllAsync, fastify, tournamentConnections);
      break;
    
    case 'tournament_get_state':
      await handleTournamentState(connection, dbGetAsync, dbAllAsync);
      break;
    
    case 'tournament_reset':
      await handleTournamentReset(connection, dbRunAsync, fastify, tournamentConnections);
      break;
    
    default:
      connection.send(JSON.stringify({ 
        type: 'error', 
        message: "Unknown tournament message type" 
      }));
  }
}

async function handleTournamentJoin(connection, data, dbGetAsync, dbRunAsync, dbAllAsync, fastify, tournamentConnections) {
  if (!data.playerName || data.playerName.trim().length < 2) {
    connection.send(JSON.stringify({
      type: 'tournament_join_result',
      success: false,
      message: 'El nombre debe tener al menos 2 caracteres'
    }));
    return;
  }

  try {
    // Buscar torneo activo (similar a buscar chatroom activo)
    let tournament = await dbGetAsync(
      "SELECT * FROM tournaments WHERE status = 'waiting' ORDER BY created_at DESC LIMIT 1"
    );

    // Si no hay torneo, crear uno nuevo (similar a crear chatroom)
    if (!tournament) {
      const result = await dbRunAsync(
        "INSERT INTO tournaments (name, status, max_players, current_players) VALUES (?, ?, ?, ?)",
        ['Pong Tournament', 'waiting', 4, 0]
      );
      
      tournament = await dbGetAsync("SELECT * FROM tournaments WHERE id = ?", [result.lastID]);
    }

    // Verificar si el torneo está lleno
    if (tournament.current_players >= tournament.max_players) {
      connection.send(JSON.stringify({
        type: 'tournament_join_result',
        success: false,
        message: 'El torneo está completo (4/4)'
      }));
      return;
    }

    // Verificar si el usuario ya está en el torneo
    const existingPlayer = await dbGetAsync(
      "SELECT * FROM tournament_participants WHERE tournament_id = ? AND user_id = ?",
      [tournament.id, connection.userId]
    );

    if (existingPlayer) {
      connection.send(JSON.stringify({
        type: 'tournament_join_result',
        success: false,
        message: 'Ya estás en este torneo'
      }));
      return;
    }

    // Añadir jugador al torneo
    await dbRunAsync(
      "INSERT INTO tournament_participants (tournament_id, user_id, player_name, is_connected) VALUES (?, ?, ?, ?)",
      [tournament.id, connection.userId, data.playerName, 1]
    );

    // Actualizar contador de jugadores
    const newPlayerCount = tournament.current_players + 1;
    await dbRunAsync(
      "UPDATE tournaments SET current_players = ? WHERE id = ?",
      [newPlayerCount, tournament.id]
    );

    // Obtener lista actualizada de jugadores
    const players = await dbAllAsync(
      `SELECT tp.*, u.username 
       FROM tournament_participants tp 
       JOIN users u ON tp.user_id = u.id 
       WHERE tp.tournament_id = ? 
       ORDER BY tp.joined_at`,
      [tournament.id]
    );

    // Responder al usuario que se unió
    connection.send(JSON.stringify({
      type: 'tournament_join_result',
      success: true,
      message: `Te has unido al torneo (${newPlayerCount}/${tournament.max_players})`,
      players: players.map(p => ({
        name: p.player_name,
        connected: p.is_connected,
        id: p.user_id
      }))
    }));

    // Broadcast a todos los usuarios conectados (como en el chat)
    broadcastToTournament(tournamentConnections, {
      type: 'tournament_update',
      state: {
        status: tournament.status,
        players: players.map(p => ({
          name: p.player_name,
          connected: p.is_connected,
          id: p.user_id
        })),
        current_players: newPlayerCount,
        max_players: tournament.max_players,
        tournament_id: tournament.id
      }
    });

    // Si el torneo está lleno, iniciarlo automáticamente
    if (newPlayerCount >= tournament.max_players) {
      await startTournament(tournament.id, dbRunAsync, fastify, tournamentConnections);
    }

    fastify.log.info(`${data.playerName} se unió al torneo ${tournament.id} (${newPlayerCount}/${tournament.max_players})`);

  } catch (error) {
    fastify.log.error(`Error al unirse al torneo: ${error.message}`);
    connection.send(JSON.stringify({
      type: 'tournament_join_result',
      success: false,
      message: 'Error interno del servidor'
    }));
  }
}

async function handleTournamentState(connection, dbGetAsync, dbAllAsync) {
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
    console.error(`Error al obtener estado del torneo: ${error.message}`);
  }
}

async function handleTournamentReset(connection, dbRunAsync, fastify, tournamentConnections) {
  try {
    // Marcar todos los torneos activos como completados
    await dbRunAsync(
      "UPDATE tournaments SET status = 'completed', end_date = CURRENT_TIMESTAMP WHERE status IN ('waiting', 'in_progress')"
    );

    // Broadcast a todos los usuarios conectados
    broadcastToTournament(tournamentConnections, {
      type: 'tournament_reset',
      message: 'El torneo ha sido reiniciado'
    });

    fastify.log.info(`Torneo reiniciado por ${connection.username}`);

  } catch (error) {
    fastify.log.error(`Error al reiniciar torneo: ${error.message}`);
  }
}

async function startTournament(tournamentId, dbRunAsync, fastify, tournamentConnections) {
  try {
    // Marcar torneo como iniciado
    await dbRunAsync(
      "UPDATE tournaments SET status = 'in_progress', start_date = CURRENT_TIMESTAMP WHERE id = ?",
      [tournamentId]
    );

    fastify.log.info(`Torneo ${tournamentId} iniciado con 4 jugadores`);

    // Notificar a todos los usuarios conectados al torneo
    broadcastToTournament(tournamentConnections, {
      type: 'tournament_started',
      message: '¡El torneo ha comenzado! Se crearán las partidas automáticamente.',
      tournament_id: tournamentId
    });

    // Aquí puedes integrar con el sistema de salas de juegos para crear las partidas

  } catch (error) {
    fastify.log.error(`Error al iniciar torneo: ${error.message}`);
  }
}

// Función de broadcast similar a la del chat
function broadcastToTournament(connections, message) {
  connections.forEach((connection) => {
    if (connection.readyState === connection.OPEN) {
      connection.send(JSON.stringify(message));
    }
  });
}

module.exports = {
  handleTournamentMessage
};