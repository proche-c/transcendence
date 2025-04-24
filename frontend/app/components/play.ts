class PlayComponent extends HTMLElement {
    private gameMode: 'local' | 'online' | null = null;
    
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
            </div>
        `;
        
        this.setupMenuListeners();
    }

    private setupMenuListeners(): void {
        const localBtn = this.shadowRoot?.getElementById('localBtn');
        const onlineBtn = this.shadowRoot?.getElementById('onlineBtn');
        
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
            <canvas id="pong" width="600" height="400"></canvas>
        `;
    }

    private setupLocalGame(): void {
		const canvas = this.shadowRoot!.querySelector('canvas')!;
		const ctx = canvas.getContext('2d')!;
		
		// Definimos un tipo para el estado del juego
		type GameState = {
			players: {
				player1: { x: number; y: number };
				player2: { x: number; y: number };
			};
			ball: { x: number; y: number; speedX: number; speedY: number };
			scores: { player1: number; player2: number };
			running: boolean;
		};
	
		// Estado del juego local
		const gameState: GameState = {
			players: {
				player1: { x: 20, y: 150 },
				player2: { x: 560, y: 150 }
			},
			ball: { x: 300, y: 200, speedX: 3, speedY: 3 },
			scores: { player1: 0, player2: 0 },
			running: true
		};
	
		// Controles para ambos jugadores en la misma pantalla
		window.addEventListener('keydown', (e) => {
			const key = e.key.toLowerCase();
			
			// Player1 (flechas)
			if (key === "arrowup") gameState.players.player2.y = Math.max(0, gameState.players.player2.y - 40);
			if (key === "arrowdown") gameState.players.player2.y = Math.min(320, gameState.players.player2.y + 40);
			
			// Player2 (W/S)
			if (key === "w") gameState.players.player1.y = Math.max(0, gameState.players.player1.y - 40);
			if (key === "s") gameState.players.player1.y = Math.min(320, gameState.players.player1.y + 40);
		});
	
		const draw = () => {
			if (!gameState.running) return;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
			// Actualización del juego
			gameState.ball.x += gameState.ball.speedX;
			gameState.ball.y += gameState.ball.speedY;
	
			// Rebotes en bordes superior e inferior
			if (gameState.ball.y <= 0 || gameState.ball.y >= 400) {
				gameState.ball.speedY *= -1;
			}
	
			// Colisiones con palas - solución al error TypeScript
			(Object.keys(gameState.players) as Array<keyof typeof gameState.players>).forEach(playerKey => {
				const player = gameState.players[playerKey];
				if (gameState.ball.x <= player.x + 10 && gameState.ball.x >= player.x - 10) {
					if (gameState.ball.y >= player.y && gameState.ball.y <= player.y + 80) {
						gameState.ball.speedX *= -1;
					}
				}
			});
	
			// Puntuación
			if (gameState.ball.x <= 0) {
				gameState.scores.player2 += 1;
				resetBall();
			} else if (gameState.ball.x >= 600) {
				gameState.scores.player1 += 1;
				resetBall();
			}
	
			// Dibujado
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(gameState.players.player1.x, gameState.players.player1.y, 10, 80);
			ctx.fillRect(gameState.players.player2.x, gameState.players.player2.y, 10, 80);
			
			// Pelota
			ctx.beginPath();
			ctx.arc(gameState.ball.x, gameState.ball.y, 8, 0, Math.PI * 2);
			ctx.fill();
			
			// Marcador
			ctx.font = '24px Arial';
			ctx.fillText(`${gameState.scores.player1}`, 150, 30);
			ctx.fillText(`${gameState.scores.player2}`, 450, 30);
	
			requestAnimationFrame(draw);
		};
	
		const resetBall = () => {
			gameState.ball.x = 300;
			gameState.ball.y = 200;
			gameState.ball.speedX = gameState.ball.speedX > 0 ? -3 : 3;
			gameState.ball.speedY = 5;
		};
	
		draw();
	}

    private setupOnlineGame(): void {
        // Tu implementación original del juego online
        const canvas = this.shadowRoot!.querySelector('canvas')!;
        const ctx = canvas.getContext('2d')!;
        const socket = new WebSocket('ws://localhost:8000/game');
    
        let playerNumber: number | null = null;
        let gameState: any = null;
        let playerY = 150;
    
        socket.onopen = () => socket.send(JSON.stringify({ type: 'start', message: 'jugar' }));
    
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'init') {
                playerNumber = data.playerNumber;
                gameState = data.gameState;
                console.log(`Player ${playerNumber} initialized`);
                requestAnimationFrame(draw);
            } else if (data.type === 'update') {
                gameState = data.gameState;
            } else if (data.type === 'end') {
                alert(data.message);
            }
        };
    
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            
            if (playerNumber === 1 && (key === "arrowup" || key === "arrowdown")) {
                if (key === "arrowup") playerY = Math.max(0, playerY - 20);
                if (key === "arrowdown") playerY = Math.min(320, playerY + 20);
                socket.send(JSON.stringify({ type: 'move', y: playerY }));
            } 
            else if (playerNumber === 2 && (key === "w" || key === "s")) {
                if (key === "w") playerY = Math.max(0, playerY - 20);
                if (key === "s") playerY = Math.min(320, playerY + 20);
                socket.send(JSON.stringify({ type: 'move', y: playerY }));
            }
        });
    
        const draw = () => {
            if (!gameState) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
    
            // Draw players
            ctx.fillStyle = '#ffffff';
            Object.values(gameState.players).forEach((p: any) =>
                ctx.fillRect(p.x, p.y, 10, 80)
            );
    
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