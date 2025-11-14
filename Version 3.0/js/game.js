// Game State
let gameState = {
    currentUser: null,
    character: null,
    hearts: 3,
    maxHearts: 3,
    xp: 0,
    playerLevel: 1,
    currentLevel: 1,
    playerPos: { x: 1, y: 1 },
    chests: [],
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

// Initialize - Simple version
function init() {
    console.log('Game initializing...');
    // Auth screen is visible by default, no auto-login
}

// Auth Functions
function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('authMessage').textContent = '';
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('authMessage').textContent = '';
}

async function signup() {
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
    
    if (!username || !password) {
        document.getElementById('authMessage').textContent = 'Please fill all fields';
        return;
    }
    
    if (password !== passwordConfirm) {
        document.getElementById('authMessage').textContent = 'Passwords do not match';
        return;
    }
    
    try {
        const response = await fetch(API_BASE_URL + 'signup.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('authMessage').textContent = 'Account created! Please login.';
            document.getElementById('authMessage').className = 'text-green-400 text-xs mt-4 text-center';
            
            setTimeout(() => {
                showLogin();
                document.getElementById('loginUsername').value = username;
            }, 1500);
        } else {
            document.getElementById('authMessage').textContent = data.message || 'Signup failed';
            document.getElementById('authMessage').className = 'text-red-400 text-xs mt-4 text-center';
        }
    } catch (error) {
        console.error('Signup error:', error);
        document.getElementById('authMessage').textContent = 'Error connecting to server';
    }
}

async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(API_BASE_URL + 'login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            gameState.currentUser = username;
            localStorage.setItem('currentUser', username);
            
            if (data.character) {
                gameState.character = data.character;
                await loadProgress();
                showGameScreen();
            } else {
                showCharacterSelection();
            }
        } else {
            document.getElementById('authMessage').textContent = data.message || 'Invalid credentials';
            document.getElementById('authMessage').className = 'text-red-400 text-xs mt-4 text-center';
        }
    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('authMessage').textContent = 'Error connecting to server';
    }
}

async function logout() {
    await saveProgress();
    
    try {
        await fetch(API_BASE_URL + 'logout.php', {
            method: 'POST'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    localStorage.removeItem('currentUser');
    location.reload();
}

async function loadUserSession() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        gameState.currentUser = currentUser;
        
        try {
            const response = await fetch(API_BASE_URL + 'check_session.php');
            const data = await response.json();
            
            if (data.success && data.character) {
                gameState.character = data.character;
                await loadProgress();
                showGameScreen();
            } else if (data.success) {
                showCharacterSelection();
            } else {
                localStorage.removeItem('currentUser');
            }
        } catch (error) {
            console.error('Session check error:', error);
        }
    }
}

// Character Selection
function showCharacterSelection() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('characterScreen').style.display = 'block';
}

function selectCharacter(type) {
    document.querySelectorAll('.character-option').forEach(el => el.classList.remove('selected'));
    document.getElementById(type + 'Char').classList.add('selected');
    gameState.character = type;
    document.getElementById('startGameBtn').disabled = false;
}

async function startGame() {
    if (!gameState.character) return;
    
    try {
        const response = await fetch(API_BASE_URL + 'set_character.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ character: gameState.character })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showGameScreen();
        }
    } catch (error) {
        console.error('Set character error:', error);
        showGameScreen(); // Continue anyway
    }
}

function showGameScreen() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('characterScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    
    document.getElementById('playerName').textContent = gameState.currentUser;
    
    initLevel();
    updateUI();
    
    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);
}

// Game Logic
function initLevel() {
    const config = getLevelConfig(gameState.currentLevel);
    
    // Reset door state
    gameState.doorUnlocked = false;
    
    // Generate chest positions with safety limit
    gameState.chests = [];
    const maxAttempts = 100; // Prevent infinite loops
    
    for (let i = 0; i < config.chestCount; i++) {
        let attempts = 0;
        let pos;
        
        do {
            pos = {
                x: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2,
                y: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2,
                opened: false
            };
            attempts++;
            
            if (attempts > maxAttempts) {
                console.error('Could not place chest', i);
                break;
            }
        } while (isPositionOccupied(pos) && attempts < maxAttempts);
        
        if (attempts < maxAttempts) {
            gameState.chests.push(pos);
        }
    }
    
    // Generate door position with safety limit
    let doorAttempts = 0;
    do {
        gameState.doorPos = {
            x: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2,
            y: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2
        };
        doorAttempts++;
        
        if (doorAttempts > maxAttempts) {
            // Fallback position
            gameState.doorPos = { x: GRID_SIZE - 2, y: GRID_SIZE - 2 };
            break;
        }
    } while (isPositionOccupied(gameState.doorPos) && doorAttempts < maxAttempts);
    
    // Reset player position
    gameState.playerPos = { x: 1, y: 1 };
    
    renderDungeon();
}

