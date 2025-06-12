import { GameState } from './interfaces.js';
import { createInitialGameState, updateBallPosition, checkPaddleCollisions, reportResultToServer, resetBall } from './game_utils.js';
import { renderLocalGame, showWinnerMessage, showStartMessage, startCountdown } from './ui_components.js';

export function setupAIGame(shadowRoot: ShadowRoot | null) {
    if (!shadowRoot) return null;
    
    const canvas = shadowRoot.querySelector('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const gameState = createInitialGameState();
    const keysPressed: Record<string, boolean> = {};
    let gameStarted = false;
    let countdownActive = false;
    
    // Variables per l'IA
    let lastAIUpdateTime = 0;
    let aiTargetY = 250;
    let movingToCenter = false;
    
    // Afegim elements d'instruccions similars al mode online
    const statusElement = document.createElement('div');
    statusElement.className = 'text-center font-bold text-xl mt-2 mb-4 text-violet-900';
    statusElement.textContent = 'Playing vs IA';
    
    const instructionsElement = document.createElement('div');
    instructionsElement.className = 'text-center text-gray-700 mt-2';
    instructionsElement.textContent = 'Use W/S to play';
 
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
    
    function predictBallPosition(gameState: GameState): number {
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

    function updateAI(gameState: GameState, difficulty: number) {
        const now = Date.now();
        const ball = gameState.ball;

        if (now - lastAIUpdateTime > 1000) {
            lastAIUpdateTime = now;

            if (ball.speedX > 0) {
                const perfectY = predictBallPosition(gameState);
                const error = (1 - difficulty) * 80;
                aiTargetY = perfectY + ((Math.random() * 2 - 1) * error);
                movingToCenter = false;
            } else {
                aiTargetY = ball.y * (difficulty * 0.8) + 250 * (1 - difficulty * 0.8);
                movingToCenter = true;
            }
        }

        const paddle = gameState.players.player2;
        const centerY = paddle.y + 40;
        const diff = aiTargetY - centerY;
        const deadZone = 15;

        const aiKeysPressed = {
            'arrowup': diff < -deadZone,
            'arrowdown': diff > deadZone
        };

        const baseSpeed = 4 + difficulty * 3;
        const speed = movingToCenter ? baseSpeed * 0.6 : baseSpeed;

        if (aiKeysPressed['arrowup']) paddle.y = Math.max(0, paddle.y - speed);
        if (aiKeysPressed['arrowdown']) paddle.y = Math.min(420, paddle.y + speed);
    }

    function checkScore() {
        if (gameState.ball.x <= 0) {
            gameState.scores.player2++;
            if (gameState.scores.player2 >= 4) {
                gameState.running = false;
                showWinnerMessage(ctx, canvas, "AI Wins!");
                reportResultToServer(gameState);
            } else {
                resetBall(gameState, 0);
            }
        } else if (gameState.ball.x >= 800) {
            gameState.scores.player1++;
            if (gameState.scores.player1 >= 4) {
                gameState.running = false;
                showWinnerMessage(ctx, canvas, "You Win!");
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
            window.removeEventListener('keydown', keydownHandler);
            window.removeEventListener('keyup', keyupHandler);
            return;
        }

        // Només actualitza el joc si ha començat
        if (gameStarted) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (keysPressed['w']) gameState.players.player1.y = Math.max(0, gameState.players.player1.y - 6);
            if (keysPressed['s']) gameState.players.player1.y = Math.min(420, gameState.players.player1.y + 6);

            updateAI(gameState, 0.7);
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