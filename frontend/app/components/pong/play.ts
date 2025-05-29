import { GameMode } from './interfaces.js';
import { setupLocalGame } from './local_game.js';
import { setupAIGame } from './ai_game.js';
import { setupOnlineGame } from './online_game.js';
import { setupCrazyGame } from './crazy_game.js';


class PlayComponent extends HTMLElement {
    private gameMode: GameMode = null;
    private cleanupFunction: (() => void) | null = null;

    constructor() {
        super();
        console.log("PlayComponent constructor");
        this.attachShadow({ mode: "open" });
        this.renderMenu();
    }

    private renderMenu(): void {
        if (!this.shadowRoot) return;
        
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css";
        
        this.shadowRoot.innerHTML = `
            <div class="flex h-screen justify-between">
                <div class="">
                    <pong-menu></pong-menu>
                </div>
                <div class="grow flex items-center justify-center">
                    <div class="relative block max-w-screen-sm mx-auto">
                        <span class="absolute inset-0 border-2 border-dashed border-black"></span>
                        <div class="relative flex flex-col transform border-2 border-black bg-orange transition-transform group-hover:scale-105 p-8">                        
                            <button id="localBtn" class="p-4 mb-4 text-lg font-bold text-black bg-blue-800 hover:bg-blue-950 transition-colors rounded-lg shadow-md">
                                Local 1vs1
                            </button>
                            
                            <button id="onlineBtn" class="p-4 mb-4 text-lg font-bold text-black bg-blue-800 hover:bg-blue-950 transition-colors rounded-lg shadow-md">
                                Online Multiplayer
                            </button>
                            
                            <button id="aiBtn" class="p-4 mb-4 text-lg font-bold text-black bg-blue-800 hover:bg-blue-950 transition-colors rounded-lg shadow-md">
                                Play vs AI
                            </button>
                            
                            <button id="crazyBtn" class="p-4 mb-4 text-lg font-bold text-black bg-blue-800 hover:bg-blue-950 transition-colors rounded-lg shadow-md">
                                Crazy Game
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.shadowRoot.appendChild(style);
        this.setupMenuListeners();
    }

    private setupMenuListeners() {
        const localBtn = this.shadowRoot?.getElementById('localBtn');
        const onlineBtn = this.shadowRoot?.getElementById('onlineBtn');
        const aiBtn = this.shadowRoot?.getElementById('aiBtn');
        const crazyBtn = this.shadowRoot?.getElementById('crazyBtn');
        const pong3dBtn = this.shadowRoot?.getElementById('3dBtn');  // Nou botó

        localBtn?.addEventListener('click', () => {
            this.cleanupCurrentGame();
            this.gameMode = 'local';
            this.renderGame();
            this.cleanupFunction = setupLocalGame(this.shadowRoot);
        });

        onlineBtn?.addEventListener('click', () => {
            this.cleanupCurrentGame();
            this.gameMode = 'online';
            this.renderGame();
            this.cleanupFunction = setupOnlineGame(this.shadowRoot);
        });

        aiBtn?.addEventListener('click', () => {
            this.cleanupCurrentGame();
            this.gameMode = 'ai';
            this.renderGame();
            this.cleanupFunction = setupAIGame(this.shadowRoot);
        });

        crazyBtn?.addEventListener('click', () => {
            this.cleanupCurrentGame();
            this.gameMode = 'crazy';
            this.renderSquareGame();
            this.cleanupFunction = setupCrazyGame(this.shadowRoot);
        });
    }

private cleanupCurrentGame() {
    if (this.cleanupFunction) {
        this.cleanupFunction();
        this.cleanupFunction = null;
    }
    
    // Assegurem-nos que no queden canvas anteriors
    if (this.shadowRoot) {
        // Netejar completament el contingut del shadowRoot abans de fer innerHTML
        const oldCanvas = this.shadowRoot.querySelectorAll("canvas");
        oldCanvas.forEach(canvas => {
            canvas.width = 0;
            canvas.height = 0;
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        });
    }
}

    private renderGame(): void {
        if (!this.shadowRoot) return;
        
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css";
        
        this.shadowRoot.innerHTML = `
            <div class="flex h-screen">
                <div class="">
                    <pong-menu></pong-menu>
                </div>
                <div class="grow flex items-center justify-center">
                    <canvas id="pong" width="800" height="500" style="
                        border: 8px solid #0a1f4d;
                        border-radius: 8px;
                        background: #1a3a8f;
                        display: block;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    "></canvas>
                </div>
            </div>
        `;
        
        this.shadowRoot.appendChild(style);
    }

    private renderSquareGame(): void {
        if (!this.shadowRoot) return;
        
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css";
        
        this.shadowRoot.innerHTML = `
            <div class="flex h-screen">
                <div class="">
                    <pong-menu></pong-menu>
                </div>
                <div class="grow flex items-center justify-center">
                    <canvas id="pong" width="800" height="800" style="
                        border: 8px solid #0a1f4d;
                        border-radius: 8px;
                        background: #1a3a8f;
                        display: block;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    "></canvas>
                </div>
            </div>
        `;
        
        this.shadowRoot.appendChild(style);
    }
}

customElements.define("pong-play", PlayComponent);

                    <button id="backToMenuBtn" class="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                        Volver al Menú
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
        `;
    }

