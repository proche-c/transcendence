async function handleTournamentJoin(connection, data, dbGetAsync, dbRunAsync, dbAllAsync, fastify) {
  console.log(`[Tournament] Intentando unir jugador: ${data.playerName} (userId: ${connection.userId})`);
  
  if (!data.playerName || data.playerName.trim().length < 2) {
    console.log(`[Tournament] Error: Nombre inválido: ${data.playerName}`);
    connection.send(JSON.stringify({
      type: 'tournament_join_result',
      success: false,
      message: 'El nombre debe tener al menos 2 caracteres'
    }));
    return;
  }

  try {
    // Verificar que connection.userId existe
    if (!connection.userId) {
      console.error('[Tournament] Error: connection.userId no está definido');
      connection.send(JSON.stringify({
        type: 'tournament_join_result',
        success: false,
        message: 'Error de autenticación: usuario no identificado'
      }));
      return;
    }

    console.log(`[Tournament] Buscando torneo activo...`);
    
    // Buscar torneo activo (waiting)
    let tournament = await dbGetAsync(
      "SELECT * FROM tournaments WHERE status = 'waiting' ORDER BY created_at DESC LIMIT 1"
    );

    console.log(`[Tournament] Torneo encontrado:`, tournament);

    // Si no hay torneo, crear uno nuevo
    if (!tournament) {
      console.log(`[Tournament] Creando nuevo torneo...`);
      const result = await dbRunAsync(
        "INSERT INTO tournaments (name, status, max_players, current_players) VALUES (?, ?, ?, ?)",
        ['Torneo Pong', 'waiting', 4, 0]
      );
      
      console.log(`[Tournament] Torneo creado con ID: ${result.lastID}`);
      tournament = await dbGetAsync("SELECT * FROM tournaments WHERE id = ?", [result.lastID]);
      console.log(`[Tournament] Torneo recuperado:`, tournament);
    }

    // Verificar si el torneo está lleno
    if (tournament.current_players >= tournament.max_players) {
      console.log(`[Tournament] Torneo lleno: ${tournament.current_players}/${tournament.max_players}`);
      connection.send(JSON.stringify({
        type: 'tournament_join_result',
        success: false,
        message: 'El torneo está completo (4/4)'
      }));
      return;
    }

    console.log(`[Tournament] Verificando si el usuario ${connection.userId} ya está en el torneo ${tournament.id}...`);
    
    // Verificar si el usuario ya está en el torneo
    const existingPlayer = await dbGetAsync(
      "SELECT * FROM tournament_players WHERE tournament_id = ? AND user_id = ?",
      [tournament.id, connection.userId]
    );

    console.log(`[Tournament] Usuario existente en torneo:`, existingPlayer);

    if (existingPlayer) {
      connection.send(JSON.stringify({
        type: 'tournament_join_result',
        success: false,
        message: 'Ya estás en este torneo'
      }));
      return;
    }

    console.log(`[Tournament] Verificando si el nombre ${data.playerName} ya está en uso...`);
    
    // Verificar si el nombre ya está en uso en este torneo
    const existingName = await dbGetAsync(
      "SELECT * FROM tournament_players WHERE tournament_id = ? AND player_name = ?",
      [tournament.id, data.playerName]
    );

    console.log(`[Tournament] Nombre existente en torneo:`, existingName);

    if (existingName) {
      connection.send(JSON.stringify({
        type: 'tournament_join_result',
        success: false,
        message: 'Nombre ya en uso en este torneo'
      }));
      return;
    }

    console.log(`[Tournament] Añadiendo jugador a la base de datos...`);
    
    // Añadir jugador al torneo
    await dbRunAsync(
      "INSERT INTO tournament_players (tournament_id, user_id, player_name, is_connected) VALUES (?, ?, ?, ?)",
      [tournament.id, connection.userId, data.playerName, 1]
    );

    console.log(`[Tournament] Jugador añadido exitosamente`);

    // Actualizar contador de jugadores
    const newPlayerCount = tournament.current_players + 1;
    await dbRunAsync(
      "UPDATE tournaments SET current_players = ? WHERE id = ?",
      [newPlayerCount, tournament.id]
    );

    console.log(`[Tournament] Contador actualizado a ${newPlayerCount}`);

    // Obtener lista actualizada de jugadores
    const players = await dbAllAsync(
      `SELECT tp.*, u.username 
       FROM tournament_players tp 
       JOIN users u ON tp.user_id = u.id 
       WHERE tp.tournament_id = ? 
       ORDER BY tp.joined_at`,
      [tournament.id]
    );

    console.log(`[Tournament] Lista de jugadores obtenida:`, players);

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

    // Broadcast a TODOS los usuarios conectados al torneo usando el mapa global
    if (fastify.tournamentSockets) {
      const tournamentState = {
        status: tournament.status,
        players: players.map(p => ({
          name: p.player_name,
          connected: p.is_connected,
          id: p.user_id
        })),
        current_players: newPlayerCount,
        max_players: tournament.max_players,
        tournament_id: tournament.id
      };

      fastify.tournamentSockets.forEach((clientSocket) => {
        if (clientSocket.readyState === clientSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'tournament_update',
            state: tournamentState
          }));
        }
      });
    }

    // Si el torneo está lleno, iniciarlo
    if (newPlayerCount >= tournament.max_players) {
      await startTournament(tournament.id, dbGetAsync, dbRunAsync, dbAllAsync, fastify);
    }

    fastify.log.info(`[Tournament] ${data.playerName} se unió al torneo ${tournament.id} (${newPlayerCount}/${tournament.max_players})`);

  } catch (error) {
    console.error(`[Tournament] Error detallado al unirse:`, error);
    console.error(`[Tournament] Stack trace:`, error.stack);
    fastify.log.error(`[Tournament] Error al unirse: ${error.message}`);
    connection.send(JSON.stringify({
      type: 'tournament_join_result',
      success: false,
      message: `Error interno del servidor: ${error.message}`
    }));
  }
}

