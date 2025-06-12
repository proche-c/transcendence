import { GameState } from './interfaces.js';
import { createInitialGameState, updateBallPosition, checkPaddleCollisions, resetBall, handlePlayerMovement } from './game_utils.js';
import { renderLocalGame, showWinnerMessage, showStartMessage, startCountdown } from './ui_components.js';

interface TournamentInfo {
    name: string;
    players: string[];
    matches: {
        id: string; // "semifinal1", "semifinal2", "final"
        player1: string;
        player2: string;
        winner?: string;
        score?: {
            player1: number;
            player2: number;
        };
    }[];
    winner?: string;
}

export function setupTournament(shadowRoot: ShadowRoot | null) {
    if (!shadowRoot) return null;
    
    // Inicialitzar vista de tournament
    renderTournamentSetup(shadowRoot);
    
    return () => {
        // Clean-up function
    };
}

export function renderTournamentSetup(shadowRoot: ShadowRoot) {
    // Afegir el CSS
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "./app/tailwind.css";
    
    shadowRoot.innerHTML = `
        <div class="flex h-screen">
            <div class="">
                <pong-menu></pong-menu>
            </div>
            <div class="grow flex flex-col items-center justify-center p-4">
                <div class="w-full max-w-lg bg-white rounded-lg shadow-lg p-6 border-2 border-gray-900">
                    <h2 class="text-2xl font-bold text-center text-violet-900 mb-6">Create Tournament</h2>
                    
                    <form id="tournamentForm" class="space-y-4">
                        <div>
                            <label for="tournamentName" class="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
                            <input type="text" id="tournamentName" name="tournamentName" 
                                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500" 
                                required 
                                placeholder="Enter tournament name">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Players (4)</label>
                            <div id="playersList" class="space-y-2 mb-2">
                                <div class="flex items-center">
                                    <input type="text" name="player1" 
                                        class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500" 
                                        placeholder="Player 1" required>
                                </div>
                                <div class="flex items-center">
                                    <input type="text" name="player2" 
                                        class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500" 
                                        placeholder="Player 2" required>
                                </div>
                                <div class="flex items-center">
                                    <input type="text" name="player3" 
                                        class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500" 
                                        placeholder="Player 3" required>
                                </div>
                                <div class="flex items-center">
                                    <input type="text" name="player4" 
                                        class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500" 
                                        placeholder="Player 4" required>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex justify-center space-x-4 pt-4">
                            <button type="submit" id="createTournamentBtn" 
                                class="p-4 text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md">
                                Create Tournament
                            </button>
                            <button type="button" id="backToMenuBtn" 
                                class="p-4 text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
                
                <div id="savedTournaments" class="mt-6 w-full max-w-lg bg-white rounded-lg shadow-lg p-6 border-2 border-gray-900">
                    <h3 class="text-xl font-bold text-center text-violet-900 mb-4">Saved Tournaments</h3>
                    <div id="tournamentsList" class="space-y-2">
                        <!-- Tournament list will be loaded here -->
                        <p id="noTournamentsMsg" class="text-center text-gray-500">No saved tournaments</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    shadowRoot.appendChild(style);
    
    // Set up event listeners
    setupTournamentFormListeners(shadowRoot);
    loadSavedTournaments(shadowRoot);
}

function setupTournamentFormListeners(shadowRoot: ShadowRoot) {
    const form = shadowRoot.getElementById('tournamentForm') as HTMLFormElement;
    const backToMenuBtn = shadowRoot.getElementById('backToMenuBtn');
    const playersList = shadowRoot.getElementById('playersList');
    
    // Form submission
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const tournamentNameInput = shadowRoot.getElementById('tournamentName') as HTMLInputElement;
        const tournamentName = tournamentNameInput.value.trim();
        
        if (!tournamentName) {
            alert('Please enter a tournament name');
            return;
        }
        
        if (!validateInput(tournamentName)) {
            alert('Tournament name must contain only letters and be maximum 10 characters');
            return;
        }
        
        const playerInputs = playersList?.querySelectorAll('input') || [];
        const players: string[] = [];
        
        let invalidPlayerNames = false;
        playerInputs.forEach(input => {
            const playerName = input.value.trim();
            if (playerName) {
                if (!validateInput(playerName)) {
                    alert(`Player name "${playerName}" must contain only letters and be maximum 10 characters`);
                    invalidPlayerNames = true;
                    return;
                }
                players.push(playerName);
            }
        });
        
        if (invalidPlayerNames) return;
        
        if (players.length < 4) {
            alert('You must enter all 4 players');
            return;
        }
        
        // Create tournament structure
        const tournament: TournamentInfo = {
            name: tournamentName,
            players: players,
            matches: generateBracket(players)
        };
        
        // Save to localStorage
        saveTournament(tournament);
        
        // Show tournament view
        renderTournamentBracket(shadowRoot, tournament);
    });
    
    // Back to menu button
    backToMenuBtn?.addEventListener('click', () => {
        // This will trigger the rendering of PlayComponent's menu
        const playComponent = shadowRoot.host as HTMLElement;
        if (playComponent.tagName.toLowerCase() === 'pong-play') {
            const playComponentInstance = playComponent as any;
            if (typeof playComponentInstance.renderMenu === 'function') {
                playComponentInstance.cleanupCurrentGame();
                playComponentInstance.renderMenu();
            }
        }
    });
}

function loadSavedTournaments(shadowRoot: ShadowRoot) {
    const tournamentsList = shadowRoot.getElementById('tournamentsList');
    const noTournamentsMsg = shadowRoot.getElementById('noTournamentsMsg');
    
    if (!tournamentsList) return;
    
    // Get tournaments from localStorage
    const tournaments = getSavedTournaments();
    
    if (tournaments.length === 0) {
        if (noTournamentsMsg) noTournamentsMsg.style.display = 'block';
        return;
    }
    
    // Hide no tournaments message
    if (noTournamentsMsg) noTournamentsMsg.style.display = 'none';
    
    // Clear existing list
    tournamentsList.innerHTML = '';
    
    // Add tournaments to list
    tournaments.forEach(tournament => {
        const tournamentDiv = document.createElement('div');
        tournamentDiv.className = 'flex justify-between items-center p-2 border border-gray-300 rounded-md bg-gray-50';
        
        let status = 'In Progress';
        if (tournament.winner) {
            status = `Winner: ${tournament.winner}`;
        }
        
        tournamentDiv.innerHTML = `
            <div>
                <h4 class="font-bold">${tournament.name}</h4>
                <p class="text-sm text-gray-600">4 players · ${status}</p>
            </div>
            <div>
                <button class="load-tournament-btn p-4 text-sm font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md" 
                    data-id="${tournament.name}">
                    Load
                </button>
                <button class="delete-tournament-btn p-4 text-sm font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md ml-2" 
                    data-id="${tournament.name}">
                    Delete
                </button>
            </div>
        `;
        
        tournamentsList.appendChild(tournamentDiv);
        
        // Add event listener to load button
        const loadBtn = tournamentDiv.querySelector('.load-tournament-btn');
        loadBtn?.addEventListener('click', () => {
            renderTournamentBracket(shadowRoot, tournament);
        });
        
        // Add event listener to delete button
        const deleteBtn = tournamentDiv.querySelector('.delete-tournament-btn');
        deleteBtn?.addEventListener('click', () => {
            deleteTournament(tournament.name);
            loadSavedTournaments(shadowRoot);
        });
    });
}

function renderTournamentBracket(shadowRoot: ShadowRoot, tournament: TournamentInfo) {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "./app/tailwind.css";
    
    shadowRoot.innerHTML = `
        <div class="flex h-screen">
            <div class="">
                <pong-menu></pong-menu>
            </div>
            <div class="grow flex flex-col items-center p-4">
                <div class="w-full max-w-5xl">
                    <h1 class="text-3xl font-bold text-center text-violet-900 mb-4">${tournament.name}</h1>
                    
                    <div class="mb-4 flex justify-between items-center">
                        <button id="backToTournamentsBtn" 
                            class="p-4 text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md">
                            ← Back
                        </button>
                    </div>
                    
                    <div id="tournamentBracket" class="bg-white p-4 border-2 border-gray-900 rounded-lg shadow-md mb-6">
                        <!-- Tournament bracket will be generated here -->
                    </div>
                    
                    <div id="nextMatchContainer" class="text-center">
                        <h2 class="text-xl font-bold text-violet-900 mb-2">Next Match</h2>
                        <div id="nextMatchInfo" class="bg-white p-4 border-2 border-gray-900 rounded-lg shadow-md mb-4">
                            <div class="flex justify-center items-center space-x-4">
                                <span id="player1Name" class="text-lg font-semibold">Player 1</span>
                                <span class="text-xl font-bold text-violet-900">VS</span>
                                <span id="player2Name" class="text-lg font-semibold">Player 2</span>
                            </div>
                        </div>
                        <button id="playNextMatchBtn" 
                            class="p-4 text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-colors rounded-lg shadow-md">
                            Play Match
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    shadowRoot.appendChild(style);
    
    // Generate and display tournament bracket visual
    generateBracketVisual(shadowRoot, tournament);
    
    // Set up event listeners
    const backBtn = shadowRoot.getElementById('backToTournamentsBtn');
    backBtn?.addEventListener('click', () => {
        renderTournamentSetup(shadowRoot);
    });
    
    // Setup next match if available
    setupNextMatch(shadowRoot, tournament);
}

