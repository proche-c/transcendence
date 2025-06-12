import { SERVER_IP } from '../../config.js';
export function createInitialGameState() {
    return {
        players: {
            player1: { x: 30, y: 200, width: 10, height: 80, orientation: 'vertical' },
            player2: { x: 740, y: 200, width: 10, height: 80, orientation: 'vertical' }
        },
        ball: { x: 400, y: 250, speedX: 10, speedY: 0 },
        scores: { player1: 0, player2: 0 },
        running: true
    };
}
export function createInitialCrazyGameState() {
    const boardSize = 800;
    const paddleWidth = 130;
    const paddleThickness = 12;
    return {
        players: {
            left: {
                x: 0,
                y: boardSize / 2 - paddleWidth / 2,
                width: paddleThickness,
                height: paddleWidth,
                orientation: 'vertical'
            },
            right: {
                x: boardSize - paddleThickness,
                y: boardSize / 2 - paddleWidth / 2,
                width: paddleThickness,
                height: paddleWidth,
                orientation: 'vertical'
            },
            top: {
                x: boardSize / 2 - paddleWidth / 2,
                y: 0,
                width: paddleWidth,
                height: paddleThickness,
                orientation: 'horizontal'
            },
            bottom: {
                x: boardSize / 2 - paddleWidth / 2,
                y: boardSize - paddleThickness,
                width: paddleWidth,
                height: paddleThickness,
                orientation: 'horizontal'
            }
        },
        ball: {
            x: boardSize / 2,
            y: boardSize / 2,
            speedX: 4,
            speedY: 4
        },
        lives: {
            left: 4,
            right: 4,
            top: 4,
            bottom: 4
        },
        running: true,
        loser: null
    };
}
export function resetBall(gameState, flag) {
    gameState.ball.x = 400;
    gameState.ball.y = 250;
    gameState.ball.speedY = 0;
    gameState.ball.speedX = 0;
    setTimeout(() => {
        gameState.ball.speedX = flag === 0 ? -10 : 10;
    }, 2000);
}
export function resetCrazyBall(gameState) {
    const boardSize = 800;
    gameState.ball.x = boardSize / 2;
    gameState.ball.y = boardSize / 2;
    // Velocidad aleatoria para que la bola no salga siempre en la misma dirección
    const angle = Math.random() * Math.PI * 2;
    const speed = 10;
    gameState.ball.speedX = Math.cos(angle) * speed;
    gameState.ball.speedY = Math.sin(angle) * speed;
}
export function handlePlayerMovement(gameState, keys) {
    if (keys['w'])
        gameState.players.player1.y = Math.max(0, gameState.players.player1.y - 6);
    if (keys['s'])
        gameState.players.player1.y = Math.min(420, gameState.players.player1.y + 6);
    if (keys['arrowup'])
        gameState.players.player2.y = Math.max(0, gameState.players.player2.y - 6);
    if (keys['arrowdown'])
        gameState.players.player2.y = Math.min(420, gameState.players.player2.y + 6);
}
export function updateBallPosition(gameState) {
    const ball = gameState.ball;
    ball.x += ball.speedX;
    ball.y += ball.speedY;
    if (ball.y <= 0 || ball.y >= 500) {
        ball.speedY *= -1;
    }
}
export function checkPaddleCollisions(gameState) {
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
export async function reportResultToServer(gameState) {
    const { player1, player2 } = gameState.scores;
    const formData = new FormData();
    formData.append("goalsFor", player1.toString());
    formData.append("goalsAgainst", player2.toString());
    try {
        const res = await fetch(`https://${SERVER_IP}:8443/api/api/stats`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });
        if (!res.ok) {
            const text = await res.text();
            console.error('Error subiendo stats:', text);
        }
        else {
            console.log('Stats enviadas correctamente');
        }
    }
    catch (err) {
        console.error('Error de red al reportar stats:', err);
    }
}
