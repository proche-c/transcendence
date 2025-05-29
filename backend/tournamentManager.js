class TournamentManager {
    constructor() {
        this.players = new Map();
        this.matches = new Map();
        this.currentMatch = null;
        this.tournamentStatus = 'waiting';
        this.winner = null;
        this.matchIdCounter = 1;
        this.semifinals = [];
        this.final = null;
    }

    addPlayer(id, alias) {
        if (this.players.size >= 4) {
            return { success: false, message: 'Torneo completo' };
        }

        if (this.tournamentStatus !== 'waiting') {
            return { success: false, message: 'El torneo ya ha comenzado' };
        }

        for (let player of this.players.values()) {
            if (player.alias === alias) {
                return { success: false, message: 'Alias ya en uso' };
            }
        }

        if (this.players.has(id)) {
            return { success: false, message: 'Jugador ya registrado' };
        }

        this.players.set(id, {
            id,
            alias,
            status: 'connected'
        });

        console.log(`Jugador ${alias} (${id}) agregado al torneo`);

        if (this.players.size === 4) {
            this.startTournament();
        }

        return { 
            success: true, 
            message: `Jugador ${alias} registrado. ${4 - this.players.size} jugadores restantes.`,
            playersCount: this.players.size
        };
    }

    startTournament() {
        console.log('Iniciando torneo con 4 jugadores...');
        this.tournamentStatus = 'in_progress';
        
        const playersList = Array.from(this.players.values());
        const shuffled = [...playersList].sort(() => Math.random() - 0.5);
        
        const semifinal1 = this.createMatch('semifinal', shuffled[0], shuffled[1]);
        const semifinal2 = this.createMatch('semifinal', shuffled[2], shuffled[3]);
        
        this.semifinals = [semifinal1.id, semifinal2.id];
        
        console.log(`Semifinal 1: ${shuffled[0].alias} vs ${shuffled[1].alias}`);
        console.log(`Semifinal 2: ${shuffled[2].alias} vs ${shuffled[3].alias}`);
        
        this.startNextMatch();
    }

    createMatch(round, player1, player2) {
        const matchId = this.matchIdCounter++;
        const match = {
            id: matchId,
            round,
            player1: player1.id,
            player2: player2.id,
            player1Alias: player1.alias,
            player2Alias: player2.alias,
            winner: null,
            status: 'pending'
        };
        
        this.matches.set(matchId, match);
        return match;
    }

    startNextMatch() {
        for (let match of this.matches.values()) {
            if (match.status === 'pending') {
                const player1 = this.players.get(match.player1);
                const player2 = this.players.get(match.player2);
                
                if (player1?.status === 'connected' && player2?.status === 'connected') {
                    match.status = 'in_progress';
                    this.currentMatch = match;
                    console.log(`Iniciando ${match.round}: ${match.player1Alias} vs ${match.player2Alias}`);
                    return match;
                } else {
                    if (player1?.status !== 'connected') {
                        this.handleAutoWin(match, match.player2);
                    } else if (player2?.status !== 'connected') {
                        this.handleAutoWin(match, match.player1);
                    }
                    continue;
                }
            }
        }
        return null;
    }

    handleAutoWin(match, winnerId) {
        console.log(`Victoria automática para ${this.players.get(winnerId)?.alias} en ${match.round}`);
        match.winner = winnerId;
        match.status = 'finished';
        this.processMatchResult(match);
    }

    reportMatchResult(winnerId) {
        if (!this.currentMatch) {
            return { success: false, message: 'No hay partido en curso' };
        }

        const match = this.currentMatch;
        
        if (match.player1 !== winnerId && match.player2 !== winnerId) {
            return { success: false, message: 'ID de ganador inválido' };
        }

        const winner = this.players.get(winnerId);
        if (!winner || winner.status !== 'connected') {
            return { success: false, message: 'El ganador debe estar conectado' };
        }

        match.winner = winnerId;
        match.status = 'finished';
        this.currentMatch = null;

        console.log(`${winner.alias} gana el ${match.round}`);

        this.processMatchResult(match);

        return { 
            success: true, 
            message: `${winner.alias} gana el ${match.round}`,
            match: match
        };
    }

    processMatchResult(match) {
        if (match.round === 'semifinal') {
            const semifinalsFinished = this.semifinals.every(semId => {
                const sem = this.matches.get(semId);
                return sem && sem.status === 'finished';
            });

            if (semifinalsFinished) {
                const winner1 = this.matches.get(this.semifinals[0]).winner;
                const winner2 = this.matches.get(this.semifinals[1]).winner;
                
                const player1 = this.players.get(winner1);
                const player2 = this.players.get(winner2);
                
                const finalMatch = this.createMatch('final', player1, player2);
                this.final = finalMatch.id;
                
                console.log(`Final: ${player1.alias} vs ${player2.alias}`);
                this.startNextMatch();
            } else {
                this.startNextMatch();
            }
        } else if (match.round === 'final') {
            this.winner = match.winner;
            this.tournamentStatus = 'finished';
            const winnerPlayer = this.players.get(this.winner);
            console.log(`¡Torneo terminado! Ganador: ${winnerPlayer.alias}`);
        }
    }

    handleDisconnect(id) {
        const player = this.players.get(id);
        if (!player) {
            return { success: false, message: 'Jugador no encontrado' };
        }

        player.status = 'disconnected';
        console.log(`Jugador ${player.alias} se ha desconectado`);

        if (this.currentMatch) {
            const match = this.currentMatch;
            if (match.player1 === id) {
                this.handleAutoWin(match, match.player2);
            } else if (match.player2 === id) {
                this.handleAutoWin(match, match.player1);
            }
        }

        if (this.tournamentStatus === 'waiting') {
            this.players.delete(id);
            console.log(`Jugador ${player.alias} eliminado de la lista de espera`);
        }

        return { 
            success: true, 
            message: `Jugador ${player.alias} desconectado`,
            tournamentStatus: this.tournamentStatus
        };
    }

    getTournamentState() {
        const playersArray = Array.from(this.players.values());
        const matchesArray = Array.from(this.matches.values());

        return {
            tournamentStatus: this.tournamentStatus,
            playersCount: this.players.size,
            players: playersArray,
            matches: matchesArray,
            currentMatch: this.currentMatch,
            semifinals: this.semifinals.map(id => this.matches.get(id)),
            final: this.final ? this.matches.get(this.final) : null,
            winner: this.winner ? this.players.get(this.winner) : null
        };
    }

    reset() {
        this.players.clear();
        this.matches.clear();
        this.currentMatch = null;
        this.tournamentStatus = 'waiting';
        this.winner = null;
        this.matchIdCounter = 1;
        this.semifinals = [];
        this.final = null;
        console.log('Torneo reiniciado');
    }

    getCurrentMatchInfo() {
        if (!this.currentMatch) {
            return null;
        }

        const match = this.currentMatch;
        const player1 = this.players.get(match.player1);
        const player2 = this.players.get(match.player2);

        return {
            matchId: match.id,
            round: match.round,
            player1: {
                id: player1.id,
                alias: player1.alias,
                status: player1.status
            },
            player2: {
                id: player2.id,
                alias: player2.alias,
                status: player2.status
            },
            status: match.status
        };
    }

    canPlayerJoin() {
        return this.players.size < 4 && this.tournamentStatus === 'waiting';
    }

    getUsedAliases() {
        return Array.from(this.players.values()).map(p => p.alias);
    }
}

module.exports = TournamentManager;