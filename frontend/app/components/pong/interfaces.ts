"use strict";

export interface Player {
    x: number;
    y: number;
    width: number;
    height: number;
    orientation: 'horizontal' | 'vertical';
}

export interface Ball {
    x: number;
    y: number;
    speedX: number;
    speedY: number;
}

export interface GameState {
    players: {
        player1: Player;
        player2: Player;
    };
    ball: Ball;
    scores: {
        player1: number;
        player2: number;
    };
    running: boolean;
}

export interface CrazyGameState {
    players: {
        left: Player;
        right: Player;
        top: Player;
        bottom: Player;
    };
    ball: Ball;
    lives: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    running: boolean;
    loser: 'left' | 'right' | 'top' | 'bottom' | null;
}

export type GameMode = 'local' | 'online' | 'ai' | 'crazy' | null;