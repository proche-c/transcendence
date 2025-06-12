import { GameState } from './interfaces.js';
import { SERVER_IP } from '../../config.js';

export function setupOnlineGame(shadowRoot: ShadowRoot | null) {
    if (!shadowRoot) return null;
    
    const canvas = shadowRoot.querySelector('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    
    // Elements de la interfície amb estil Tailwind consistent
    const statusElement = document.createElement('div');
    statusElement.className = 'text-center font-bold text-xl mt-2 mb-4 text-violet-900';
    statusElement.textContent = 'Connectant al servidor...';
    
    const instructionsElement = document.createElement('div');
    instructionsElement.className = 'text-center text-gray-700 mt-2';
    
    // Contenidor d'estat del joc
    const gameStatusContainer = document.createElement('div');
    gameStatusContainer.className = 'flex flex-col items-center justify-center space-y-2 mb-4';
    gameStatusContainer.appendChild(statusElement);
    gameStatusContainer.appendChild(instructionsElement);
    
    // Afegir un indicador de sala
    const roomIndicator = document.createElement('div');
    roomIndicator.className = 'bg-violet-200 text-violet-900 px-3 py-1 rounded-lg font-semibold text-sm';
    roomIndicator.textContent = 'Esperant sala...';
    gameStatusContainer.appendChild(roomIndicator);
    
    // Afegir elements a la interfície
    const gameContainer = shadowRoot.querySelector('.grow');
    if (gameContainer) {
        const infoContainer = document.createElement('div');
        infoContainer.className = 'w-full max-w-lg mx-auto text-center';
        infoContainer.appendChild(gameStatusContainer);
        gameContainer.insertBefore(infoContainer, gameContainer.firstChild);
    }
    
    // Connexió al servidor
    const socket = new WebSocket(`wss://${SERVER_IP}:8443/api/game`);
    console.log(`Connectant al servidor a wss://${SERVER_IP}:8443/api/game`);
    
    let playerNumber: number | null = null;
    let gameState: GameState | null = null;
    let playerY = 200;
    let roomId: string | null = null;
    let gameStarted = false;
    
    socket.onopen = () => {
        statusElement.textContent = 'Buscant oponent...';
        // El servidor assigna automàticament una sala
    };
    
    socket.onclose = () => {
        statusElement.textContent = 'Connexió tancada';
        statusElement.className = 'text-center font-bold text-xl mt-2 mb-4 text-red-600';
    };
    
    socket.onerror = () => {
        statusElement.textContent = 'Error de connexió';
        statusElement.className = 'text-center font-bold text-xl mt-2 mb-4 text-red-600';
    };
    
    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log("Missatge rebut:", data); // Per depuració
            
            switch (data.type) {
                case 'init':
                    playerNumber = data.playerNumber;
                    gameState = data.gameState;
                    roomId = data.roomId;
                    
                    console.log(`Inicialitzat com a Jugador ${playerNumber} a sala ${roomId}`);
                    
                    roomIndicator.textContent = `Room: ${roomId || 'unknown'}`;
                    statusElement.textContent = `Player ${playerNumber}`;
                    updateInstructions();
                    
                    if (data.gameState.running) {
                        gameStarted = true;
                        statusElement.className = 'text-center font-bold text-xl mt-2 mb-4 text-green-700';
                    } else {
                        statusElement.textContent += ' - Waiting opponent...';
                    }
                    
                    requestAnimationFrame(draw);
                    break;
                
                case 'gameStart':
                    gameStarted = true;
                    statusElement.textContent = `Player ${playerNumber} - Game running`;
                    statusElement.className = 'text-center font-bold text-xl mt-2 mb-4 text-green-700';
                    break;
                
                case 'update':
                    if (data.gameState) {
                        gameState = data.gameState;
                    }
                    break;
                
                case 'score':
                    if (gameState && data.scores) {
                        gameState.scores = data.scores;
                    }
                    break;
                
                case 'end':
                    gameStarted = false;
                    const resultText = data.finalScore ? 
                        ` (${data.finalScore.player1} - ${data.finalScore.player2})` : '';
                    statusElement.textContent = `${data.message}${resultText}`;
                    statusElement.className = 'text-center font-bold text-xl mt-2 mb-4 text-violet-900';
                    instructionsElement.textContent = 'The game has ended.';
                    
                    // Animació per mostrar el guanyador
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 28px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(data.message, canvas.width / 2, canvas.height / 2);
                    break;
                
                               case 'gameEnd':
                    gameStarted = false;
                    statusElement.textContent = data.message;
                    statusElement.className = 'text-center font-bold text-xl mt-2 mb-4 text-red-600';
                    
                    // Mostrar missatge d'error i botó per tornar al menú
                    instructionsElement.textContent = 'The game has ended. Return to the main menu to play again.';
                    
                    // Afegir un botó per tornar al menú principal
                    
                    // Mostrar missatge a la pantalla
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#ff6b6b';
                    ctx.font = 'bold 28px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(data.message, canvas.width / 2, canvas.height / 2);
                    ctx.font = 'bold 18px Arial';
                    ctx.fillText('Return to the main menu to start a new game', canvas.width / 2, canvas.height / 2 + 40);
                    
                    // Si s'ha desconnectat forçosament, tanquem la connexió
                    if (data.forceDisconnect) {
                        socket.close();
                    }
                    break;
            }
        } catch (error) {
            console.error("Error processant missatge:", error);
        }
    };
    
    function updateInstructions() {
        instructionsElement.textContent = 'Control with arrows ↑↓ or keys W/S';
    }