async function handleTournamentState(connection, data, dbGetAsync, dbAllAsync, fastify) {
  try {
    // Obtener torneo activo
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

    // Obtener jugadores
    const players = await dbAllAsync(
      `SELECT tp.*, u.username 
       FROM tournament_players tp 
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
    fastify.log.error(`[Tournament] Error al obtener estado: ${error.message}`);
  }
}

async function handleTournamentReset(connection, data, dbGetAsync, dbRunAsync, fastify) {
  try {
    // Marcar todos los torneos activos como completados
    await dbRunAsync(
      "UPDATE tournaments SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE status IN ('waiting', 'in_progress')"
    );

    // Broadcast a todos los usuarios conectados
    if (fastify.tournamentSockets) {
      fastify.tournamentSockets.forEach((clientSocket) => {
        if (clientSocket.readyState === clientSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'tournament_reset',
            message: 'El torneo ha sido reiniciado'
          }));
        }
      });
    }

    fastify.log.info(`[Tournament] Torneo reiniciado por ${connection.username}`);

  } catch (error) {
    fastify.log.error(`[Tournament] Error al reiniciar: ${error.message}`);
  }
}

async function startTournament(tournamentId, dbGetAsync, dbRunAsync, dbAllAsync, fastify) {
  try {
    // Marcar torneo como iniciado
    await dbRunAsync(
      "UPDATE tournaments SET status = 'in_progress', started_at = CURRENT_TIMESTAMP WHERE id = ?",
      [tournamentId]
    );

    // Obtener jugadores
    const players = await dbAllAsync(
      "SELECT * FROM tournament_players WHERE tournament_id = ? ORDER BY joined_at",
      [tournamentId]
    );

    // Crear semifinales (round 1)
    await dbRunAsync(
      "INSERT INTO tournament_matches (tournament_id, round_number, player1_id, player2_id) VALUES (?, ?, ?, ?)",
      [tournamentId, 1, players[0].user_id, players[1].user_id]
    );

    await dbRunAsync(
      "INSERT INTO tournament_matches (tournament_id, round_number, player1_id, player2_id) VALUES (?, ?, ?, ?)",
      [tournamentId, 1, players[2].user_id, players[3].user_id]
    );

    fastify.log.info(`[Tournament] Torneo ${tournamentId} iniciado con 4 jugadores`);

    // Notificar a todos los usuarios conectados al torneo
    if (fastify.tournamentSockets) {
      fastify.tournamentSockets.forEach((clientSocket) => {
        if (clientSocket.readyState === clientSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'tournament_started',
            message: '¡El torneo ha comenzado!',
            tournament_id: tournamentId
          }));
        }
      });
    }

  } catch (error) {
    fastify.log.error(`[Tournament] Error al iniciar torneo: ${error.message}`);
  }
}

module.exports = {
  handleTournamentJoin,
  handleTournamentState,
  handleTournamentReset
};