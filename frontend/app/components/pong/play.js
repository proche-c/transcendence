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
        // Creem l'enllaç a Tailwind CSS igual que al perfil
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
    setupMenuListeners() {
        var _a, _b, _c, _d;
        const localBtn = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.getElementById('localBtn');
        const onlineBtn = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.getElementById('onlineBtn');
        const aiBtn = (_c = this.shadowRoot) === null || _c === void 0 ? void 0 : _c.getElementById('aiBtn');
        const crazyBtn = (_d = this.shadowRoot) === null || _d === void 0 ? void 0 : _d.getElementById('crazyBtn');
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
    }
    cleanupCurrentGame() {
        if (this.cleanupFunction) {
            this.cleanupFunction();
            this.cleanupFunction = null;
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