const keydownHandler = (e: KeyboardEvent) => {
    if (!playerNumber || !gameStarted)
        return;
    
    const key = e.key.toLowerCase();
    let moved = false;
    
    // Ambdós jugadors poden utilitzar ambdós controls
    if (playerNumber === 1) {
        if (key === "arrowup" || key === "w") {
            playerY = Math.max(0, Math.min(420, playerY - 20));
            moved = true;
        } else if (key === "arrowdown" || key === "s") {
            playerY = Math.max(0, Math.min(420, playerY + 20));
            moved = true;
        }
    } else if (playerNumber === 2) {
        if (key === "arrowup" || key === "w") {
            playerY = Math.max(0, Math.min(420, playerY - 20));
            moved = true;
        } else if (key === "arrowdown" || key === "s") {
            playerY = Math.max(0, Math.min(420, playerY + 20));
            moved = true;
        }
    }
    
    if (moved) {
        socket.send(JSON.stringify({ type: 'move', y: playerY }));
    }
};


    window.addEventListener('keydown', keydownHandler);

    const draw = () => {
        if (!gameState) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dibuixar el camp amb l'estil que segueix els colors de l'app
        ctx.fillStyle = '#1e293b'; // Un fons més fosc (slate-800)
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Línia central amb estil consistent
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Pales dels jugadors
        ctx.fillStyle = '#ffffff';
        Object.values(gameState.players).forEach(p => {
            ctx.fillRect(p.x, p.y, 10, 80);
        });
        
        // Pilota amb efecte de brillantor
        const ball = gameState.ball;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Afegir un efecte de brillantor a la pilota
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        
        // Puntuacions amb estil consistent
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`${gameState.scores.player1}`, canvas.width / 4, 50);
        ctx.fillText(`${gameState.scores.player2}`, (canvas.width / 4) * 3, 50);
        
        // Indicador de jugador actual
        if (playerNumber) {
            const isPlayer1 = playerNumber === 1;
            const x = isPlayer1 ? canvas.width / 4 : (canvas.width / 4) * 3;
            
            ctx.fillStyle = '#4ade80'; // Color verd per l'indicador (green-400)
            ctx.beginPath();
            ctx.moveTo(x, 60);
            ctx.lineTo(x - 10, 70);
            ctx.lineTo(x + 10, 70);
            ctx.fill();
        }
        
        requestAnimationFrame(draw);
    };
    
    // Retorna una funció de neteja
    return () => {
        window.removeEventListener('keydown', keydownHandler);
        socket.close();
        
        // Eliminar elements afegits
        if (gameContainer) {
            const infoContainer = gameContainer.querySelector('.w-full.max-w-lg');
            if (infoContainer) {
                gameContainer.removeChild(infoContainer);
            }
        }
    };
}