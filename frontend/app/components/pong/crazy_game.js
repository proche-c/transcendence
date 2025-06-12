import { createInitialCrazyGameState, resetCrazyBall } from './game_utils.js';
import { renderCrazyGame, showStartMessage, startCountdown } from './ui_components.js';
export function setupCrazyGame(shadowRoot) {
    if (!shadowRoot)
        return null;
    const canvas = shadowRoot.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const gameState = createInitialCrazyGameState();
    const keysPressed = {};
    let gameStarted = false;
    let countdownActive = false;
    // Add interface elements similar to other game modes
    const statusElement = document.createElement('div');
    statusElement.className = 'text-center font-bold text-xl mt-2 mb-4 text-violet-900';
    statusElement.textContent = 'Crazy Mode';
    const instructionsElement = document.createElement('div');
    instructionsElement.className = 'text-center text-gray-700 mt-2';
    instructionsElement.textContent = 'Left: W/S | Right: ↑/↓ | Top: Y/U | Bottom: B/N';
    // Create game status container
    const gameStatusContainer = document.createElement('div');
    gameStatusContainer.className = 'flex flex-col items-center justify-center space-y-2 mb-4';
    gameStatusContainer.appendChild(statusElement);
    gameStatusContainer.appendChild(instructionsElement);
    // Add elements to the interface
    const gameContainer = shadowRoot.querySelector('.grow');
    if (gameContainer) {
        const infoContainer = document.createElement('div');
        infoContainer.className = 'w-full max-w-lg mx-auto text-center';
        infoContainer.appendChild(gameStatusContainer);
        gameContainer.insertBefore(infoContainer, gameContainer.firstChild);
    }
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
                statusElement.textContent = "Game Over - Left player has lost!";
                statusElement.className = 'text-center font-bold text-xl mt-2 mb-4 text-red-600';
                addReturnToMenuButton();
            }
        }
        else if (ball.x >= boardSize) {
            gameState.lives.right--;
            resetCrazyBall(gameState);
            if (gameState.lives.right <= 0) {
                gameState.running = false;
                gameState.loser = 'right';
                statusElement.textContent = "Game Over - Right player has lost!";
                statusElement.className = 'text-center font-bold text-xl mt-2 mb-4 text-red-600';
                addReturnToMenuButton();
            }
        }
        else if (ball.y <= 0) {
            gameState.lives.top--;
            resetCrazyBall(gameState);
            if (gameState.lives.top <= 0) {
                gameState.running = false;
                gameState.loser = 'top';
                statusElement.textContent = "Game Over - Top player has lost!";
                statusElement.className = 'text-center font-bold text-xl mt-2 mb-4 text-red-600';
                addReturnToMenuButton();
            }
        }
        else if (ball.y >= boardSize) {
            gameState.lives.bottom--;
            resetCrazyBall(gameState);
            if (gameState.lives.bottom <= 0) {
                gameState.running = false;
                gameState.loser = 'bottom';
                statusElement.textContent = "Game Over - Bottom player has lost!";
                statusElement.className = 'text-center font-bold text-xl mt-2 mb-4 text-red-600';
                addReturnToMenuButton();
            }
        }
    }
    function addReturnToMenuButton() {
        instructionsElement.textContent = 'The game has ended. Return to the main menu to play again.';
    }
    const keydownHandler = (e) => {
        keysPressed[e.key.toLowerCase()] = true;
        // Detect Enter key to start game
        if (e.key.toLowerCase() === 'enter' && !gameStarted && !countdownActive) {
            countdownActive = true;
            statusElement.textContent = 'Get ready...';
            startCountdown(ctx, canvas, gameState, () => {
                gameStarted = true;
                countdownActive = false;
                statusElement.textContent = 'Game in progress!';
                statusElement.className = 'text-center font-bold text-xl mt-2 mb-4 text-green-700';
            });
        }
    };
    const keyupHandler = (e) => {
        keysPressed[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', keydownHandler);
    window.addEventListener('keyup', keyupHandler);
    // Show initial message
    showStartMessage(ctx, canvas);
    const draw = () => {
        if (!gameState.running) {
            window.removeEventListener('keydown', keydownHandler);
            window.removeEventListener('keyup', keyupHandler);
            return;
        }
        // Only update if game has started
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
    // Return cleanup function
    return () => {
        window.removeEventListener('keydown', keydownHandler);
        window.removeEventListener('keyup', keyupHandler);
        gameState.running = false;
        // Remove added elements
        if (gameContainer) {
            const infoContainer = gameContainer.querySelector('.w-full.max-w-lg');
            if (infoContainer) {
                gameContainer.removeChild(infoContainer);
            }
        }
    };
}