function generateBracketVisual(shadowRoot: ShadowRoot, tournament: TournamentInfo) {
    const bracketContainer = shadowRoot.getElementById('tournamentBracket');
    if (!bracketContainer) return;
    
    // Create a visual bracket representation
    bracketContainer.innerHTML = `
        <div class="flex flex-col items-center">
            <div class="w-full flex justify-between mb-6">
                <div class="w-5/12 bg-gray-100 p-3 rounded-lg border border-gray-300">
                    <h3 class="text-center font-bold text-lg">Semifinal 1</h3>
                    <div class="flex justify-between items-center mt-2">
                        <span id="semi1-player1" class="font-medium">${tournament.matches[0].player1}</span>
                        <span class="mx-2">vs</span>
                        <span id="semi1-player2" class="font-medium">${tournament.matches[0].player2}</span>
                        <span id="semi1-result" class="ml-2 text-violet-700 font-bold">${getMatchResult(tournament.matches[0])}</span>
                    </div>
                </div>
                <div class="w-5/12 bg-gray-100 p-3 rounded-lg border border-gray-300">
                    <h3 class="text-center font-bold text-lg">Semifinal 2</h3>
                    <div class="flex justify-between items-center mt-2">
                        <span id="semi2-player1" class="font-medium">${tournament.matches[1].player1}</span>
                        <span class="mx-2">vs</span>
                        <span id="semi2-player2" class="font-medium">${tournament.matches[1].player2}</span>
                        <span id="semi2-result" class="ml-2 text-violet-700 font-bold">${getMatchResult(tournament.matches[1])}</span>
                    </div>
                </div>
            </div>
            
            <div class="w-1/2 bg-gray-100 p-3 rounded-lg border border-gray-300">
                <h3 class="text-center font-bold text-lg text-violet-900">Final</h3>
                <div class="flex justify-between items-center mt-2">
                    <span id="final-player1" class="font-medium">${tournament.matches[2]?.player1 || "TBD"}</span>
                    <span class="mx-2">vs</span>
                    <span id="final-player2" class="font-medium">${tournament.matches[2]?.player2 || "TBD"}</span>
                    <span id="final-result" class="ml-2 text-violet-700 font-bold">${getMatchResult(tournament.matches[2])}</span>
                </div>
            </div>
            
            ${tournament.winner ? 
                `<div class="mt-6 bg-violet-100 p-4 rounded-lg border-2 border-violet-300">
                    <h2 class="text-xl font-bold text-violet-900 text-center">Tournament Winner: ${tournament.winner}</h2>
                </div>` : ''}
        </div>
    `;
}

