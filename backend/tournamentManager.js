class TournamentManager {
    constructor() {
        this.players = []; // Lista de jugadores
        this.state = "waiting"; // waiting, in_progress, finished
        this.maxPlayers = 4;
        this.connections = new Map(); // Conexiones WebSocket
        this.socketToPlayer = new Map(); // Mapeo de socketId a playerName
    }

    addPlayer(socketId, playerName) {
        console.log(`[Torneo] Intentando agregar: ${playerName} (${socketId})`);
        
        // Ya tenemos 4 jugadores
        if (this.players.length >= this.maxPlayers) {
            return { success: false, message: "Torneo completo (4/4)" };
        }

        // Nombre ya usado
        if (this.players.some(p => p.name === playerName)) {
            return { success: false, message: "Nombre ya en uso" };
        }

        // Agregar jugador
        this.players.push({
            id: socketId,
            name: playerName,
            connected: true
        });
        
        // Mapear socketId al nombre del jugador
        this.socketToPlayer.set(socketId, playerName);

        console.log(`[Torneo] Jugador agregado: ${this.players.length}/${this.maxPlayers}`);
        
        // Si llegamos a 4 jugadores, iniciar el torneo
        if (this.players.length === this.maxPlayers) {
            setTimeout(() => this.startTournament(), 2000); 
        }

        return { 
            success: true, 
            message: `Te has unido (${this.players.length}/${this.maxPlayers})`,
            players: this.players
        };
    }

    startTournament() {
        if (this.state !== "waiting") return;
        
        console.log("[Torneo] Iniciando torneo con 4 jugadores");
        this.state = "in_progress";
        
        // Notificar a todos los jugadores
        this.broadcast({
            type: "tournament_started",
            message: "¡El torneo ha comenzado!",
            players: this.players
        });
    }

    getTournamentState() {
        return {
            state: this.state,
            players: this.players,
            currentPlayers: this.players.length,
            maxPlayers: this.maxPlayers
        };
    }

    handleDisconnect(socketId) {
        // Obtener el nombre si existe
        const playerName = this.socketToPlayer.get(socketId);
        
        if (playerName) {
            console.log(`[Torneo] ${playerName} se ha desconectado`);
            
            // Buscar índice del jugador
            const playerIndex = this.players.findIndex(p => p.id === socketId);
            
            if (playerIndex >= 0) {
                // Si estamos esperando, quitar al jugador
                if (this.state === "waiting") {
                    this.players.splice(playerIndex, 1);
                } else {
                    // Si el torneo ya comenzó, marcarlo como desconectado
                    this.players[playerIndex].connected = false;
                }
                
                // Notificar a todos
                this.broadcast({
                    type: "tournament_player_left",
                    message: `${playerName} ha abandonado el torneo`,
                    players: this.players
                });
            }
            
            // Eliminar el mapeo
            this.socketToPlayer.delete(socketId);
        }
        
        // Quitar conexión
        this.connections.delete(socketId);
    }
    
    reset() {
        console.log("[Torneo] Reiniciando torneo");
        this.players = [];
        this.state = "waiting";
        this.socketToPlayer.clear();
        
        this.broadcast({
            type: "tournament_reset",
            message: "Torneo reiniciado"
        });
    }

    // Gestión de WebSockets
    registerConnection(socketId, connection) {
        this.connections.set(socketId, connection);
        console.log(`[Torneo] Conexión registrada: ${socketId}`);
    }

    broadcast(message) {
        console.log(`[Torneo] Broadcast: ${message.type} a ${this.connections.size} conexiones`);
        this.connections.forEach((conn, _) => {
            if (conn.readyState === 1) { // WebSocket.OPEN
                try {
                    conn.send(JSON.stringify(message));
                } catch (err) {
                    console.error("[Torneo] Error al enviar mensaje:", err);
                }
            }
        });
    }
}

module.exports = TournamentManager;