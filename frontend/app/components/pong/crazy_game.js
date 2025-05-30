import { createInitialCrazyGameState, resetCrazyBall } from './game_utils.js';
import { renderCrazyGame, showLoserMessage, showStartMessage, startCountdown } from './ui_components.js';
export function setupCrazyGame(shadowRoot) {
    if (!shadowRoot)
        return null;
    const canvas = shadowRoot.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const gameState = createInitialCrazyGameState();
    const keysPressed = {};
    let gameStarted = false;
    let countdownActive = false;
    function handleCrazyPlayerMovement(gameState, keys) {
        const boardSize = 800;
        const moveSpeed = 7;
        const maxPos = boardSize - gameState.players.left.height;
        // Jugador izquierdo (W/S)
        if (keys['w'])
            gameState.players.left.y = Math.max(0, gameState.players.left.y - moveSpeed);
        if (keys['s'])
            gameState.players.left.y = Math.min(maxPos, gameState.players.left.y + moveSpeed);
        // Jugador derecho (flecha arriba/abajo)
        if (keys['arrowup'])
            gameState.players.right.y = Math.max(0, gameState.players.right.y - moveSpeed);
        if (keys['arrowdown'])
            gameState.players.right.y = Math.min(maxPos, gameState.players.right.y + moveSpeed);
        // Jugador superior (Y/U)
        const maxPosHorizontal = boardSize - gameState.players.top.width;
        if (keys['y'])
            gameState.players.top.x = Math.max(0, gameState.players.top.x - moveSpeed);
        if (keys['u'])
            gameState.players.top.x = Math.min(maxPosHorizontal, gameState.players.top.x + moveSpeed);
        // Jugador inferior (B/N)
        if (keys['b'])
            gameState.players.bottom.x = Math.max(0, gameState.players.bottom.x - moveSpeed);
        if (keys['n'])
            gameState.players.bottom.x = Math.min(maxPosHorizontal, gameState.players.bottom.x + moveSpeed);
    }
    function updateCrazyBallPosition(gameState) {
        const ball = gameState.ball;
        ball.x += ball.speedX;
        ball.y += ball.speedY;
    }
    function checkCrazyPaddleCollisions(gameState) {
        const ball = gameState.ball;
        const boardSize = 800;
        const ballRadius = 8;
        // Comprueba colisión con cada pala
        Object.entries(gameState.players).forEach(([position, player]) => {
            if (player.orientation === 'vertical') {
                // Palas verticales (izquierda y derecha)
                if (ball.y >= player.y &&
                    ball.y <= player.y + player.height) {
                    if ((position === 'left' && ball.x - ballRadius <= player.x + player.width && ball.x > player.x) ||
                        (position === 'right' && ball.x + ballRadius >= player.x && ball.x < player.x + player.width)) {
                        ball.speedX *= -1;
                        const relativeIntersectY = (player.y + player.height / 2) - ball.y;
                        ball.speedY = -(relativeIntersectY / (player.height / 2)) * 6;
                    }
                }
            }
            else {
                // Palas horizontales (arriba y abajo)
                if (ball.x >= player.x &&
                    ball.x <= player.x + player.width) {
                    if ((position === 'top' && ball.y - ballRadius <= player.y + player.height && ball.y > player.y) ||
                        (position === 'bottom' && ball.y + ballRadius >= player.y && ball.y < player.y + player.height)) {
                        ball.speedY *= -1;
                        const relativeIntersectX = (player.x + player.width / 2) - ball.x;
                        ball.speedX = -(relativeIntersectX / (player.width / 2)) * 6;
                    }
                }
            }
        });
    }
    function checkCrazyLives(gameState) {
        const ball = gameState.ball;
        const boardSize = 800;
        // Comprueba si la bola sale del tablero
        if (ball.x <= 0) {
            gameState.lives.left--;
            resetCrazyBall(gameState);
            if (gameState.lives.left <= 0) {
                gameState.running = false;
                gameState.loser = 'left';
                showLoserMessage(ctx, canvas, "Jugador izquierdo ha perdido!");
            }
        }
        else if (ball.x >= boardSize) {
            gameState.lives.right--;
            resetCrazyBall(gameState);
            if (gameState.lives.right <= 0) {
                gameState.running = false;
                gameState.loser = 'right';
                showLoserMessage(ctx, canvas, "Jugador derecho ha perdido!");
            }
        }
        else if (ball.y <= 0) {
            gameState.lives.top--;
            resetCrazyBall(gameState);
            if (gameState.lives.top <= 0) {
                gameState.running = false;
                gameState.loser = 'top';
                showLoserMessage(ctx, canvas, "Jugador superior ha perdido!");
            }
        }
        else if (ball.y >= boardSize) {
            gameState.lives.bottom--;
            resetCrazyBall(gameState);
            if (gameState.lives.bottom <= 0) {
                gameState.running = false;
                gameState.loser = 'bottom';
                showLoserMessage(ctx, canvas, "Jugador inferior ha perdido!");
            }
        }
    }
    const keydownHandler = (e) => {
        keysPressed[e.key.toLowerCase()] = true;
        // Detecta la tecla Enter per començar el joc
        if (e.key.toLowerCase() === 'enter' && !gameStarted && !countdownActive) {
            countdownActive = true;
            startCountdown(ctx, canvas, gameState, () => {
                gameStarted = true;
                countdownActive = false;
            });
        }
    };
    const keyupHandler = (e) => {
        keysPressed[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', keydownHandler);
    window.addEventListener('keyup', keyupHandler);
    // Mostra el missatge inicial
    showStartMessage(ctx, canvas);
    const draw = () => {
        if (!gameState.running) {
            window.removeEventListener('keydown', keydownHandler);
            window.removeEventListener('keyup', keyupHandler);
            return;
        }
        // Només actualitza el joc si ha començat
        if (gameStarted) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            handleCrazyPlayerMovement(gameState, keysPressed);
            updateCrazyBallPosition(gameState);
            checkCrazyPaddleCollisions(gameState);
            checkCrazyLives(gameState);
            renderCrazyGame(ctx, gameState);
        }
        requestAnimationFrame(draw);
    };
    draw();
    // Retorna una funció de neteja
    return () => {
        window.removeEventListener('keydown', keydownHandler);
        window.removeEventListener('keyup', keyupHandler);
        gameState.running = false;
    };
}
