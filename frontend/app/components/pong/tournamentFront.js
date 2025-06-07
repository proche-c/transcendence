import { SERVER_IP } from '../../config.js';
import { fetchUserProfile } from '../../utils/requests.js';

class TournamentComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.socket = null;
        this.username = null;
        this.render();
        this.loadUsername();
    }

    async loadUsername() {
        try {
            const user = await fetchUserProfile();
            if (user && user.username) {
                this.username = user.username;
                console.log('[Torneo] Usuario cargado:', this.username);
            }
        } catch (error) {
            console.error('[Torneo] Error al cargar perfil:', error);
        }
    }

    render() {
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css";

        this.shadowRoot.innerHTML = `
            <div class="flex h-screen justify-between">
                <div class="">
                    <pong-menu></pong-menu>
                </div>
                <div class="grow flex items-center justify-center">
                    <div class="group relative block max-w-screen-sm mx-auto">
                        <span class="absolute inset-0 border-2 border-dashed border-black"></span>
                        <div class="relative flex flex-col transform border-2 border-black bg-white transition-transform group-hover:scale-105 p-8">
                            <h2 class="text-2xl font-bold text-center mb-6">Pong Tournament</h2>
                            
                            <div id="join-form" class="mb-6">
                                <button id="join-btn" 
                                    class="p-4 mb-4 text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md w-full">
                                    Join Tournament
                                </button>
                            </div>
                            
                            <div class="mb-6 border border-gray-300 rounded overflow-hidden">
                                <div class="bg-gray-800 p-3 text-white text-center font-bold">
                                    Players: <span id="player-count">0</span>/4
                                </div>
                                
                                <div class="bg-white p-4">
                                    <div class="grid grid-cols-2 gap-3">
                                        <div id="player1" class="border border-dashed border-gray-400 rounded p-3 text-center text-gray-400">
                                            Waiting...
                                        </div>
                                        <div id="player2" class="border border-dashed border-gray-400 rounded p-3 text-center text-gray-400">
                                            Waiting...
                                        </div>
                                        <div id="player3" class="border border-dashed border-gray-400 rounded p-3 text-center text-gray-400">
                                            Waiting...
                                        </div>
                                        <div id="player4" class="border border-dashed border-gray-400 rounded p-3 text-center text-gray-400">
                                            Waiting...
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex justify-center">
                                <button id="back-btn" class="p-3 text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md px-6">
                                    Back
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="messages" class="fixed top-4 right-4 space-y-2"></div>
            </div>
        `;

        this.shadowRoot.appendChild(style);
        this.setupEvents();
        this.connectWebSocket();
    }

    setupEvents() {
        const joinBtn = this.shadowRoot.getElementById('join-btn');
        const backBtn = this.shadowRoot.getElementById('back-btn');
        
        joinBtn.addEventListener('click', () => this.joinTournament());
        backBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('back-to-play', { bubbles: true }));
        });
    }

    connectWebSocket() {
        try {
            this.socket = new WebSocket(`wss://${SERVER_IP}:8443/api/tournament`);
            
            this.socket.onopen = () => {
                console.log('[Torneo] Conectado');
                this.socket.send(JSON.stringify({ type: 'tournament_get_state' }));
            };
            
            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('[Torneo] Mensaje:', data);
                
                switch (data.type) {
                    case 'tournament_join_result':
                        this.handleJoinResult(data);
                        break;
                    case 'tournament_state':
                    case 'tournament_update':
                        this.updateTournamentState(data.state);
                        break;
                    case 'tournament_started':
                        this.showMessage(data.message);
                        break;
                    case 'tournament_reset':
                        this.showMessage(data.message);
                        this.resetUI();
                        break;
                }
            };
            
            this.socket.onerror = () => this.showMessage("Error de conexión");
            this.socket.onclose = () => this.showMessage("Conexión cerrada");
        } catch (error) {
            console.error('[Torneo] Error WebSocket:', error);
        }
    }

    joinTournament() {
        if (!this.username) {
            this.showMessage("Cargando usuario...");
            return;
        }

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'tournament_join',
                playerName: this.username
            }));
        }
    }

    handleJoinResult(data) {
        const joinBtn = this.shadowRoot.getElementById('join-btn');
        
        if (data.success) {
            this.showMessage(data.message);
            joinBtn.disabled = true;
            joinBtn.textContent = "✓ Joined";
            joinBtn.className = "p-4 mb-4 text-lg font-bold text-white bg-green-600 rounded-lg shadow-md w-full";
        } else {
            this.showMessage(data.message);
        }
    }

    updateTournamentState(state) {
        if (!state) return;
        
        const playerCount = this.shadowRoot.getElementById('player-count');
        if (playerCount) {
            playerCount.textContent = state.current_players;
        }
        
        this.updatePlayersList(state.players);
    }

    updatePlayersList(players) {
        for (let i = 1; i <= 4; i++) {
            const slot = this.shadowRoot.getElementById(`player${i}`);
            if (slot) {
                if (players[i-1]) {
                    slot.textContent = players[i-1].name;
                    slot.className = players[i-1].name === this.username ? 
                        "bg-green-600 rounded p-3 text-center text-white font-bold" :
                        "bg-gray-800 rounded p-3 text-center text-white";
                } else {
                    slot.textContent = "Waiting...";
                    slot.className = "border border-dashed border-gray-400 rounded p-3 text-center text-gray-400";
                }
            }
        }
    }

    showMessage(text) {
        const container = this.shadowRoot.getElementById('messages');
        if (!container) return;
        
        const message = document.createElement('div');
        message.className = "bg-black text-white py-2 px-4 rounded shadow-lg";
        message.textContent = text;
        container.appendChild(message);
        
        setTimeout(() => message.remove(), 3000);
    }

    resetUI() {
        const joinBtn = this.shadowRoot.getElementById('join-btn');
        if (joinBtn) {
            joinBtn.disabled = false;
            joinBtn.textContent = "Join Tournament";
            joinBtn.className = "p-4 mb-4 text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md w-full";
        }
        
        this.updatePlayersList([]);
        
        const playerCount = this.shadowRoot.getElementById('player-count');
        if (playerCount) {
            playerCount.textContent = "0";
        }
    }

    disconnectedCallback() {
        if (this.socket) {
            this.socket.close();
        }
    }
}

customElements.define("pong-tournament", TournamentComponent);