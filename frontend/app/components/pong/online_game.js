export function setupOnlineGame(shadowRoot) {
    if (!shadowRoot)
        return null;
    const canvas = shadowRoot.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const serverIP = window.location.hostname;
    const socket = new WebSocket(`wss://192.168.68.50:8443/api/game`);
    console.log(`Connecting to server at wss://192.168.68.50:8443/game`);
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
    const keydownHandler = (e) => {
        if (!playerNumber)
            return;
        const key = e.key.toLowerCase();
        if ((playerNumber === 1 && (key === "arrowup" || key === "arrowdown")) ||
            (playerNumber === 2 && (key === "w" || key === "s"))) {
            playerY = Math.max(0, Math.min(320, playerY + (key === "arrowup" || key === "w" ? -20 : 20)));
            socket.send(JSON.stringify({ type: 'move', y: playerY }));
        }
    };
    window.addEventListener('keydown', keydownHandler);
    const draw = () => {
        if (!gameState)
            return;
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