function isPositionOccupied(pos) {
    if (pos.x === gameState.playerPos.x && pos.y === gameState.playerPos.y) return true;
    if (gameState.doorPos && pos.x === gameState.doorPos.x && pos.y === gameState.doorPos.y) return true;
    for (let chest of gameState.chests) {
        if (chest.x === pos.x && chest.y === pos.y) return true;
    }
    return false;
}

function renderDungeon() {
    const grid = document.getElementById('dungeonGrid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 40px)`;
    grid.style.gridTemplateRows = `repeat(${GRID_SIZE}, 40px)`;
    
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            // Walls on edges
            if (x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1) {
                cell.classList.add('wall');
            } else {
                cell.classList.add('floor');
            }
            
            // Player
            if (x === gameState.playerPos.x && y === gameState.playerPos.y) {
                const player = document.createElement('div');
                player.className = 'player';
                player.textContent = gameState.character === 'male' ? '🧙‍♂️' : '🧙‍♀️';
                player.style.fontSize = '28px';
                cell.appendChild(player);
            }
            
            // Chests
            gameState.chests.forEach(chest => {
                if (chest.x === x && chest.y === y) {
                    const chestEl = document.createElement('div');
                    chestEl.className = 'chest';
                    if (chest.opened) {
                        chestEl.classList.add('chest-open');
                        const tick = document.createElement('div');
                        tick.className = 'chest-tick';
                        tick.textContent = '✓';
                        cell.appendChild(tick);
                    }
                    cell.appendChild(chestEl);
                }
            });
            
            // Door
            if (gameState.doorPos && gameState.doorPos.x === x && gameState.doorPos.y === y) {
                const door = document.createElement('div');
                door.className = 'door';
                if (!gameState.doorUnlocked) {
                    door.classList.add('door-locked');
                }
                cell.appendChild(door);
            }
            
            grid.appendChild(cell);
        }
    }
}

function handleKeyPress(e) {
    if (document.querySelector('.modal.active')) return;
    
    let newX = gameState.playerPos.x;
    let newY = gameState.playerPos.y;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            newY--;
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            newY++;
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            newX--;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            newX++;
            break;
        default:
            return;
    }
    
    e.preventDefault();
    
    // Check boundaries
    if (newX <= 0 || newX >= GRID_SIZE - 1 || newY <= 0 || newY >= GRID_SIZE - 1) {
        return;
    }
    
    // Check chest collision
    for (let i = 0; i < gameState.chests.length; i++) {
        const chest = gameState.chests[i];
        if (chest.x === newX && chest.y === newY) {
            if (!chest.opened) {
                openChest(i);
            }
            return;
        }
    }
    
    // Check door collision
    if (gameState.doorPos && gameState.doorPos.x === newX && gameState.doorPos.y === newY) {
        if (gameState.doorUnlocked) {
            nextLevel();
        }
        return;
    }
    
    // Move player
    gameState.playerPos.x = newX;
    gameState.playerPos.y = newY;
    renderDungeon();
}

function openChest(index) {
    gameState.currentChestIndex = index;
    generatePuzzle();
    document.getElementById('puzzleModal').classList.add('active');
    document.getElementById('puzzleAnswer').value = '';
    document.getElementById('puzzleAnswer').focus();
}

