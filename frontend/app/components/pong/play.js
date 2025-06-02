import { setupLocalGame } from './local_game.js';
import { setupAIGame } from './ai_game.js';
import { setupOnlineGame } from './online_game.js';
import { setupCrazyGame } from './crazy_game.js';
class PlayComponent extends HTMLElement {
    constructor() {
        super();
        this.gameMode = null;
        this.cleanupFunction = null;
        console.log("PlayComponent constructor");
        this.attachShadow({ mode: "open" });
        this.renderMenu();
    }
    renderMenu() {
        if (!this.shadowRoot)
            return;
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
                    <div class="relative flex flex-col transform border-2 border-black bg-white transition-transform group-hover:scale-105 p-8">                        
                        <button id="localBtn" class="p-4 mb-4 text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md">
                            Local 1vs1
                        </button>
                        
                        <button id="onlineBtn" class="p-4 mb-4 text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md">
                            Online Multiplayer
                        </button>
                        
                        <button id="aiBtn" class="p-4 mb-4 text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md">
                            Play vs AI
                        </button>
                        
                        <button id="crazyBtn" class="p-4 mb-4 text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md">
                            Crazy Game
                        </button>

                        <button id="tournamentBtn" class="p-4 mb-4 text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md">
                            Torneo (4 jugadores)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
        this.shadowRoot.appendChild(style);
        this.setupMenuListeners();
    }
    setupMenuListeners() {
        const localBtn = this.shadowRoot?.getElementById('localBtn');
        const onlineBtn = this.shadowRoot?.getElementById('onlineBtn');
        const aiBtn = this.shadowRoot?.getElementById('aiBtn');
        const crazyBtn = this.shadowRoot?.getElementById('crazyBtn');
        const tournamentBtn = this.shadowRoot?.getElementById('tournamentBtn'); // Añadido
        const pong3dBtn = this.shadowRoot?.getElementById('3dBtn'); // Nou botó

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

        // Añadir listener para el botón de torneo
        tournamentBtn?.addEventListener('click', () => {
            this.cleanupCurrentGame();
            this.gameMode = 'tournament';
            this.showTournament();
        });

        crazyBtn?.addEventListener('click', () => {
            this.cleanupCurrentGame();
            this.gameMode = 'crazy';
            this.renderSquareGame();
            this.cleanupFunction = setupCrazyGame(this.shadowRoot);
        });

        pong3dBtn?.addEventListener('click', () => {
            this.cleanupCurrentGame();
            this.gameMode = '3d';
            this.renderSquareGame();
            // this.cleanupFunction = setup3DGame(this.shadowRoot);
        });
    }
    cleanupCurrentGame() {
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
    renderGame() {
        if (!this.shadowRoot)
            return;
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css";
        this.shadowRoot.innerHTML = `
        <div class="flex h-screen">
            <div class="">
                <pong-menu></pong-menu>
            </div>
            <div class="grow flex items-center justify-center p-4">
                <div class="w-full max-w-4xl">
                    <div class="relative w-full" style="padding-bottom: 62.5%;">
                        <canvas id="pong" width="800" height="500" 
                                class="absolute inset-0 w-full h-full border-4 border-gray-900 rounded-lg bg-gray-800 block shadow-lg object-contain">
                        </canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
        this.shadowRoot.appendChild(style);
    }
    renderSquareGame() {
        if (!this.shadowRoot)
            return;
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "./app/tailwind.css";
        this.shadowRoot.innerHTML = `
        <div class="flex h-screen">
            <div class="">
                <pong-menu></pong-menu>
            </div>
            <div class="grow flex items-center justify-center p-4">
                <div class="w-full max-w-4xl">
                    <div class="relative w-full" style="padding-bottom: 100%;">
                        <canvas id="pong" width="800" height="800" 
                                class="absolute inset-0 w-full h-full border-4 border-gray-900 rounded-lg bg-gray-800 block shadow-lg object-contain">
                        </canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
        this.shadowRoot.appendChild(style);
    }
    showTournament() {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = '';
        const tournament = document.createElement('pong-tournament');
        
        tournament.addEventListener('back-to-play', () => {
            this.renderMenu();
            this.setupMenuListeners();
        });

        this.shadowRoot.appendChild(tournament);
    }
}
customElements.define("pong-play", PlayComponent);
