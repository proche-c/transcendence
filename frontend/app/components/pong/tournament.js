import { SERVER_IP } from '../../config.js';

class TournamentComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.socket = null;
        this.currentPlayerId = null;
        this.render();
    }

    render() {
        if (!this.shadowRoot) return;

        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css";

        this.shadowRoot.innerHTML = `
            <div class="flex h-screen bg-gray-900 text-white">
                <div class="">
                    <pong-menu></pong-menu>
                </div>
                
                <div class="flex flex-1">
                    <div class="w-1/3 p-6 bg-gray-800">
                        <h2 class="text-2xl font-bold mb-4">Torneo Pong</h2>
                        
                        <div id="tournamentJoin" class="mb-6">
                            <div class="mb-4">
                                <label class="block text-sm font-medium mb-2">Tu alias para el torneo:</label>
                                <input type="text" id="aliasInput" class="w-full p-2 border rounded bg-gray-700 text-white" placeholder="Ingresa tu alias" maxlength="15">
                            </div>
                            <button id="joinTournamentBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition">
                                Unirse al Torneo
                            </button>
                        </div>
                        
                        <div id="tournamentStatus" class="mb-4">
                            <h3 class="text-lg font-semibold mb-2">Estado del Torneo</h3>
                            <div id="statusText" class="text-sm text-gray-300"></div>
                            <div id="playersList" class="mt-2"></div>
                        </div>

                        <div id="matchInfo" class="mb-4" style="display: none;">
                            <h3 class="text-lg font-semibold mb-2">Partido Actual</h3>
                            <div id="currentMatchText" class="text-sm text-gray-300"></div>
                            <div id="matchControls" class="mt-2" style="display: none;">
                                <button id="declareWinnerBtn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm transition">
                                    Declarar Victoria
                                </button>
                            </div>
                        </div>

                        <button id="backToPlayBtn" class="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition">
                            Volver a Play
                        </button>
                    </div>
                    
                    <div class="flex-1 flex items-center justify-center">
                        <div id="tournamentBracket" class="text-center">
                            <h3 class="text-xl font-semibold mb-4">Bracket del Torneo</h3>
                            <div id="bracketDisplay" class="text-sm text-gray-300">
                                Esperando jugadores...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.shadowRoot.appendChild(style);
        this.setupEventListeners();
        this.connectWebSocket();
    }

    setupEventListeners() {
        const joinBtn = this.shadowRoot?.getElementById('joinTournamentBtn');
        const aliasInput = this.shadowRoot?.getElementById('aliasInput');
        const backBtn = this.shadowRoot?.getElementById('backToPlayBtn');
        const declareWinnerBtn = this.shadowRoot?.getElementById('declareWinnerBtn');

        joinBtn?.addEventListener('click', () => {
            const alias = aliasInput.value.trim();
            if (!alias) {
                alert('Por favor ingresa un alias');
                return;
            }
            
            this.socket?.send(JSON.stringify({
                type: 'tournament_join',
                alias: alias
            }));
        });

        backBtn?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('back-to-play', { bubbles: true }));
        });

        declareWinnerBtn?.addEventListener('click', () => {
            if (this.currentPlayerId) {
                this.socket?.send(JSON.stringify({
                    type: 'tournament_match_result',
                    winnerId: this.currentPlayerId
                }));
            }
        });
    }

    connectWebSocket() {
        this.socket = new WebSocket(`wss://${SERVER_IP}:8443/api/game`);
        
        this.socket.onopen = () => {
            console.log('Conectado al torneo');
            this.socket?.send(JSON.stringify({ type: 'tournament_get_state' }));
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'tournament_join_result':
                    this.handleJoinResult(data);
                    break;

                case 'tournament_state':
                    this.updateTournamentDisplay(data.state);
                    break;

                case 'tournament_match_result_response':
                    if (data.success) {
                        console.log('Resultado registrado:', data.message);
                    } else {
                        alert(data.message);
                    }
                    break;
            }
        };

        this.socket.onerror = (error) => {
            console.error('Error WebSocket:', error);
        };
    }

    handleJoinResult(data) {
        const joinBtn = this.shadowRoot?.getElementById('joinTournamentBtn');
        const aliasInput = this.shadowRoot?.getElementById('aliasInput');

        if (data.success) {
            joinBtn.disabled = true;
            joinBtn.textContent = 'Unido al Torneo';
            aliasInput.disabled = true;
        } else {
            alert(data.message);
        }
    }

    updateTournamentDisplay(state) {
        const statusText = this.shadowRoot?.getElementById('statusText');
        const playersList = this.shadowRoot?.getElementById('playersList');
        const bracketDisplay = this.shadowRoot?.getElementById('bracketDisplay');

        if (statusText) {
            statusText.textContent = `Estado: ${state.tournamentStatus} - Jugadores: ${state.playersCount}/4`;
        }

        if (playersList) {
            const playersHtml = state.players.map((player) => 
                `<div class="flex justify-between items-center py-1">
                    <span>${player.alias}</span>
                    <span class="text-xs ${player.status === 'connected' ? 'text-green-400' : 'text-red-400'}">${player.status}</span>
                </div>`
            ).join('');
            playersList.innerHTML = playersHtml;
        }

        if (bracketDisplay) {
            this.updateBracketDisplay(state, bracketDisplay);
        }

        this.updateMatchControls(state);
    }

    updateBracketDisplay(state, bracketDisplay) {
        if (state.tournamentStatus === 'waiting') {
            bracketDisplay.innerHTML = 'Esperando jugadores...';
        } else {
            let bracketHtml = '<div class="space-y-2">';
            
            if (state.semifinals && state.semifinals.length > 0) {
                bracketHtml += '<h4 class="font-semibold">Semifinales:</h4>';
                state.semifinals.forEach((match) => {
                    if (match) {
                        const statusColor = match.status === 'finished' ? 'text-green-400' : 'text-yellow-400';
                        bracketHtml += `<div class="text-sm ${statusColor}">${match.player1Alias} vs ${match.player2Alias} - ${match.status}</div>`;
                    }
                });
            }
            
            if (state.final) {
                bracketHtml += '<h4 class="font-semibold mt-2">Final:</h4>';
                const statusColor = state.final.status === 'finished' ? 'text-green-400' : 'text-yellow-400';
                bracketHtml += `<div class="text-sm ${statusColor}">${state.final.player1Alias} vs ${state.final.player2Alias} - ${state.final.status}</div>`;
            }
            
            if (state.winner) {
                bracketHtml += `<h4 class="font-semibold mt-2 text-yellow-400">¡Ganador: ${state.winner.alias}!</h4>`;
            }
            
            bracketHtml += '</div>';
            bracketDisplay.innerHTML = bracketHtml;
        }
    }

    updateMatchControls(state) {
        const matchInfo = this.shadowRoot?.getElementById('matchInfo');
        const currentMatchText = this.shadowRoot?.getElementById('currentMatchText');
        const matchControls = this.shadowRoot?.getElementById('matchControls');

        if (state.currentMatch) {
            if (matchInfo) matchInfo.style.display = 'block';
            if (currentMatchText) {
                currentMatchText.textContent = `${state.currentMatch.round}: ${state.currentMatch.player1Alias} vs ${state.currentMatch.player2Alias}`;
            }
            if (matchControls) matchControls.style.display = 'block';
        } else {
            if (matchInfo) matchInfo.style.display = 'none';
        }
    }

    disconnectedCallback() {
        this.socket?.close();
    }
}

customElements.define("pong-tournament", TournamentComponent);