async function generatePuzzle() {
    // Show loading spinner
    document.getElementById('puzzleLoading').style.display = 'block';
    document.getElementById('puzzleImage').style.display = 'none';
    document.getElementById('puzzleQuestion').textContent = 'Loading puzzle...';
    
    try {
        // Call Banana API
        const response = await fetch('http://marcconrad.com/uob/banana/api.php?out=json&base64=no');
        const data = await response.json();
        
        // Store puzzle data
        gameState.currentPuzzle = {
            question: data.question,
            answer: data.solution.toString(),
            imageUrl: data.question
        };
        
        // Display the puzzle image
        const puzzleImage = document.getElementById('puzzleImage');
        puzzleImage.src = data.question;
        puzzleImage.onload = () => {
            document.getElementById('puzzleLoading').style.display = 'none';
            puzzleImage.style.display = 'block';
        };
        
        document.getElementById('puzzleQuestion').textContent = 'What number do you see?';
        
    } catch (error) {
        console.error('Banana API error:', error);
        // Fallback to math puzzle
        const operations = ['+', '-', '*'];
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;
        const operation = operations[Math.floor(Math.random() * operations.length)];
        
        let answer;
        switch(operation) {
            case '+':
                answer = num1 + num2;
                break;
            case '-':
                answer = num1 - num2;
                break;
            case '*':
                answer = num1 * num2;
                break;
        }
        
        gameState.currentPuzzle = {
            question: `What is ${num1} ${operation} ${num2}?`,
            answer: answer.toString()
        };
        
        document.getElementById('puzzleLoading').style.display = 'none';
        document.getElementById('puzzleImage').style.display = 'none';
        document.getElementById('puzzleQuestion').textContent = gameState.currentPuzzle.question;
    }
}

async function submitPuzzle() {
    const answer = document.getElementById('puzzleAnswer').value.trim();
    
    if (answer === gameState.currentPuzzle.answer) {
        // Correct answer
        gameState.chests[gameState.currentChestIndex].opened = true;
        gameState.xp += 50;
        
        // Check level up
        const xpForNextLevel = gameState.playerLevel * 100;
        if (gameState.xp >= xpForNextLevel) {
            gameState.xp -= xpForNextLevel;
            gameState.playerLevel++;
        }
        
        // Check if all chests are opened
        if (gameState.chests.every(chest => chest.opened)) {
            gameState.doorUnlocked = true;
        }
        
        closePuzzle();
        document.getElementById('victoryModal').classList.add('active');
        renderDungeon();
        updateUI();
        await saveProgress();
    } else {
        // Wrong answer
        gameState.hearts--;
        closePuzzle();
        
        document.getElementById('correctAnswer').textContent = gameState.currentPuzzle.answer;
        document.getElementById('deathModal').classList.add('active');
        
        updateUI();
        await saveProgress();
        
        if (gameState.hearts <= 0) {
            setTimeout(() => {
                closeDeath();
                gameOver();
            }, 2000);
        }
    }
}

function closePuzzle() {
    document.getElementById('puzzleModal').classList.remove('active');
}

function closeVictory() {
    document.getElementById('victoryModal').classList.remove('active');
}

function closeDeath() {
    document.getElementById('deathModal').classList.remove('active');
}

async function nextLevel() {
    gameState.currentLevel++;
    gameState.hearts = gameState.maxHearts; // Restore hearts
    
    // Show level transition
    showLevelTransition(gameState.currentLevel);
    
    // Wait a bit before initializing new level
    setTimeout(() => {
        initLevel();
        updateUI();
    }, 500);
    
    await saveProgress();
}

function gameOver() {
    document.getElementById('finalLevel').textContent = gameState.currentLevel;
    document.getElementById('gameOverModal').classList.add('active');
    saveProgress();
}

async function restartGame() {
    gameState.hearts = gameState.maxHearts;
    gameState.currentLevel = 1;
    gameState.xp = 0;
    gameState.playerLevel = 1;
    
    document.getElementById('gameOverModal').classList.remove('active');
    initLevel();
    updateUI();
    await saveProgress();
}

function updateUI() {
    // Hearts
    let heartsHTML = '';
    for (let i = 0; i < gameState.maxHearts; i++) {
        if (i < gameState.hearts) {
            heartsHTML += '<span class="heart">❤️</span>';
        } else {
            heartsHTML += '<span class="heart" style="opacity:0.3">🖤</span>';
        }
    }
    document.getElementById('hearts').innerHTML = heartsHTML;
    
    // Level and XP
    document.getElementById('currentLevel').textContent = gameState.currentLevel;
    document.getElementById('xpDisplay').textContent = gameState.xp;
    document.getElementById('playerLevel').textContent = gameState.playerLevel;
    
    // XP Progress Bar
    const xpForNextLevel = gameState.playerLevel * 100;
    const xpProgress = (gameState.xp / xpForNextLevel) * 100;
    document.getElementById('xpBar').style.width = xpProgress + '%';
    document.getElementById('xpToNext').textContent = xpForNextLevel - gameState.xp;
}

