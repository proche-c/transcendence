import { resetBall, resetCrazyBall } from './game_utils.js';
export function renderLocalGame(ctx, gameState) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(gameState.players.player1.x, gameState.players.player1.y, 10, 80);
    ctx.fillRect(gameState.players.player2.x, gameState.players.player2.y, 10, 80);
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '24px Arial';
    ctx.fillText(`${gameState.scores.player1}`, 150, 30);
    ctx.fillText(`${gameState.scores.player2}`, 650, 30);
}
export function renderCrazyGame(ctx, gameState) {
    const boardSize = 800;
    // Dibujar las palas
    ctx.fillStyle = '#fff';
    Object.values(gameState.players).forEach(player => {
        ctx.fillRect(player.x, player.y, player.width, player.height);
    });
    // Dibujar la bola
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, 8, 0, Math.PI * 2);
    ctx.fill();
    // Mostrar vidas
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    // Vidas jugador izquierdo
    ctx.fillText(`${gameState.lives.left}`, 30, boardSize / 2);
    // Vidas jugador derecho
    ctx.fillText(`${gameState.lives.right}`, boardSize - 30, boardSize / 2);
    // Vidas jugador superior
    ctx.fillText(`${gameState.lives.top}`, boardSize / 2, 30);
    // Vidas jugador inferior
    ctx.fillText(`${gameState.lives.bottom}`, boardSize / 2, boardSize - 15);
}
export function showWinnerMessage(ctx, canvas, message) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}
export function showStartMessage(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Fons semitransparent
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Títol
    ctx.fillStyle = '#ffffff';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("¡Ready to play!", canvas.width / 2, canvas.height / 2 - 40);
    // Instruccions
    ctx.font = '28px Arial';
    ctx.fillText("Press ENTER to begin", canvas.width / 2, canvas.height / 2 + 20);
}
export function startCountdown(ctx, canvas, gameState, onComplete) {
    let count = 3;
    const doCountdown = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Fons semitransparent
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Número del compte enrere
        ctx.fillStyle = '#ffffff';
        ctx.font = '80px Arial Bold';
        ctx.textAlign = 'center';
        ctx.fillText(count.toString(), canvas.width / 2, canvas.height / 2);
        count--;
        if (count >= 0) {
            setTimeout(doCountdown, 1000);
        }
        else {
            // Inicialitza la posició de la pilota
            if ('scores' in gameState) {
                resetBall(gameState, Math.random() < 0.5 ? 0 : 1);
            }
            else {
                resetCrazyBall(gameState);
            }
            onComplete();
        }
    };
    doCountdown();
}
