"use strict";
class PlayComponent extends HTMLElement {
    constructor() {
        super();
        this.gameMode = null;
        this.attachShadow({ mode: "open" });
        this.renderMenu();
    }
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
        this.setupMenuListeners();
    }
    setupMenuListeners() {
        var _a, _b;
        const localBtn = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.getElementById('localBtn');
        const onlineBtn = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.getElementById('onlineBtn');
        localBtn === null || localBtn === void 0 ? void 0 : localBtn.addEventListener('click', () => {
            this.gameMode = 'local';
            this.renderGame();
            this.setupLocalGame();
        });
        onlineBtn === null || onlineBtn === void 0 ? void 0 : onlineBtn.addEventListener('click', () => {
            this.gameMode = 'online';
            this.renderGame();
            this.setupOnlineGame();
        });
    }
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
            <canvas id="pong" width="800" height="500"></canvas> <!-- Aumentamos el tamaño aquí -->
        `;
    }
    setupLocalGame() {
        const canvas = this.shadowRoot.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const gameState = {
            players: {
                player1: { x: 30, y: 200 },
                player2: { x: 740, y: 200 }
            },
            ball: { x: 400, y: 250, speedX: 5, speedY: 5 },
            scores: { player1: 0, player2: 0 },
            running: true
        };
        const keysPressed = {};
        window.addEventListener('keydown', (e) => {
            keysPressed[e.key.toLowerCase()] = true;
        });
        window.addEventListener('keyup', (e) => {
            keysPressed[e.key.toLowerCase()] = false;
        });
        const draw = () => {
            if (!gameState.running)
                return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Movimiento palas
            if (keysPressed['w']) {
                gameState.players.player1.y = Math.max(0, gameState.players.player1.y - 6);
            }
            if (keysPressed['s']) {
                gameState.players.player1.y = Math.min(420, gameState.players.player1.y + 6);
            }
            if (keysPressed['arrowup']) {
                gameState.players.player2.y = Math.max(0, gameState.players.player2.y - 6);
            }
            if (keysPressed['arrowdown']) {
                gameState.players.player2.y = Math.min(420, gameState.players.player2.y + 6);
            }
            // Movimiento pelota
            gameState.ball.x += gameState.ball.speedX;
            gameState.ball.y += gameState.ball.speedY;
            // Rebote en bordes
            if (gameState.ball.y <= 0 || gameState.ball.y >= 500) {
                gameState.ball.speedY *= -1;
            }
            // Colisión con palas y ángulo según zona de impacto
            Object.keys(gameState.players).forEach(playerKey => {
                const player = gameState.players[playerKey];
                const isPlayer1 = playerKey === 'player1';
                const collisionX = isPlayer1
                    ? gameState.ball.x <= player.x + 10 && gameState.ball.x >= player.x
                    : gameState.ball.x >= player.x - 10 && gameState.ball.x <= player.x;
                if (collisionX) {
                    if (gameState.ball.y >= player.y && gameState.ball.y <= player.y + 80) {
                        gameState.ball.speedX *= -1;
                        const relativeIntersectY = (player.y + 40) - gameState.ball.y;
                        const normalized = relativeIntersectY / 40;
                        gameState.ball.speedY = -normalized * 6; // Ajusta este factor si quieres más inclinación
                    }
                }
            });
            // Gol
            if (gameState.ball.x <= 0) {
                gameState.scores.player2 += 1;
                resetBall();
            }
            else if (gameState.ball.x >= 800) {
                gameState.scores.player1 += 1;
                resetBall();
            }
            // Dibujado
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(gameState.players.player1.x, gameState.players.player1.y, 10, 80);
            ctx.fillRect(gameState.players.player2.x, gameState.players.player2.y, 10, 80);
            ctx.beginPath();
            ctx.arc(gameState.ball.x, gameState.ball.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '24px Arial';
            ctx.fillText(`${gameState.scores.player1}`, 150, 30);
            ctx.fillText(`${gameState.scores.player2}`, 650, 30);
            requestAnimationFrame(draw);
        };
        const resetBall = () => {
            gameState.ball.x = 400;
            gameState.ball.y = 250;
            gameState.ball.speedX = gameState.ball.speedX > 0 ? -10 : 10;
            gameState.ball.speedY = 0; // inicial paralelo al eje horizontal
        };
        draw();
    }
    setupOnlineGame() {
        // Tu implementación original del juego online
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
                console.log(`Player ${playerNumber} initialized`);
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
            else if (playerNumber === 2 && (key === "w" || key === "s")) {
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
            // Draw players
            ctx.fillStyle = '#ffffff';
            Object.values(gameState.players).forEach((p) => ctx.fillRect(p.x, p.y, 10, 80));
            // Draw ball
            const ball = gameState.ball;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            // Draw scores
            ctx.fillStyle = '#ffffff';
            ctx.font = '24px Arial';
            ctx.fillText(`${gameState.scores.player1}`, 150, 30);
            ctx.fillText(`${gameState.scores.player2}`, 450, 30);
            requestAnimationFrame(draw);
        };
    }
}
customElements.define("pong-play", PlayComponent);
