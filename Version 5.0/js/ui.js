// Character Selection
function showCharacterSelection() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('characterScreen').style.display = 'block';
}

function selectCharacter(type) {
    type = type.trim();
    audioManager.play('click');
    document.querySelectorAll('.character-option').forEach(el => el.classList.remove('selected'));
    document.getElementById(type + 'Char').classList.add('selected');
    gameState.character = type;
    document.getElementById('startGameBtn').disabled = false;
}

async function startGame() {
    if (!gameState.character || !gameState.currentUserId) return;

    try {
        // Save character to Firestore
        await db.collection('users').doc(gameState.currentUserId).update({
            character: gameState.character
        });

        showGameScreen();
    } catch (error) {
        console.error('Set character error:', error);
        showGameScreen();
    }
}

function showGameScreen() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('characterScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';

    document.getElementById('playerName').textContent = gameState.currentUser;

    if (typeof initLevel === 'function') initLevel();
    updateUI();

    // Keyboard controls
    if (typeof handleKeyPress === 'function') {
        document.removeEventListener('keydown', handleKeyPress);
        document.addEventListener('keydown', handleKeyPress);
    }
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
    document.getElementById('xpToNext').textContent = Math.max(0, xpForNextLevel - gameState.xp);
}

function gameOver() {
    document.getElementById('finalLevel').textContent = gameState.currentLevel;
    document.getElementById('gameOverModal').classList.add('active');
    if (typeof saveProgress === 'function') saveProgress();
}

async function restartGame() {
    gameState.hearts = gameState.maxHearts;
    gameState.currentLevel = 1;
    gameState.xp = 0;
    gameState.playerLevel = 1;

    document.getElementById('gameOverModal').classList.remove('active');
    if (typeof initLevel === 'function') initLevel();
    updateUI();
    if (typeof saveProgress === 'function') await saveProgress();
}


function closeVictory() {
    document.getElementById('victoryModal').classList.remove('active');
}

function closeDeath() {
    document.getElementById('deathModal').classList.remove('active');
}

// Pause Menu Functions
let isPaused = false;

function togglePause() {

    const gameScreen = document.getElementById('gameScreen');
    const mainMenu = document.getElementById('mainMenu');
    const authScreen = document.getElementById('authScreen');

    if (!gameScreen || window.getComputedStyle(gameScreen).display === 'none') return;
    if (mainMenu && window.getComputedStyle(mainMenu).display !== 'none') return;
    if (authScreen && window.getComputedStyle(authScreen).display !== 'none') return;

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


function createParticles(x, y, isSuccess = true) {
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = isSuccess ? 'particle' : 'particle particle-fail';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.animationDelay = (i * 0.05) + 's';


        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 50 + Math.random() * 50;
        particle.style.setProperty('--tx', Math.cos(angle) * velocity + 'px');
        particle.style.setProperty('--ty', Math.sin(angle) * velocity + 'px');

        document.body.appendChild(particle);

        setTimeout(() => particle.remove(), 1000);
    }
}
