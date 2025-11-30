// Game State - Global Definition
// This file must be loaded before game.js and main-menu-functions.js

const gameState = {
    currentUser: null,
    currentUserId: null,  // Firebase UID
    character: null,
    hearts: 3,
    maxHearts: 3,
    xp: 0,
    playerLevel: 1,
    currentLevel: 1,
    playerPos: { x: 1, y: 1 },
    chests: [],  // Includes position AND opened state
    doorPos: null,
    doorUnlocked: false,
    currentPuzzle: null,
    currentChestIndex: null
};

// Grid size
const GRID_SIZE = 15;

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'php/'
    : 'php/';

// Level configuration
function getLevelConfig(level) {
    return {
        chestCount: level,
        gridSize: GRID_SIZE
    };
}
