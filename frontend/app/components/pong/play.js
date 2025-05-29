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
                <div class="flex flex-col items-center justify-center h-full space-y-8">
                <h1 class="text-4xl font-bold text-white mb-8">Selecciona tu modo de juego</h1>
                <div class="grid grid-cols-2 gap-6">
                    <button id="localBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition duration-200">
                        Juego Local
                    </button>
                    <button id="onlineBtn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition duration-200">
                        Juego Online
                    </button>
                    <button id="aiBtn" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition duration-200">
                        vs IA
                    </button>
                    <button id="tournamentBtn" class="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition duration-200">
                        Torneo (4 jugadores)
                    </button>
                    <button id="crazyBtn" class="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition duration-200">
                        Modo Loco
                    </button>
                    <button id="3dBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition duration-200">
                        Pong 3D
                    </button>
                </div>
            </div>
        `;
        this.shadowRoot.appendChild(style);
        this.setupMenuListeners();
    }
    setupMenuListeners() {
        var _a, _b, _c, _d, _e;
        const localBtn = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.getElementById('localBtn');
        const onlineBtn = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.getElementById('onlineBtn');
        const aiBtn = (_c = this.shadowRoot) === null || _c === void 0 ? void 0 : _c.getElementById('aiBtn');
        const crazyBtn = (_d = this.shadowRoot) === null || _d === void 0 ? void 0 : _d.getElementById('crazyBtn');
        const pong3dBtn = (_e = this.shadowRoot) === null || _e === void 0 ? void 0 : _e.getElementById('3dBtn'); // Nou botó
        const tournamentBtn = this.shadowRoot?.getElementById('tournamentBtn');
        localBtn === null || localBtn === void 0 ? void 0 : localBtn.addEventListener('click', () => {
            this.cleanupCurrentGame();
            this.gameMode = 'local';
            this.renderGame();
            this.cleanupFunction = setupLocalGame(this.shadowRoot);
        });
        onlineBtn === null || onlineBtn === void 0 ? void 0 : onlineBtn.addEventListener('click', () => {
            this.cleanupCurrentGame();
            this.gameMode = 'online';
            this.renderGame();
            this.cleanupFunction = setupOnlineGame(this.shadowRoot);
        });
        aiBtn === null || aiBtn === void 0 ? void 0 : aiBtn.addEventListener('click', () => {
            this.cleanupCurrentGame();
            this.gameMode = 'ai';
            this.renderGame();
            this.cleanupFunction = setupAIGame(this.shadowRoot);
        });
        crazyBtn === null || crazyBtn === void 0 ? void 0 : crazyBtn.addEventListener('click', () => {
            this.cleanupCurrentGame();
            this.gameMode = 'crazy';
            this.renderSquareGame();
            this.cleanupFunction = setupCrazyGame(this.shadowRoot);
        });
        tournamentBtn?.addEventListener('click', () => {
            this.cleanupCurrentGame();
            this.gameMode = 'tournament';
            this.showTournament();
        });
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
