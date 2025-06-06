import { SERVER_IP } from '../../config.js';
import { fetchUserProfile } from '../../utils/requests.js';

class TournamentComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.socket = null;
        this.joined = false;
        this.username = null;
        this.render();
        this.loadUsername();
    }

    async loadUsername() {
        try {
            const user = await fetchUserProfile();
            if (user && user.username) {
                this.username = user.username;
                console.log('[Torneo] Nombre de usuario cargado:', this.username);
            }
        } catch (error) {
            console.error('[Torneo] Error al cargar el perfil:', error);
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
                            <h2 class="text-2xl font-bold text-center mb-6">Torneo de Pong</h2>
                            
                            <div id="join-form" class="mb-6">
                                <button id="join-btn" 
                                    class="p-4 mb-4 text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md w-full">
                                    Join Tournament
                                </button>
                            </div>
                            
                            <div class="mb-6 border border-gray-300 rounded overflow-hidden">
                                <div class="bg-gray-800 p-3 text-white text-center font-bold">
                                    Jugadores: <span id="player-count">0</span>/4
                                </div>
                                
                                <div class="bg-white p-4">
                                    <div class="grid grid-cols-2 gap-3">
                                        <div id="player1" class="border border-dashed border-gray-400 rounded p-3 text-center text-gray-400">
                                            Esperando...
                                        </div>
                                        <div id="player2" class="border border-dashed border-gray-400 rounded p-3 text-center text-gray-400">
                                            Esperando...
                                        </div>
                                        <div id="player3" class="border border-dashed border-gray-400 rounded p-3 text-center text-gray-400">
                                            Esperando...
                                        </div>
                                        <div id="player4" class="border border-dashed border-gray-400 rounded p-3 text-center text-gray-400">
                                            Esperando...
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex justify-between">
                                <button id="back-btn" class="p-3 text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md px-6">
                                    Volver
                                </button>
                                <button id="reset-btn" class="p-3 text-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-colors rounded-lg shadow-md px-6">
                                    Reiniciar
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
        const resetBtn = this.shadowRoot.getElementById('reset-btn');
        
        joinBtn.addEventListener('click', () => {
            if (!this.username) {
                this.showMessage("Cargando nombre de usuario...");
                this.loadUsername().then(() => {
                    if (this.username) {
                        this.joinTournament();
                    } else {
                        this.showMessage("No se pudo obtener tu nombre de usuario");
                    }
                });
            } else {
                this.joinTournament();
            }
        });
        
        backBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('back-to-play', { bubbles: true }));
        });
        
        resetBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro que deseas reiniciar el torneo?')) {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({ type: 'tournament_reset' }));
                }
            }
        });
    }

    connectWebSocket() {
        try {
            this.socket = new WebSocket(`wss://${SERVER_IP}:8443/api/tournament`);
            
            this.socket.onopen = () => {
                console.log('[Torneo] Conexión WebSocket establecida');
                this.socket.send(JSON.stringify({ type: 'tournament_get_state' }));
            };
            
            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('[Torneo] Mensaje recibido:', data);
                
                switch (data.type) {
                    case 'tournament_join_result':
                        this.handleJoinResult(data);
                        break;
                    
                    case 'tournament_state':
                    case 'tournament_update':
                        console.log('[Torneo] Actualizando estado desde WebSocket:', data.state);
                        this.updateTournamentState(data.state);
                        break;
                    
                    case 'tournament_started':
                        this.showMessage("¡El torneo ha comenzado!");
                        break;
                    
                    case 'tournament_reset':
                        this.showMessage("El torneo ha sido reiniciado");
                        this.resetUI();
                        break;
                    
                    case 'error':
                        this.showMessage(data.message);
                        break;
                }
            };
            
            this.socket.onerror = (error) => {
                console.error('[Torneo] Error en WebSocket:', error);
                this.showMessage("Error de conexión");
            };
            
            this.socket.onclose = () => {
                console.log('[Torneo] Conexión WebSocket cerrada');
                this.showMessage("Conexión cerrada");
            };
        } catch (error) {
            console.error('[Torneo] Error al crear WebSocket:', error);
            this.showMessage("No se pudo conectar al servidor");
        }
    }

    joinTournament() {
        const joinBtn = this.shadowRoot.getElementById('join-btn');
        
        joinBtn.disabled = true;
        joinBtn.textContent = "Processing...";
        
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'tournament_join',
                playerName: this.username
            }));
        } else {
            this.showMessage("No hay conexión con el servidor");
            joinBtn.disabled = false;
            joinBtn.textContent = "Join Tournament";
        }
    }

    handleJoinResult(data) {
        console.log("[Torneo] Resultado al unirse:", data);
        
        const joinBtn = this.shadowRoot.getElementById('join-btn');
        
        if (data.success) {
            this.showMessage(data.message);
            this.joined = true;
            
            joinBtn.disabled = true;
            joinBtn.className = "p-4 mb-4 text-lg font-bold text-white bg-green-600 rounded-lg shadow-md w-full";
            joinBtn.textContent = "✓ Joined";
            
            if (data.players) {
                this.updatePlayersList(data.players);
                // Actualizar también el contador
                const playerCount = this.shadowRoot.getElementById('player-count');
                if (playerCount) {
                    playerCount.textContent = data.players.length;
                }
            }
        } else {
            this.showMessage(data.message);
            joinBtn.disabled = false;
            joinBtn.textContent = "Join Tournament";
        }
    }

    updateTournamentState(state) {
        if (!state) return;
        
        console.log("[Torneo] Estado actualizado:", state);
        
        if (state.players) {
            const playerCount = this.shadowRoot.getElementById('player-count');
            if (playerCount) {
                playerCount.textContent = state.players.length;
            }
            
            this.updatePlayersList(state.players);
        }
    }

    updatePlayersList(players) {
        console.log("[Torneo] Actualizando lista de jugadores:", players);
        
        // Resetear todos los slots primero
        for (let i = 1; i <= 4; i++) {
            const playerSlot = this.shadowRoot.getElementById(`player${i}`);
            if (playerSlot) {
                playerSlot.textContent = "Esperando...";
                playerSlot.className = "border border-dashed border-gray-400 rounded p-3 text-center text-gray-400";
            }
        }
        
        // Llenar los slots con los jugadores actuales
        if (players && Array.isArray(players)) {
            players.forEach((player, index) => {
                if (index < 4) {
                    const playerSlot = this.shadowRoot.getElementById(`player${index+1}`);
                    if (playerSlot) {
                        playerSlot.textContent = player.name;
                        
                        if (player.name === this.username) {
                            playerSlot.className = "bg-green-600 rounded p-3 text-center text-white font-bold";
                        } else if (player.connected) {
                            playerSlot.className = "bg-gray-800 rounded p-3 text-center text-white";
                        } else {
                            playerSlot.className = "bg-red-600 rounded p-3 text-center text-white";
                        }
                    }
                }
            });
        }
    }

    showMessage(text) {
        const messagesContainer = this.shadowRoot.getElementById('messages');
        if (!messagesContainer) return;
        
        const message = document.createElement('div');
        message.className = "bg-black text-white py-2 px-4 rounded shadow-lg";
        message.textContent = text;
        
        messagesContainer.appendChild(message);
        
        setTimeout(() => message.remove(), 3000);
    }

    resetUI() {
        const joinBtn = this.shadowRoot.getElementById('join-btn');
        if (joinBtn) {
            joinBtn.disabled = false;
            joinBtn.className = "p-4 mb-4 text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md w-full";
            joinBtn.textContent = "Join Tournament";
        }
        
        const playerCount = this.shadowRoot.getElementById('player-count');
        if (playerCount) {
            playerCount.textContent = "0";
        }
        
        for (let i = 1; i <= 4; i++) {
            const playerSlot = this.shadowRoot.getElementById(`player${i}`);
            if (playerSlot) {
                playerSlot.textContent = "Esperando...";
                playerSlot.className = "border border-dashed border-gray-400 rounded p-3 text-center text-gray-400";
            }
        }
        
        this.joined = false;
    }

    disconnectedCallback() {
        if (this.socket) {
            this.socket.close();
        }
    }
}

customElements.define("pong-tournament", TournamentComponent);