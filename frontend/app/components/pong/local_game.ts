import { GameState } from './interfaces.js';
import { createInitialGameState, handlePlayerMovement, updateBallPosition, checkPaddleCollisions, reportResultToServer, resetBall } from './game_utils.js';
import { renderLocalGame, showWinnerMessage, showStartMessage, startCountdown } from './ui_components.js';

export function setupLocalGame(shadowRoot: ShadowRoot | null) {
    if (!shadowRoot) return null;
    
    const canvas = shadowRoot.querySelector('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const gameState = createInitialGameState();
    const keysPressed: Record<string, boolean> = {};
    let gameStarted = false;
    let countdownActive = false;

    // Afegim elements d'instruccions similars al mode online
    const statusElement = document.createElement('div');
    statusElement.className = 'text-center font-bold text-xl mt-2 mb-4 text-violet-900';
    statusElement.textContent = 'Local Mode';
    
    const instructionsElement = document.createElement('div');
    instructionsElement.className = 'text-center text-gray-700 mt-2';
    instructionsElement.textContent = 'Player 1 (left): uses W/S | Player 2 (right): arrows up/down';
    
    // Contenidor d'estat del joc
    const gameStatusContainer = document.createElement('div');
    gameStatusContainer.className = 'flex flex-col items-center justify-center space-y-2 mb-4';
    gameStatusContainer.appendChild(statusElement);
    gameStatusContainer.appendChild(instructionsElement);
    
    // Afegir elements a la interfície
    const gameContainer = shadowRoot.querySelector('.grow');
    if (gameContainer) {
        const infoContainer = document.createElement('div');
        infoContainer.className = 'w-full max-w-lg mx-auto text-center';
        infoContainer.appendChild(gameStatusContainer);
        gameContainer.insertBefore(infoContainer, gameContainer.firstChild);
    }

    function checkScore() {
        if (gameState.ball.x <= 0) {
            gameState.scores.player2++;
            if (gameState.scores.player2 >= 4) {
                gameState.running = false;
                showWinnerMessage(ctx, canvas, "Player 2 wins!");
                reportResultToServer(gameState);
            } else {
                resetBall(gameState, 0);
            }
        } else if (gameState.ball.x >= 800) {
            gameState.scores.player1++;
            if (gameState.scores.player1 >= 4) {
                gameState.running = false;
                showWinnerMessage(ctx, canvas,  "Player 1 wins!");
                reportResultToServer(gameState);
            } else {
                resetBall(gameState, 1);
            }
        }
    }

    const keydownHandler = (e: KeyboardEvent) => {
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

    const keyupHandler = (e: KeyboardEvent) => {
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
        
        // Eliminar elements afegits
        if (gameContainer) {
            const infoContainer = gameContainer.querySelector('.w-full.max-w-lg');
            if (infoContainer) {
                gameContainer.removeChild(infoContainer);
            }
        }
    };
}