"use strict";
class PlayComponent extends HTMLElement {
    constructor() {
        super();
        this.gameMode = null;
        this.attachShadow({ mode: "open" });
        this.renderMenu(); // Muestra el menú inicial del juego al cargar el componente
    }
    // Renderiza el menú principal con las opciones de juego
    renderMenu() {
        if (!this.shadowRoot)
            return;
        this.shadowRoot.innerHTML = `
            <style>
                .menu-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    gap: 20px;
                    background: white;
                }

                .title {
                    font-size: 2.5rem;
                    color: #0a1f4d;
                    margin-bottom: 30px;
                    font-family: 'Arial', sans-serif;
                }

                .mode-button {
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    background: #1a3a8f;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s;
                    width: 200px;
                    text-align: center;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }

                .mode-button:hover {
                    background: #0a1f4d;
                    transform: translateY(-3px);
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
                }
            </style>
            <div class="menu-container">
                <div class="title">🏓 Pong Game</div>
                <button class="mode-button" id="localBtn">Local 1vs1</button>
                <button class="mode-button" id="onlineBtn">Online Multiplayer</button>
            </div>
        `;
        this.setupMenuListeners(); // Añade los listeners a los botones
    }
    // Configura los eventos de los botones del menú
    setupMenuListeners() {
        var _a, _b;
        const localBtn = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.getElementById('localBtn');
        const onlineBtn = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.getElementById('onlineBtn');
        localBtn === null || localBtn === void 0 ? void 0 : localBtn.addEventListener('click', () => {
            this.gameMode = 'local';
            this.renderGame();
            this.setupLocalGame(); // Inicia el juego local
        });
        onlineBtn === null || onlineBtn === void 0 ? void 0 : onlineBtn.addEventListener('click', () => {
            this.gameMode = 'online';
            this.renderGame();
            this.setupOnlineGame(); // Inicia el juego online
        });
    }
    // Renderiza el lienzo del juego
    renderGame() {
        if (!this.shadowRoot)
            return;
        this.shadowRoot.innerHTML = `
            <style>
                canvas {
                    border: 8px solid #0a1f4d;
                    border-radius: 8px;
                    background: #1a3a8f;
                    display: block;
                    margin: 0 auto;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                }
                :host {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background: white;
                    font-family: 'Arial', sans-serif;
                }
            </style>
            <canvas id="pong" width="800" height="500"></canvas>
        `;
    }
    // Configura e inicia la lógica del juego local
    setupLocalGame() {
        const canvas = this.shadowRoot.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const gameState = this.createInitialGameState(); // Estado inicial del juego
        const keysPressed = {};
        window.addEventListener('keydown', (e) => keysPressed[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => keysPressed[e.key.toLowerCase()] = false);
        const draw = () => {
            if (!gameState.running)
                return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.handlePlayerMovement(gameState, keysPressed);
            this.updateBallPosition(gameState);
            this.checkPaddleCollisions(gameState);
            this.checkScore(gameState, this.resetBall.bind(this, gameState));
            this.renderLocalGame(ctx, gameState);
            requestAnimationFrame(draw); // Loop del juego
        };
        draw(); // Comienza el juego
    }
    // Crea el estado inicial del juego
    createInitialGameState() {
        return {
            players: {
                player1: { x: 30, y: 200 },
                player2: { x: 740, y: 200 },
            },
            ball: { x: 400, y: 250, speedX: 5, speedY: 5 },
            scores: { player1: 0, player2: 0 },
            running: true
        };
    }
    // Mueve los jugadores en función de las teclas presionadas
    handlePlayerMovement(gameState, keys) {
        if (keys['w'])
            gameState.players.player1.y = Math.max(0, gameState.players.player1.y - 6);
        if (keys['s'])
            gameState.players.player1.y = Math.min(420, gameState.players.player1.y + 6);
        if (keys['arrowup'])
            gameState.players.player2.y = Math.max(0, gameState.players.player2.y - 6);
        if (keys['arrowdown'])
            gameState.players.player2.y = Math.min(420, gameState.players.player2.y + 6);
    }
    // Actualiza la posición de la pelota y su rebote vertical
    updateBallPosition(gameState) {
        gameState.ball.x += gameState.ball.speedX;
        gameState.ball.y += gameState.ball.speedY;
        if (gameState.ball.y <= 0 || gameState.ball.y >= 500) {
            gameState.ball.speedY *= -1;
        }
    }
    // Verifica colisiones entre la pelota y las palas
    checkPaddleCollisions(gameState) {
        Object.keys(gameState.players).forEach(playerKey => {
            const player = gameState.players[playerKey];
            const isPlayer1 = playerKey === 'player1';
            const collisionX = isPlayer1
                ? gameState.ball.x <= player.x + 10 && gameState.ball.x >= player.x
                : gameState.ball.x >= player.x - 10 && gameState.ball.x <= player.x;
            if (collisionX && gameState.ball.y >= player.y && gameState.ball.y <= player.y + 80) {
                gameState.ball.speedX *= -1;
                const relativeIntersectY = (player.y + 40) - gameState.ball.y;
                const normalized = relativeIntersectY / 40;
                gameState.ball.speedY = -normalized * 6;
            }
        });
    }
    // Comprueba si alguien ha anotado y reinicia la pelota si es así
    checkScore(gameState, resetFn) {
        if (gameState.ball.x <= 0) {
            gameState.scores.player2 += 1;
            resetFn();
        }
        else if (gameState.ball.x >= 800) {
            gameState.scores.player1 += 1;
            resetFn();
        }
    }
    // Reinicia la posición y velocidad de la pelota
    resetBall(gameState) {
        gameState.ball.x = 400;
        gameState.ball.y = 250;
        gameState.ball.speedX = gameState.ball.speedX > 0 ? -10 : 10;
        gameState.ball.speedY = 0;
    }
    // Dibuja el estado del juego en modo local
    renderLocalGame(ctx, gameState) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(gameState.players.player1.x, gameState.players.player1.y, 10, 80);
        ctx.fillRect(gameState.players.player2.x, gameState.players.player2.y, 10, 80);
        ctx.beginPath();
        ctx.arc(gameState.ball.x, gameState.ball.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '24px Arial';
        ctx.fillText(`${gameState.scores.player1}`, 150, 30);
        ctx.fillText(`${gameState.scores.player2}`, 650, 30);
    }
    // Configura el juego en modo online y comunicación con el servidor WebSocket
    setupOnlineGame() {
        const canvas = this.shadowRoot.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const socket = new WebSocket('ws://localhost:8000/game');
        let playerNumber = null;
        let gameState = null;
        let playerY = 150;
        socket.onopen = () => socket.send(JSON.stringify({ type: 'start', message: 'jugar' }));
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'init') {
                playerNumber = data.playerNumber;
                gameState = data.gameState;
                requestAnimationFrame(draw);
            }
            else if (data.type === 'update') {
                gameState = data.gameState;
            }
            else if (data.type === 'end') {
                alert(data.message);
            }
        };
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (playerNumber === 1 && (key === "arrowup" || key === "arrowdown")) {
                if (key === "arrowup")
                    playerY = Math.max(0, playerY - 20);
                if (key === "arrowdown")
                    playerY = Math.min(320, playerY + 20);
                socket.send(JSON.stringify({ type: 'move', y: playerY }));
            }
            if (playerNumber === 2 && (key === "w" || key === "s")) {
                if (key === "w")
                    playerY = Math.max(0, playerY - 20);
                if (key === "s")
                    playerY = Math.min(320, playerY + 20);
                socket.send(JSON.stringify({ type: 'move', y: playerY }));
            }
        });
        const draw = () => {
            if (!gameState)
                return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            Object.values(gameState.players).forEach((p) => ctx.fillRect(p.x, p.y, 10, 80));
            const ball = gameState.ball;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.font = '24px Arial';
            ctx.fillText(`${gameState.scores.player1}`, 150, 30);
            ctx.fillText(`${gameState.scores.player2}`, 450, 30);
            requestAnimationFrame(draw); // Sigue dibujando mientras el juego esté en marcha
        };
    }
}
customElements.define("pong-play", PlayComponent);