function getMatchResult(match: any) {
    if (!match || !match.winner) return '';
    if (!match.score) return match.winner;
    return `${match.score.player1}-${match.score.player2}`;
}

function setupNextMatch(shadowRoot: ShadowRoot, tournament: TournamentInfo) {
    // Find next unplayed match
    const nextMatch = tournament.matches.find(match => !match.winner);
    const nextMatchContainer = shadowRoot.getElementById('nextMatchContainer');
    const player1NameElement = shadowRoot.getElementById('player1Name');
    const player2NameElement = shadowRoot.getElementById('player2Name');
    const playNextMatchBtn = shadowRoot.getElementById('playNextMatchBtn');
    
    if (!nextMatch || !nextMatchContainer || !player1NameElement || !player2NameElement || !playNextMatchBtn) {
        if (nextMatchContainer) nextMatchContainer.style.display = 'none';
        return;
    }
    
    // Check if it's a final and the players are still TBD
    if (nextMatch.id === 'final' && (nextMatch.player1 === 'TBD' || nextMatch.player2 === 'TBD')) {
        if (nextMatchContainer) nextMatchContainer.style.display = 'none';
        return;
    }
    
    // Show next match info
    nextMatchContainer.style.display = 'block';
    player1NameElement.textContent = nextMatch.player1;
    player2NameElement.textContent = nextMatch.player2;
    
    playNextMatchBtn.addEventListener('click', () => {
        // Start the match
        startTournamentMatch(shadowRoot, tournament, nextMatch);
    });
}

