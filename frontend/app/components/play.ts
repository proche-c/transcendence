class PlayComponent extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.render();
		this.setupGame();
	}

	private render(): void {
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

	private setupGame(): void {
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
			const key = e.key.toLowerCase(); // Convert to lowercase for consistent comparison
			
			// Debug log
			console.log(`Key pressed: ${key} by player ${playerNumber}`);
	
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
