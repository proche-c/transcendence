import { GameState } from './interfaces.js';

export function setupOnlineGame(shadowRoot: ShadowRoot | null) {
    if (!shadowRoot) return null;
    
    const canvas = shadowRoot.querySelector('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    
    const serverIP = window.location.hostname;
    const socket = new WebSocket(`wss://${serverIP}:8000/game`);
    console.log(`Connecting to server at ws://${serverIP}:8000/game`);
    
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

    const keydownHandler = (e: KeyboardEvent) => {
        if (!playerNumber) return;
        const key = e.key.toLowerCase();
        if ((playerNumber === 1 && (key === "arrowup" || key === "arrowdown")) ||
            (playerNumber === 2 && (key === "w" || key === "s"))) {
            playerY = Math.max(0, Math.min(320, playerY + (key === "arrowup" || key === "w" ? -20 : 20)));
            socket.send(JSON.stringify({ type: 'move', y: playerY }));
        }
    };

    window.addEventListener('keydown', keydownHandler);

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
    
    // Retorna una funció de neteja
    return () => {
        window.removeEventListener('keydown', keydownHandler);
        socket.close();
    };
}