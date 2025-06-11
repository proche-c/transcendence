import { setupLocalGame } from './local_game.js';
import { setupAIGame } from './ai_game.js';
import { setupOnlineGame } from './online_game.js';
import { setupCrazyGame } from './crazy_game.js';
import { setupTournament } from './tournament.js';
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
                                Tournament
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
        var _a, _b, _c, _d, _e;
        const localBtn = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.getElementById('localBtn');
        const onlineBtn = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.getElementById('onlineBtn');
        const aiBtn = (_c = this.shadowRoot) === null || _c === void 0 ? void 0 : _c.getElementById('aiBtn');
        const crazyBtn = (_d = this.shadowRoot) === null || _d === void 0 ? void 0 : _d.getElementById('crazyBtn');
        const tournamentBtn = (_e = this.shadowRoot) === null || _e === void 0 ? void 0 : _e.getElementById('tournamentBtn');
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
        tournamentBtn === null || tournamentBtn === void 0 ? void 0 : tournamentBtn.addEventListener('click', () => {
            this.cleanupCurrentGame();
            this.gameMode = null;
            this.cleanupFunction = setupTournament(this.shadowRoot);
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
            <div class="grow flex flex-col items-center justify-center p-4">
                <div class="w-full max-w-4xl">
                    <div class="relative w-full" style="padding-bottom: 62.5%;">
                        <canvas id="pong" width="800" height="500" 
                                class="absolute inset-0 w-full h-full border-4 border-gray-900 rounded-lg bg-gray-800 block shadow-lg object-contain">
                        </canvas>
                    </div>
                </div>
                <button id="backToMenuBtn" class="mt-4 p-4 text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md">
                    Volver
                </button>
            </div>
        </div>
    `;
        this.shadowRoot.appendChild(style);
        this.setupBackButtonListener();
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
            <div class="grow flex flex-col items-center justify-center p-4">
                <div class="w-full max-w-4xl">
                    <div class="relative w-full" style="padding-bottom: 100%;">
                        <canvas id="pong" width="800" height="800" 
                                class="absolute inset-0 w-full h-full border-4 border-gray-900 rounded-lg bg-gray-800 block shadow-lg object-contain">
                        </canvas>
                    </div>
                </div>
                <button id="backToMenuBtn" class="mt-4 p-4 text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md">
                    Volver
                </button>
            </div>
        </div>
    `;
        this.shadowRoot.appendChild(style);
        this.setupBackButtonListener();
    }
    setupBackButtonListener() {
        var _a;
        const backBtn = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.getElementById('backToMenuBtn');
        backBtn === null || backBtn === void 0 ? void 0 : backBtn.addEventListener('click', () => {
            this.cleanupCurrentGame();
            this.gameMode = null;
            this.renderMenu();
        });
    }
}
customElements.define("pong-play", PlayComponent);