    private setupTournament() {
        const socket = new WebSocket(`wss://localhost:8443/api/game`);
        let isJoined = false;
        
        const joinBtn = this.shadowRoot?.getElementById('joinTournamentBtn') as HTMLButtonElement;
        const aliasInput = this.shadowRoot?.getElementById('aliasInput') as HTMLInputElement;
        const backBtn = this.shadowRoot?.getElementById('backToMenuBtn') as HTMLButtonElement;
        const declareWinnerBtn = this.shadowRoot?.getElementById('declareWinnerBtn') as HTMLButtonElement;

        socket.onopen = () => {
            console.log('Conectado al torneo');
            // Solicitar estado inicial
            socket.send(JSON.stringify({ type: 'tournament_get_state' }));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'tournament_join_result':
                    if (data.success) {
                        isJoined = true;
                        joinBtn.disabled = true;
                        joinBtn.textContent = 'Unido al Torneo';
                        aliasInput.disabled = true;
                    } else {
                        alert(data.message);
                    }
                    break;

                case 'tournament_state':
                case 'tournament_state_update':
                    this.updateTournamentDisplay(data.state);
                    break;

                case 'tournament_match_start':
                    this.showMatchInfo(data.match);
                    break;

                case 'tournament_match_result_response':
                    if (data.success) {
                        console.log('Resultado del partido registrado:', data.message);
                    } else {
                        alert(data.message);
                    }
                    break;
            }
        };

        joinBtn?.addEventListener('click', () => {
            const alias = aliasInput.value.trim();
            if (!alias) {
                alert('Por favor ingresa un alias');
                return;
            }
            
            socket.send(JSON.stringify({
                type: 'tournament_join',
                alias: alias
            }));
        });

        backBtn?.addEventListener('click', () => {
            socket.close();
            this.renderMenu();
            this.setupMenuListeners();
        });

        declareWinnerBtn?.addEventListener('click', () => {
            // Aquí deberías implementar la lógica para determinar el ganador
            // Por ahora, asumimos que el jugador actual gana
            socket.send(JSON.stringify({
                type: 'tournament_match_result',
                winnerId: 'current_player_id' // Esto debería ser dinámico
            }));
        });

        return () => {
            socket.close();
        };
    }

    private updateTournamentDisplay(state: any) {
        const statusText = this.shadowRoot?.getElementById('statusText');
        const playersList = this.shadowRoot?.getElementById('playersList');
        const bracketDisplay = this.shadowRoot?.getElementById('bracketDisplay');

        if (statusText) {
            statusText.textContent = `Estado: ${state.tournamentStatus} - Jugadores: ${state.playersCount}/4`;
        }

        if (playersList) {
            const playersHtml = state.players.map((player: any) => 
                `<div class="flex justify-between items-center py-1">
                    <span>${player.alias}</span>
                    <span class="text-xs ${player.status === 'connected' ? 'text-green-400' : 'text-red-400'}">${player.status}</span>
                </div>`
            ).join('');
            playersList.innerHTML = playersHtml;
        }

        if (bracketDisplay) {
            if (state.tournamentStatus === 'waiting') {
                bracketDisplay.innerHTML = 'Esperando jugadores...';
            } else {
                let bracketHtml = '<div class="space-y-2">';
                
                if (state.semifinals && state.semifinals.length > 0) {
                    bracketHtml += '<h4 class="font-semibold">Semifinales:</h4>';
                    state.semifinals.forEach((match: any) => {
                        if (match) {
                            bracketHtml += `<div class="text-sm">${match.player1Alias} vs ${match.player2Alias} - ${match.status}</div>`;
                        }
                    });
                }
                
                if (state.final) {
                    bracketHtml += '<h4 class="font-semibold mt-2">Final:</h4>';
                    bracketHtml += `<div class="text-sm">${state.final.player1Alias} vs ${state.final.player2Alias} - ${state.final.status}</div>`;
                }
                
                if (state.winner) {
                    bracketHtml += `<h4 class="font-semibold mt-2 text-yellow-400">¡Ganador: ${state.winner.alias}!</h4>`;
                }
                
                bracketHtml += '</div>';
                bracketDisplay.innerHTML = bracketHtml;
            }
        }
    }

    private showMatchInfo(match: any) {
        const matchInfo = this.shadowRoot?.getElementById('matchInfo');
        const currentMatchText = this.shadowRoot?.getElementById('currentMatchText');
        const matchControls = this.shadowRoot?.getElementById('matchControls');

        if (matchInfo) {
            matchInfo.style.display = 'block';
        }

        if (currentMatchText) {
            currentMatchText.textContent = `${match.round}: ${match.player1.alias} vs ${match.player2.alias}`;
        }

        if (matchControls) {
            matchControls.style.display = 'block';
        }
    }
}

customElements.define("pong-play", PlayComponent);