// Save/Load Progress
async function saveProgress() {
    if (!gameState.currentUser) return;
    
    const progressData = {
        hearts: gameState.hearts,
        xp: gameState.xp,
        playerLevel: gameState.playerLevel,
        currentLevel: gameState.currentLevel,
        character: gameState.character
    };
    
    try {
        await fetch(API_BASE_URL + 'save_progress.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(progressData)
        });
    } catch (error) {
        console.error('Save progress error:', error);
    }
}

async function loadProgress() {
    if (!gameState.currentUser) return;
    
    try {
        const response = await fetch(API_BASE_URL + 'load_progress.php');
        const data = await response.json();
        
        if (data.success && data.progress) {
            gameState.hearts = data.progress.hearts || 3;
            gameState.xp = data.progress.xp || 0;
            gameState.playerLevel = data.progress.playerLevel || 1;
            gameState.currentLevel = data.progress.currentLevel || 1;
        }
    } catch (error) {
        console.error('Load progress error:', error);
    }
}

// Leaderboard
async function showLeaderboard() {
    await updateLeaderboard();
    document.getElementById('leaderboardModal').classList.add('active');
}

function closeLeaderboard() {
    document.getElementById('leaderboardModal').classList.remove('active');
}

async function updateLeaderboard() {
    try {
        const response = await fetch(API_BASE_URL + 'leaderboard.php');
        const data = await response.json();
        
        if (data.success) {
            // Level Leaderboard
            let levelHTML = '';
            data.levelLeaderboard.slice(0, 10).forEach((player, index) => {
                levelHTML += `
                    <tr style="${player.username === gameState.currentUser ? 'background:#3a3a5e;' : ''}">
                        <td>${index + 1}</td>
                        <td>${player.username}</td>
                        <td>${player.highest_level}</td>
                        <td>${player.total_xp}</td>
                    </tr>
                `;
            });
            document.getElementById('levelLeaderboard').innerHTML = levelHTML || '<tr><td colspan="4">No data yet</td></tr>';
            
            // XP Leaderboard
            let xpHTML = '';
            data.xpLeaderboard.slice(0, 10).forEach((player, index) => {
                xpHTML += `
                    <tr style="${player.username === gameState.currentUser ? 'background:#3a3a5e;' : ''}">
                        <td>${index + 1}</td>
                        <td>${player.username}</td>
                        <td>${player.player_level}</td>
                        <td>${player.total_xp}</td>
                    </tr>
                `;
            });
            document.getElementById('xpLeaderboard').innerHTML = xpHTML || '<tr><td colspan="4">No data yet</td></tr>';
        }
    } catch (error) {
        console.error('Leaderboard error:', error);
    }
}

// Particle Effects
function createParticles(x, y, isSuccess = true) {
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = isSuccess ? 'particle' : 'particle particle-fail';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.animationDelay = (i * 0.05) + 's';
        
        // Random direction
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 50 + Math.random() * 50;
        particle.style.setProperty('--tx', Math.cos(angle) * velocity + 'px');
        particle.style.setProperty('--ty', Math.sin(angle) * velocity + 'px');
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1000);
    }
}

// Pause Menu Functions
let isPaused = false;

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pauseOverlay').classList.toggle('active', isPaused);
}

function resumeGame() {
    isPaused = false;
    document.getElementById('pauseOverlay').classList.remove('active');
}

// Level Transition Effect
function showLevelTransition(level) {
    const transition = document.createElement('div');
    transition.className = 'level-transition';
    const text = document.createElement('div');
    text.className = 'level-transition-text';
    text.textContent = `Level ${level}`;
    transition.appendChild(text);
    document.body.appendChild(transition);
    
    setTimeout(() => transition.remove(), 1500);
}

// Enhanced keyboard controls
document.addEventListener('keydown', (e) => {
    // ESC for pause
    if (e.key === 'Escape' && document.getElementById('gameScreen').style.display !== 'none') {
        if (!document.querySelector('.modal.active')) {
            togglePause();
        }
    }
});

// Puzzle answer submission with Enter key
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const puzzleAnswerInput = document.getElementById('puzzleAnswer');
        if (puzzleAnswerInput) {
            puzzleAnswerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    submitPuzzle();
                }
            });
        }
    });
} else {
    const puzzleAnswerInput = document.getElementById('puzzleAnswer');
    if (puzzleAnswerInput) {
        puzzleAnswerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitPuzzle();
            }
        });
    }
}

// Wait for DOM to be ready before initializing
window.addEventListener('DOMContentLoaded', init);