function startTournamentMatch(shadowRoot: ShadowRoot, tournament: TournamentInfo, match: any) {
    // Set up the game canvas for the match
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "./app/tailwind.css";
    
    shadowRoot.innerHTML = `
        <div class="flex h-screen">
            <div class="">
                <pong-menu></pong-menu>
            </div>
            <div class="grow flex flex-col items-center justify-center p-4">
                <div class="w-full max-w-4xl">
                    <div class="mb-4 text-center">
                        <h2 class="text-2xl font-bold text-violet-900">${tournament.name} - ${match.id.charAt(0).toUpperCase() + match.id.slice(1)}</h2>
                        <p class="text-lg font-semibold mt-2">
                            <span class="text-violet-700">${match.player1}</span>
                            <span class="mx-2">vs</span>
                            <span class="text-violet-700">${match.player2}</span>
                        </p>
                        <p class="mt-1 text-gray-600 text-sm">Press ENTER to start the game. First to 5 points wins!</p>
                    </div>
                    
                    <div class="relative w-full" style="padding-bottom: 62.5%;">
                        <canvas id="pong" width="800" height="500" 
                                class="absolute inset-0 w-full h-full border-4 border-gray-900 rounded-lg bg-gray-800 block shadow-lg object-contain">
                        </canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    shadowRoot.appendChild(style);
    
    // Set up the game
    setupTournamentGame(shadowRoot, tournament, match);
}

function setupTournamentGame(shadowRoot: ShadowRoot, tournament: TournamentInfo, match: any) {
    if (!shadowRoot) return;
    
    const canvas = shadowRoot.querySelector('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const gameState = createInitialGameState();
    const keysPressed: Record<string, boolean> = {};
    let gameStarted = false;
    let countdownActive = false;
    
    function checkScore() {
        if (gameState.ball.x <= 0) {
            gameState.scores.player2++;
            if (gameState.scores.player2 >= 4) {
                endTournamentMatch(match.player2);
            } else {
                resetBall(gameState, 0);
            }
        } else if (gameState.ball.x >= 800) {
            gameState.scores.player1++;
            if (gameState.scores.player1 >= 4) {
                endTournamentMatch(match.player1);
            } else {
                resetBall(gameState, 1);
            }
        }
    }

    function endTournamentMatch(winner: string) {
        gameState.running = false;
        showWinnerMessage(ctx, canvas, `${winner} Wins!`);
        
        // Record the match result
        match.winner = winner;
        match.score = {
            player1: gameState.scores.player1,
            player2: gameState.scores.player2
        };
        
        // Update the tournament structure
        updateTournamentProgress(tournament);
        saveTournament(tournament);
        
        // Return to tournament bracket after 3 seconds
        setTimeout(() => {
            renderTournamentBracket(shadowRoot, tournament);
        }, 3000);
    }
    
    const keydownHandler = (e: KeyboardEvent) => {
        keysPressed[e.key.toLowerCase()] = true;
        
        // Start game with Enter key
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
    
    // Show initial instructions
    showStartMessage(ctx, canvas);
    
    const draw = () => {
        if (!gameState.running) {
            window.removeEventListener('keydown', keydownHandler);
            window.removeEventListener('keyup', keyupHandler);
            return;
        }
        
        // Only update game if it has started
        if (gameStarted) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Reuse existing functions from game_utils
            handlePlayerMovement(gameState, keysPressed);
            updateBallPosition(gameState);
            checkPaddleCollisions(gameState);
            checkScore();
            
            // Custom rendering for tournament (adding player names)
            renderTournamentGame(ctx, gameState, match);
        }
        
        requestAnimationFrame(draw);
    };
    
    draw();

    // Return cleanup function
    return () => {
        window.removeEventListener('keydown', keydownHandler);
        window.removeEventListener('keyup', keyupHandler);
        gameState.running = false;
    };
}

function renderTournamentGame(ctx: CanvasRenderingContext2D, gameState: GameState, match: any) {
    // Clear canvas
    ctx.fillStyle = '#1e293b'; // Dark background
    ctx.fillRect(0, 0, 800, 500);
    
    // Draw center line
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 500);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw paddles and ball using existing game state
    renderLocalGame(ctx, gameState);
    
    // Add just player names above the scores (without repeating scores)
    ctx.font = '23px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${match.player1}: `, 110, 30);  // Just above the score
    ctx.fillText(`${match.player2}: `, 610, 30);  // Just above the score
}

