import { SERVER_IP } from '../../config.js';

class TournamentComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.socket = null;
        this.joined = false;
        this.render();
    }

    render() {
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css";

        this.shadowRoot.innerHTML = `
            <div class="flex h-screen bg-gray-900 text-white">
                <div>
                    <pong-menu></pong-menu>
                </div>
                
                <div class="flex-1 flex items-center justify-center">
                    <div class="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
                        <h2 class="text-3xl font-bold text-center mb-6">Torneo de Pong</h2>
                        
                        <!-- Área de registro -->
                        <div id="join-area" class="mb-6">
                            <input type="text" id="name-input" 
                                class="w-full p-3 mb-3 bg-gray-700 border border-gray-600 rounded text-white" 
                                placeholder="Tu nombre para el torneo">
                            
                            <button id="join-btn" 
                                class="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded">
                                Unirme al Torneo
                            </button>
                        </div>
                        
                        <!-- Sala de espera -->
                        <div class="mb-6">
                            <div class="bg-blue-900 p-3 rounded-t text-center">
                                Jugadores: <span id="counter">0</span>/4
                            </div>
                            
                            <!-- Lista de jugadores -->
                            <div class="bg-gray-700 p-4 rounded-b">
                                <div class="grid grid-cols-2 gap-3">
                                    <div id="slot1" class="border border-dashed border-gray-500 rounded p-3 text-center text-gray-400">
                                        Esperando...
                                    </div>
                                    <div id="slot2" class="border border-dashed border-gray-500 rounded p-3 text-center text-gray-400">
                                        Esperando...
                                    </div>
                                    <div id="slot3" class="border border-dashed border-gray-500 rounded p-3 text-center text-gray-400">
                                        Esperando...
                                    </div>
                                    <div id="slot4" class="border border-dashed border-gray-500 rounded p-3 text-center text-gray-400">
                                        Esperando...
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex justify-between">
                            <button id="back-btn" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                                Volver
                            </button>
                            <button id="reset-btn" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                                Reiniciar
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Notificaciones -->
                <div id="notifications" class="fixed top-4 right-4 space-y-2"></div>
            </div>
        `;

        this.shadowRoot.appendChild(style);
        this.setupEvents();
        this.connectWebSocket();
    }

    setupEvents() {
        const joinBtn = this.shadowRoot.getElementById('join-btn');
        const nameInput = this.shadowRoot.getElementById('name-input');
        const backBtn = this.shadowRoot.getElementById('back-btn');
        const resetBtn = this.shadowRoot.getElementById('reset-btn');
        
        joinBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (name.length >= 2) {
                this.joinTournament(name);
            } else {
                this.showNotification("El nombre debe tener al menos 2 caracteres", "error");
            }
        });
        
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') joinBtn.click();
        });
        
        backBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('back-to-play', { bubbles: true }));
        });
        
        resetBtn.addEventListener('click', () => {
            if (confirm('¿Reiniciar el torneo?')) {
                this.socket?.send(JSON.stringify({ type: 'tournament_reset' }));
            }
        });
    }

    connectWebSocket() {
        this.socket = new WebSocket(`wss://${SERVER_IP}:8443/api/game`);
        
        this.socket.onopen = () => {
            console.log('Conexión establecida');
            this.socket.send(JSON.stringify({ type: 'tournament_get_state' }));
        };
        
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Mensaje recibido:', data);
            
            switch (data.type) {
                case 'tournament_join_result':
                    this.handleJoinResult(data);
                    break;
                    
                case 'tournament_state':
                case 'tournament_update':
                    this.updateState(data.state);
                    break;
                    
                case 'tournament_started':
                    this.showNotification("¡El torneo ha comenzado!", "success");
                    break;
                    
                case 'tournament_player_left':
                    this.showNotification(data.message, "warning");
                    break;
                    
                case 'tournament_reset':
                    this.showNotification("Torneo reiniciado", "info");
                    this.resetUI();
                    break;
            }
        };
        
        this.socket.onerror = () => {
            this.showNotification("Error de conexión", "error");
        };
    }

    joinTournament(name) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'tournament_join',
                playerName: name
            }));
        }
    }

    handleJoinResult(data) {
        if (data.success) {
            this.joined = true;
            this.showNotification(data.message, "success");
            
            const joinArea = this.shadowRoot.getElementById('join-area');
            const joinBtn = this.shadowRoot.getElementById('join-btn');
            const nameInput = this.shadowRoot.getElementById('name-input');
            
            joinBtn.disabled = true;
            joinBtn.className = "w-full bg-green-700 text-white font-bold py-3 px-4 rounded";
            joinBtn.textContent = "✓ Unido";
            nameInput.disabled = true;
        } else {
            this.showNotification(data.message, "error");
        }
    }

    updateState(state) {
        const counter = this.shadowRoot.getElementById('counter');
        counter.textContent = state.players.length;
        
        // Actualizar slots
        for (let i = 0; i < 4; i++) {
            const slot = this.shadowRoot.getElementById(`slot${i+1}`);
            
            if (state.players[i]) {
                slot.textContent = state.players[i].name;
                slot.className = "bg-green-800 rounded p-3 text-center text-white";
            } else {
                slot.textContent = "Esperando...";
                slot.className = "border border-dashed border-gray-500 rounded p-3 text-center text-gray-400";
            }
        }
        
        if (state.state === "in_progress") {
            this.showNotification("¡El torneo está en curso!", "info");
        }
    }

    showNotification(message, type = "info") {
        const notifications = this.shadowRoot.getElementById('notifications');
        const notification = document.createElement('div');
        
        const bgColors = {
            success: "bg-green-600",
            error: "bg-red-600",
            warning: "bg-yellow-600",
            info: "bg-blue-600"
        };
        
        notification.className = `${bgColors[type]} text-white p-3 rounded shadow-lg`;
        notification.textContent = message;
        notifications.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }

    resetUI() {
        const joinBtn = this.shadowRoot.getElementById('join-btn');
        const nameInput = this.shadowRoot.getElementById('name-input');
        const counter = this.shadowRoot.getElementById('counter');
        
        joinBtn.disabled = false;
        joinBtn.className = "w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded";
        joinBtn.textContent = "Unirme al Torneo";
        nameInput.disabled = false;
        nameInput.value = '';
        counter.textContent = "0";
        
        // Resetear slots
        for (let i = 1; i <= 4; i++) {
            const slot = this.shadowRoot.getElementById(`slot${i}`);
            slot.textContent = "Esperando...";
            slot.className = "border border-dashed border-gray-500 rounded p-3 text-center text-gray-400";
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