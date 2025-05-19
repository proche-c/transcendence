"use strict";

interface Player {
    x: number;
    y: number;
}

interface Ball {
    x: number;
    y: number;
    speedX: number;
    speedY: number;
}

interface GameState {
    players: {
        player1: Player;
        player2: Player;
    };
    ball: Ball;
    scores: {
        player1: number;
        player2: number;
    };
    running: boolean;
}

class PlayComponent extends HTMLElement {
    private gameMode: 'local' | 'online' | 'ai' | null = null;
    private lastAIUpdateTime: number = 0;
    private aiTargetY: number = 250;
    private aiKeysPressed: Record<string, boolean> = { 'arrowup': false, 'arrowdown': false };
    private movingToCenter: boolean = false;

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.renderMenu();
    }

    private renderMenu(): void {
        if (!this.shadowRoot) return;
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
				<button class="mode-button" id="aiBtn">Play vs AI</button>
            </div>
        `;
        this.setupMenuListeners();
	}
	
    private setupMenuListeners() {
        const localBtn = this.shadowRoot?.getElementById('localBtn');
        const onlineBtn = this.shadowRoot?.getElementById('onlineBtn');
        const aiBtn = this.shadowRoot?.getElementById('aiBtn');

        localBtn?.addEventListener('click', () => {
            this.gameMode = 'local';
            this.renderGame();
            this.setupLocalGame();
        });

        onlineBtn?.addEventListener('click', () => {
            this.gameMode = 'online';
            this.renderGame();
            this.setupOnlineGame();
        });

        aiBtn?.addEventListener('click', () => {
            this.gameMode = 'ai';
            this.renderGame();
            this.setupAIGame();
        });
    }

	private renderGame(): void {
        if (!this.shadowRoot) return;
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

    private setupLocalGame() {
        const canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;
        const gameState = this.createInitialGameState();
        const keysPressed: Record<string, boolean> = {};

        window.addEventListener('keydown', e => keysPressed[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', e => keysPressed[e.key.toLowerCase()] = false);

        const draw = () => {
            if (!gameState.running) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.handlePlayerMovement(gameState, keysPressed);
            this.updateBallPosition(gameState);
            this.checkPaddleCollisions(gameState);
            this.checkScore(gameState, () => this.resetBall(gameState));
            this.renderLocalGame(ctx, gameState);
            requestAnimationFrame(draw);
        };
        draw();
    }

    private createInitialGameState(): GameState {
        return {
            players: {
                player1: { x: 30, y: 200 },
                player2: { x: 740, y: 200 }
            },
            ball: { x: 400, y: 250, speedX: 5, speedY: 5 },
            scores: { player1: 0, player2: 0 },
            running: true
        };
    }

    private handlePlayerMovement(gameState: GameState, keys: Record<string, boolean>) {
        if (keys['w']) gameState.players.player1.y = Math.max(0, gameState.players.player1.y - 6);
        if (keys['s']) gameState.players.player1.y = Math.min(420, gameState.players.player1.y + 6);
        if (keys['arrowup']) gameState.players.player2.y = Math.max(0, gameState.players.player2.y - 6);
        if (keys['arrowdown']) gameState.players.player2.y = Math.min(420, gameState.players.player2.y + 6);
    }

    private updateBallPosition(gameState: GameState) {
        const ball = gameState.ball;
        ball.x += ball.speedX;
        ball.y += ball.speedY;
        if (ball.y <= 0 || ball.y >= 500) {
            ball.speedY *= -1;
        }
    }

    private checkPaddleCollisions(gameState: GameState) {
        Object.entries(gameState.players).forEach(([key, player]) => {
            const isPlayer1 = key === 'player1';
            const collisionX = isPlayer1
                ? gameState.ball.x <= player.x + 10 && gameState.ball.x >= player.x
                : gameState.ball.x >= player.x - 10 && gameState.ball.x <= player.x;
            if (collisionX && gameState.ball.y >= player.y && gameState.ball.y <= player.y + 80) {
                gameState.ball.speedX *= -1;
                const intersectY = (player.y + 40) - gameState.ball.y;
                gameState.ball.speedY = -(intersectY / 40) * 6;
            }
        });
    }

    private checkScore(gameState: GameState, resetFn: () => void) {
        if (gameState.ball.x <= 0) {
            gameState.scores.player2++;
            if (gameState.scores.player2 >= 4) {
                gameState.running = false;
                this.showWinnerMessage("Player 2 Wins!");
                this.reportResultToServer(gameState);
            } else {
                resetFn();
            }
        } else if (gameState.ball.x >= 800) {
            gameState.scores.player1++;
            if (gameState.scores.player1 >= 4) {
                gameState.running = false;
                this.showWinnerMessage("Player 1 Wins!");
                this.reportResultToServer(gameState);
            } else {
                resetFn();
            }
        }
    }

    private showWinnerMessage(message: string) {
        const canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    
        ctx.fillStyle = '#ffffff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    }

    private async reportResultToServer(gameState: GameState) {
        const { player1, player2 } = gameState.scores;
        const payload = {
          userId: 2, // Replace with actual user ID
          goalsFor: player1,
          goalsAgainst: player2
        };
      
        try {
          const res = await fetch('http://localhost:8000/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) {
            const text = await res.text();
            console.error('Error subiendo stats:', text);
          } else {
            console.log('Stats enviadas correctamente');
          }
        } catch (err) {
          console.error('Error de red al reportar stats:', err);
        }
    }
    
    private resetBall(gameState: GameState) {
        gameState.ball.x = 400;
        gameState.ball.y = 250;
        gameState.ball.speedX = gameState.ball.speedX > 0 ? -10 : 10;
        gameState.ball.speedY = 0;
    }

    private renderLocalGame(ctx: CanvasRenderingContext2D, gameState: GameState) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(gameState.players.player1.x, gameState.players.player1.y, 10, 80);
        ctx.fillRect(gameState.players.player2.x, gameState.players.player2.y, 10, 80);
        ctx.beginPath();
        ctx.arc(gameState.ball.x, gameState.ball.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '24px Arial';
        ctx.fillText(`${gameState.scores.player1}`, 150, 30);
        ctx.fillText(`${gameState.scores.player2}`, 650, 30);
    }

    private setupOnlineGame() {
        const canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;
        const socket = new WebSocket('ws://localhost:8000/game');
        let playerNumber: number | null = null;
        let gameState: GameState | null = null;
        let playerY = 150;

        socket.onopen = () => socket.send(JSON.stringify({ type: 'start', message: 'jugar' }));
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'init') {
                playerNumber = data.playerNumber;
                gameState = data.gameState;
                requestAnimationFrame(draw);
            } else if (data.type === 'update') {
                gameState = data.gameState;
            } else if (data.type === 'end') {
                alert(data.message);
            }
        };

        window.addEventListener('keydown', (e) => {
            if (!playerNumber) return;
            const key = e.key.toLowerCase();
            if ((playerNumber === 1 && (key === "arrowup" || key === "arrowdown")) ||
                (playerNumber === 2 && (key === "w" || key === "s"))) {
                playerY = Math.max(0, Math.min(320, playerY + (key === "arrowup" || key === "w" ? -20 : 20)));
                socket.send(JSON.stringify({ type: 'move', y: playerY }));
            }
        });

        const draw = () => {
            if (!gameState) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            Object.values(gameState.players).forEach(p => ctx.fillRect(p.x, p.y, 10, 80));
            const ball = gameState.ball;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '24px Arial';
            ctx.fillText(`${gameState.scores.player1}`, 150, 30);
            ctx.fillText(`${gameState.scores.player2}`, 450, 30);
            requestAnimationFrame(draw);
        };
    }

    private setupAIGame() {
        const canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;
        const gameState = this.createInitialGameState();
        const keysPressed: Record<string, boolean> = {};

        window.addEventListener('keydown', (e) => keysPressed[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => keysPressed[e.key.toLowerCase()] = false);

        const draw = () => {
            if (!gameState.running) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (keysPressed['w']) gameState.players.player1.y = Math.max(0, gameState.players.player1.y - 6);
            if (keysPressed['s']) gameState.players.player1.y = Math.min(420, gameState.players.player1.y + 6);

            this.updateAI(gameState, 0.7);
            this.updateBallPosition(gameState);
            this.checkPaddleCollisions(gameState);
            this.checkScore(gameState, () => this.resetBall(gameState));
            this.renderLocalGame(ctx, gameState);

            requestAnimationFrame(draw);
        };

        draw();
    }

    private predictBallPosition(gameState: GameState): number {
        const { ball, players } = gameState;
        if (ball.speedX <= 0) return 250;

        let x = ball.x;
        let y = ball.y;
        let dx = ball.speedX;
        let dy = ball.speedY;
        const targetX = players.player2.x - 10;

        while (x < targetX) {
            if ((y <= 0 && dy < 0) || (y >= 500 && dy > 0)) dy = -dy;

            if (x <= players.player1.x + 10 && dx < 0 &&
                y >= players.player1.y && y <= players.player1.y + 80) {
                dx = -dx;
                const relativeIntersect = (players.player1.y + 40) - y;
                dy = -(relativeIntersect / 40) * 6;
            }

            x += dx;
            y += dy;
        }

        return y;
    }

    private updateAI(gameState: GameState, difficulty: number) {
        const now = Date.now();
        const ball = gameState.ball;

        if (now - this.lastAIUpdateTime > 1000) {
            this.lastAIUpdateTime = now;

            if (ball.speedX > 0) {
                const perfectY = this.predictBallPosition(gameState);
                const error = (1 - difficulty) * 80;
                this.aiTargetY = perfectY + ((Math.random() * 2 - 1) * error);
                this.movingToCenter = false;
            } else {
                this.aiTargetY = ball.y * (difficulty * 0.8) + 250 * (1 - difficulty * 0.8);
                this.movingToCenter = true;
            }
        }

        const paddle = gameState.players.player2;
        const centerY = paddle.y + 40;
        const diff = this.aiTargetY - centerY;
        const deadZone = 15;

        this.aiKeysPressed = {
            'arrowup': diff < -deadZone,
            'arrowdown': diff > deadZone
        };

        const baseSpeed = 4 + difficulty * 3;
        const speed = this.movingToCenter ? baseSpeed * 0.6 : baseSpeed;

        if (this.aiKeysPressed['arrowup']) paddle.y = Math.max(0, paddle.y - speed);
        if (this.aiKeysPressed['arrowdown']) paddle.y = Math.min(420, paddle.y + speed);
    }
}

customElements.define("pong-play", PlayComponent);