// Helper functions
function generateBracket(players: string[]): any[] {
    // Shuffle players for random matchups in semifinals
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    
    return [
        // First semifinal
        {
            id: "semifinal1",
            player1: shuffledPlayers[0],
            player2: shuffledPlayers[1]
        },
        // Second semifinal
        {
            id: "semifinal2",
            player1: shuffledPlayers[2],
            player2: shuffledPlayers[3]
        },
        // Final (players will be filled in later)
        {
            id: "final",
            player1: "TBD",
            player2: "TBD"
        }
    ];
}

function updateTournamentProgress(tournament: TournamentInfo) {
    // Check if all semifinals are completed
    const semi1 = tournament.matches[0];
    const semi2 = tournament.matches[1];
    const final = tournament.matches[2];
    
    // Update final with semifinal winners
    if (semi1.winner && semi2.winner) {
        final.player1 = semi1.winner;
        final.player2 = semi2.winner;
    }
    
    // Check if final is completed
    if (final.winner) {
        tournament.winner = final.winner;
    }
}

function validateInput(text: string): boolean {
    // Permet només lletres i limita a 10 caràcters
    const regex = /^[a-zA-Z]{1,10}$/;
    return regex.test(text);
}

function saveTournament(tournament: TournamentInfo) {
    const tournaments = getSavedTournaments();
    
    // Check if tournament already exists
    const existingIndex = tournaments.findIndex(t => t.name === tournament.name);
    if (existingIndex !== -1) {
        // Update existing tournament
        tournaments[existingIndex] = tournament;
    } else {
        // Add new tournament
        tournaments.push(tournament);
    }
    
    localStorage.setItem('pongTournaments', JSON.stringify(tournaments));
}

function getSavedTournaments(): TournamentInfo[] {
    const tournamentsJSON = localStorage.getItem('pongTournaments');
    return tournamentsJSON ? JSON.parse(tournamentsJSON) : [];
}

function deleteTournament(tournamentName: string) {
    const tournaments = getSavedTournaments();
    const updatedTournaments = tournaments.filter(t => t.name !== tournamentName);
    localStorage.setItem('pongTournaments', JSON.stringify(updatedTournaments));
}