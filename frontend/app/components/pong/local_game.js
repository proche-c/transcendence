import { createInitialGameState, handlePlayerMovement, updateBallPosition, checkPaddleCollisions, reportResultToServer } from './game_utils.js';
import { renderLocalGame, showWinnerMessage, showStartMessage, startCountdown } from './ui_components.js';
export function setupLocalGame(shadowRoot) {
    if (!shadowRoot)
        return null;
    const canvas = shadowRoot.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const gameState = createInitialGameState();
    const keysPressed = {};
    let gameStarted = false;
    let countdownActive = false;
    function checkScore() {
        if (gameState.ball.x <= 0) {
            gameState.scores.player2++;
            if (gameState.scores.player2 >= 4) {
                gameState.running = false;
                showWinnerMessage(ctx, canvas, "Player 2 Wins!");
                reportResultToServer(gameState);
            }
            else {
                resetBall(gameState, 0);
            }
        }
        else if (gameState.ball.x >= 800) {
            gameState.scores.player1++;
            if (gameState.scores.player1 >= 4) {
                gameState.running = false;
                showWinnerMessage(ctx, canvas, "Player 1 Wins!");
                reportResultToServer(gameState);
            }
            else {
                resetBall(gameState, 1);
            }
        }
    }
    function resetBall(gameState, flag) {
        gameState.ball.x = 400;
        gameState.ball.y = 250;
        gameState.ball.speedY = 0;
        gameState.ball.speedX = flag === 0 ? -6 : 6;
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
            // Neteja els event listeners quan el joc s'acaba
            window.removeEventListener('keydown', keydownHandler);
            window.removeEventListener('keyup', keyupHandler);
            return;
        }
        // Només actualitza el joc si ha començat
        if (gameStarted) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            handlePlayerMovement(gameState, keysPressed);
            updateBallPosition(gameState);
            checkPaddleCollisions(gameState);
            checkScore();
            renderLocalGame(ctx, gameState);
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
