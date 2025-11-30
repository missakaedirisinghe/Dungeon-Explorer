// Game Logic and Main Menu Functions Consolidated

// --- Main Menu Initialization ---

function init() {
    console.log('Game initializing with Firebase...');
    // Load leaderboard preview on main menu
    updateLeaderboardPreview();

    // Check if user is already logged in via Firebase auth state
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    gameState.currentUser = userData.username;
                    gameState.currentUserId = user.uid;
                    gameState.character = userData.character;

                    // Update menu UI to show logged-in state
                    const authButtons = document.getElementById('menuAuthButtons');
                    const userDisplay = document.getElementById('menuUserDisplay');
                    const menuUsername = document.getElementById('menuUsername');

                    if (authButtons) authButtons.style.display = 'none';
                    if (userDisplay) userDisplay.style.display = 'flex';
                    if (menuUsername) menuUsername.textContent = userData.username;
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        } else {
            // User is signed out
            const authButtons = document.getElementById('menuAuthButtons');
            const userDisplay = document.getElementById('menuUserDisplay');

            if (authButtons) authButtons.style.display = 'flex';
            if (userDisplay) userDisplay.style.display = 'none';
        }
    });

    // Setup global event listeners
    setupEventListeners();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

// --- Main Menu Navigation ---

function showMainMenu() {
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('characterScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'none';

    // Fix overlap issues
    document.getElementById('pauseOverlay').classList.remove('active');
    document.getElementById('leaderboardModal').classList.remove('active');
    document.getElementById('gameOverModal').classList.remove('active');
    document.getElementById('victoryModal').classList.remove('active');
    document.getElementById('deathModal').classList.remove('active');
    document.getElementById('puzzleModal').classList.remove('active');
}

function handleResumeGame() {
    // If not logged in, show login
    if (!gameState.currentUserId) {
        document.getElementById('mainMenu').style.display = 'none';
        showLogin();
        return;
    }

    // If logged in but no character, show character selection
    if (!gameState.character) {
        document.getElementById('mainMenu').style.display = 'none';
        showCharacterSelection();
        return;
    }

    // Load progress and start game
    loadProgress().then(() => {
        document.getElementById('mainMenu').style.display = 'none';
        showGameScreen();
    });
}

function handleNewGame() {
    // If not logged in, show signup
    if (!gameState.currentUserId) {
        document.getElementById('mainMenu').style.display = 'none';
        showSignup();
        return;
    }

    // Confirm restart
    if (confirm('Start a new game? Current progress will be reset.')) {
        gameState.hearts = gameState.maxHearts;
        gameState.currentLevel = 1;
        gameState.xp = 0;
        gameState.playerLevel = 1;
        document.getElementById('mainMenu').style.display = 'none';
        showCharacterSelection();
    }
}

async function updateLeaderboardPreview() {
    try {
        const snapshot = await db.collection('leaderboard')
            .orderBy('highestLevel', 'desc')
            .orderBy('totalXp', 'desc')
            .limit(5)
            .get();

        let html = '';
        snapshot.forEach((doc, index) => {
            const player = doc.data();
            html += `
                <tr class="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                    <td class="py-2 text-left text-yellow-500">#${index + 1}</td>
                    <td class="py-2 text-left">${player.username}</td>
                    <td class="py-2 text-right text-green-400">Lvl ${player.highestLevel}</td>
                </tr>
            `;
        });

        const leaderboardList = document.getElementById('menuLeaderboardList');
        if (leaderboardList) {
            leaderboardList.innerHTML = html || '<tr><td colspan="3" class="text-center py-4">No data yet</td></tr>';
        }
    } catch (error) {
        console.error('Leaderboard preview error:', error);
        const leaderboardList = document.getElementById('menuLeaderboardList');
        if (leaderboardList) {
            if (error.code === 'permission-denied') {
                leaderboardList.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-500">Login to view</td></tr>';
            } else {
                leaderboardList.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-red-400">Create indexes first</td></tr>';
            }
        }
    }
}

// --- Auth Functions ---

function showSignup() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('authScreen').style.display = 'block';
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('characterScreen').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('authMessage').textContent = '';
}

function showLogin() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('authScreen').style.display = 'block';
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('characterScreen').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('authMessage').textContent = '';
}

// Email validation function
function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
}

// Password validation function
function validatePasswordStrength() {
    const password = document.getElementById('signupPassword').value;
    const requirementsDiv = document.getElementById('passwordRequirements');

    if (password.length > 0) {
        requirementsDiv.style.display = 'block';
    } else {
        requirementsDiv.style.display = 'none';
        return;
    }

    const requirements = {
        length: password.length >= 12,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[!@#$%&*]/.test(password)
    };

    updateRequirement('req-length', requirements.length);
    updateRequirement('req-uppercase', requirements.uppercase);
    updateRequirement('req-lowercase', requirements.lowercase);
    updateRequirement('req-number', requirements.number);
    updateRequirement('req-symbol', requirements.symbol);

    return requirements;
}

function updateRequirement(elementId, isValid) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const icon = element.querySelector('.req-icon');

    if (isValid) {
        element.classList.add('valid');
        icon.textContent = '✓';
    } else {
        element.classList.remove('valid');
        icon.textContent = '✗';
    }
}

function checkPasswordStrength(password) {
    const requirements = {
        length: password.length >= 12,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[!@#$%&*]/.test(password)
    };

    return Object.values(requirements).every(req => req === true);
}

async function signup() {
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;

    if (!username || !email || !password) {
        document.getElementById('authMessage').textContent = 'Please fill all fields';
        document.getElementById('authMessage').className = 'text-red-400 text-xs mt-4 text-center';
        return;
    }

    if (!validateEmail(email)) {
        document.getElementById('authMessage').textContent = 'Please enter a valid email address';
        document.getElementById('authMessage').className = 'text-red-400 text-xs mt-4 text-center';
        return;
    }

    if (!checkPasswordStrength(password)) {
        document.getElementById('authMessage').textContent = 'Password does not meet all requirements';
        document.getElementById('authMessage').className = 'text-red-400 text-xs mt-4 text-center';
        return;
    }

    if (password !== passwordConfirm) {
        document.getElementById('authMessage').textContent = 'Passwords do not match';
        document.getElementById('authMessage').className = 'text-red-400 text-xs mt-4 text-center';
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            character: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await user.sendEmailVerification();

        document.getElementById('authMessage').textContent = 'Account created! Verification email sent.';
        document.getElementById('authMessage').className = 'text-green-400 text-xs mt-4 text-center';

        setTimeout(() => {
            showLogin();
            document.getElementById('loginEmail').value = email;
        }, 2000);
    } catch (error) {
        console.error('Signup error:', error);
        let errorMessage = 'Signup failed';

        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Email already in use';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak';
        }

        document.getElementById('authMessage').textContent = errorMessage;
        document.getElementById('authMessage').className = 'text-red-400 text-xs mt-4 text-center';
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        document.getElementById('authMessage').textContent = 'Please fill all fields';
        document.getElementById('authMessage').className = 'text-red-400 text-xs mt-4 text-center';
        return;
    }

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        const userDoc = await db.collection('users').doc(user.uid).get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            gameState.currentUser = userData.username;
            gameState.currentUserId = user.uid;
            localStorage.setItem('currentUserId', user.uid);

            if (userData.character) {
                gameState.character = userData.character;
                await loadProgress();
                showGameScreen();
            } else {
                showCharacterSelection();
            }
        } else {
            document.getElementById('authMessage').textContent = 'User data not found';
            document.getElementById('authMessage').className = 'text-red-400 text-xs mt-4 text-center';
        }
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Invalid credentials';

        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'Account has been disabled';
        }

        document.getElementById('authMessage').textContent = errorMessage;
        document.getElementById('authMessage').className = 'text-red-400 text-xs mt-4 text-center';
    }
}

async function logout() {
    await saveProgress();

    try {
        await auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
    }

    localStorage.removeItem('currentUserId');
    location.reload();
}

async function forgotPassword() {
    const email = prompt('Enter your email address:');
    if (!email) return;

    try {
        await auth.sendPasswordResetEmail(email);
        alert('Password reset email sent! Please check your inbox.');
    } catch (error) {
        console.error('Password reset error:', error);
        let errorMessage = 'Failed to send reset email';

        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address';
        }

        alert(errorMessage);
    }
}

// --- Character Selection ---

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
    if (!gameState.character || !gameState.currentUserId) return;

    try {
        await db.collection('users').doc(gameState.currentUserId).update({
            character: gameState.character
        });

        showGameScreen();
    } catch (error) {
        console.error('Set character error:', error);
        showGameScreen();
    }
}

// --- Game Logic ---

function showGameScreen() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('characterScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';

    document.getElementById('playerName').textContent = gameState.currentUser;

    initLevel();
    updateUI();
}

function initLevel() {
    const config = getLevelConfig(gameState.currentLevel);

    gameState.doorUnlocked = false;
    gameState.chests = [];
    const maxAttempts = 100;

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

            if (attempts > maxAttempts) break;
        } while (isPositionOccupied(pos) && attempts < maxAttempts);

        if (attempts < maxAttempts) {
            gameState.chests.push(pos);
        }
    }

    let doorAttempts = 0;
    do {
        gameState.doorPos = {
            x: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2,
            y: Math.floor(Math.random() * (GRID_SIZE - 4)) + 2
        };
        doorAttempts++;

        if (doorAttempts > maxAttempts) {
            gameState.doorPos = { x: GRID_SIZE - 2, y: GRID_SIZE - 2 };
            break;
        }
    } while (isPositionOccupied(gameState.doorPos) && doorAttempts < maxAttempts);

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

            if (x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1) {
                cell.classList.add('wall');
            } else {
                cell.classList.add('floor');
            }

            if (x === gameState.playerPos.x && y === gameState.playerPos.y) {
                const player = document.createElement('div');
                player.className = 'player';
                player.textContent = gameState.character === 'male' ? '🧙‍♂️' : '🧙‍♀️';
                player.style.fontSize = '28px';
                cell.appendChild(player);
            }

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

    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': newY--; break;
        case 'ArrowDown': case 's': case 'S': newY++; break;
        case 'ArrowLeft': case 'a': case 'A': newX--; break;
        case 'ArrowRight': case 'd': case 'D': newX++; break;
        default: return;
    }

    e.preventDefault();

    if (newX <= 0 || newX >= GRID_SIZE - 1 || newY <= 0 || newY >= GRID_SIZE - 1) return;

    for (let i = 0; i < gameState.chests.length; i++) {
        const chest = gameState.chests[i];
        if (chest.x === newX && chest.y === newY) {
            if (!chest.opened) {
                openChest(i);
            }
            return;
        }
    }

    if (gameState.doorPos && gameState.doorPos.x === newX && gameState.doorPos.y === newY) {
        if (gameState.doorUnlocked) {
            nextLevel();
        }
        return;
    }

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
    document.getElementById('puzzleLoading').style.display = 'block';
    document.getElementById('puzzleImage').style.display = 'none';
    document.getElementById('puzzleQuestion').textContent = 'Loading puzzle...';

    try {
        const response = await fetch(API_BASE_URL + 'banana_api.php');
        const data = await response.json();

        if (data.fallback) {
            generateMathPuzzle();
        } else {
            gameState.currentPuzzle = {
                question: data.question,
                answer: data.solution.toString(),
                imageUrl: data.question
            };

            const puzzleImage = document.getElementById('puzzleImage');
            puzzleImage.src = data.question;
            puzzleImage.onload = () => {
                document.getElementById('puzzleLoading').style.display = 'none';
                puzzleImage.style.display = 'block';
            };
            puzzleImage.onerror = () => {
                generateMathPuzzle();
            };

            document.getElementById('puzzleQuestion').textContent = 'What number do you see?';
        }

    } catch (error) {
        console.error('Banana API error:', error);
        generateMathPuzzle();
    }
}

function generateMathPuzzle() {
    const operations = ['+', '-', '*'];
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operation = operations[Math.floor(Math.random() * operations.length)];

    let answer;
    switch (operation) {
        case '+': answer = num1 + num2; break;
        case '-': answer = num1 - num2; break;
        case '*': answer = num1 * num2; break;
    }

    gameState.currentPuzzle = {
        question: `What is ${num1} ${operation} ${num2}?`,
        answer: answer.toString()
    };

    document.getElementById('puzzleLoading').style.display = 'none';
    document.getElementById('puzzleImage').style.display = 'none';
    document.getElementById('puzzleQuestion').textContent = gameState.currentPuzzle.question;
}

async function submitPuzzle() {
    const answer = document.getElementById('puzzleAnswer').value.trim();

    if (answer === gameState.currentPuzzle.answer) {
        gameState.chests[gameState.currentChestIndex].opened = true;
        gameState.xp += 50;

        const xpForNextLevel = gameState.playerLevel * 100;
        if (gameState.xp >= xpForNextLevel) {
            gameState.xp -= xpForNextLevel;
            gameState.playerLevel++;
        }

        if (gameState.chests.every(chest => chest.opened)) {
            gameState.doorUnlocked = true;
        }

        closePuzzle();
        document.getElementById('victoryModal').classList.add('active');
        renderDungeon();
        updateUI();
        await saveProgress();
    } else {
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
    gameState.hearts = gameState.maxHearts;
    showLevelTransition(gameState.currentLevel);

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
    let heartsHTML = '';
    for (let i = 0; i < gameState.maxHearts; i++) {
        if (i < gameState.hearts) {
            heartsHTML += '<span class="heart">❤️</span>';
        } else {
            heartsHTML += '<span class="heart" style="opacity:0.3">🖤</span>';
        }
    }
    document.getElementById('hearts').innerHTML = heartsHTML;

    document.getElementById('currentLevel').textContent = gameState.currentLevel;
    document.getElementById('xpDisplay').textContent = gameState.xp;
    document.getElementById('playerLevel').textContent = gameState.playerLevel;

    const xpForNextLevel = gameState.playerLevel * 100;
    const xpProgress = (gameState.xp / xpForNextLevel) * 100;
    document.getElementById('xpBar').style.width = xpProgress + '%';
    document.getElementById('xpToNext').textContent = xpForNextLevel - gameState.xp;
}

// --- Persistence ---

async function saveProgress() {
    if (!gameState.currentUserId) return;

    const progressData = {
        hearts: gameState.hearts,
        xp: gameState.xp,
        playerLevel: gameState.playerLevel,
        currentLevel: gameState.currentLevel,
        character: gameState.character,
        chests: gameState.chests,
        doorUnlocked: gameState.doorUnlocked,
        playerPos: gameState.playerPos,
        doorPos: gameState.doorPos,
        lastSaved: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('userProgress').doc(gameState.currentUserId).set(progressData);

        const totalXp = (gameState.playerLevel - 1) * 100 + gameState.xp;
        await db.collection('leaderboard').doc(gameState.currentUserId).set({
            username: gameState.currentUser,
            highestLevel: gameState.currentLevel,
            totalXp: totalXp,
            playerLevel: gameState.playerLevel,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Save progress error:', error);
    }
}

async function loadProgress() {
    if (!gameState.currentUserId) return;

    try {
        const doc = await db.collection('userProgress').doc(gameState.currentUserId).get();

        if (doc.exists) {
            const data = doc.data();
            gameState.hearts = data.hearts || 3;
            gameState.xp = data.xp || 0;
            gameState.playerLevel = data.playerLevel || 1;
            gameState.currentLevel = data.currentLevel || 1;
            gameState.chests = data.chests || [];
            gameState.doorUnlocked = data.doorUnlocked || false;
            gameState.playerPos = data.playerPos || { x: 1, y: 1 };
            gameState.doorPos = data.doorPos || null;
        }
    } catch (error) {
        console.error('Load progress error:', error);
    }
}

async function showLeaderboard() {
    await updateLeaderboard();
    document.getElementById('leaderboardModal').classList.add('active');
}

function closeLeaderboard() {
    document.getElementById('leaderboardModal').classList.remove('active');
}

async function updateLeaderboard() {
    try {
        const levelSnapshot = await db.collection('leaderboard')
            .orderBy('highestLevel', 'desc')
            .orderBy('totalXp', 'desc')
            .limit(10)
            .get();

        let levelHTML = '';
        levelSnapshot.forEach((doc, index) => {
            const player = doc.data();
            levelHTML += `
                <tr style="${player.username === gameState.currentUser ? 'background:#3a3a5e;' : ''}">
                    <td>${index + 1}</td>
                    <td>${player.username}</td>
                    <td>${player.highestLevel}</td>
                    <td>${player.totalXp}</td>
                </tr>
            `;
        });
        document.getElementById('levelLeaderboard').innerHTML = levelHTML || '<tr><td colspan="4">No data yet</td></tr>';

        const xpSnapshot = await db.collection('leaderboard')
            .orderBy('totalXp', 'desc')
            .limit(10)
            .get();

        let xpHTML = '';
        xpSnapshot.forEach((doc, index) => {
            const player = doc.data();
            xpHTML += `
                <tr style="${player.username === gameState.currentUser ? 'background:#3a3a5e;' : ''}">
                    <td>${index + 1}</td>
                    <td>${player.username}</td>
                    <td>${player.playerLevel}</td>
                    <td>${player.totalXp}</td>
                </tr>
            `;
        });
        document.getElementById('xpLeaderboard').innerHTML = xpHTML || '<tr><td colspan="4">No data yet</td></tr>';
    } catch (error) {
        console.error('Leaderboard error:', error);
    }
}

// --- Effects ---

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

// --- Pause Menu ---

let isPaused = false;

function togglePause() {
    // Only allow pause when actively in game
    const gameScreen = document.getElementById('gameScreen');

    // Game screen must exist and be visible
    if (!gameScreen) {
        console.log('Pause blocked: gameScreen not found');
        return;
    }

    const gameScreenDisplay = window.getComputedStyle(gameScreen).display;
    if (gameScreenDisplay === 'none') {
        console.log('Pause blocked: gameScreen is hidden');
        return;
    }

    // Additionally check that gameScreen is actually the visible screen
    // by checking if other screens are hidden
    const mainMenu = document.getElementById('mainMenu');
    const authScreen = document.getElementById('authScreen');
    const characterScreen = document.getElementById('characterScreen');

    const mainMenuDisplay = mainMenu ? window.getComputedStyle(mainMenu).display : 'none';
    const authScreenDisplay = authScreen ? window.getComputedStyle(authScreen).display : 'none';
    const characterScreenDisplay = characterScreen ? window.getComputedStyle(characterScreen).display : 'none';

    console.log('Display states:', {
        gameScreen: gameScreenDisplay,
        mainMenu: mainMenuDisplay,
        authScreen: authScreenDisplay,
        characterScreen: characterScreenDisplay
    });

    // If any other screen is visible, don't allow pause
    if (mainMenuDisplay !== 'none') {
        console.log('Pause blocked: Main menu is visible');
        return;
    }
    if (authScreenDisplay !== 'none') {
        console.log('Pause blocked: Auth screen is visible');
        return;
    }
    if (characterScreenDisplay !== 'none') {
        console.log('Pause blocked: Character screen is visible');
        return;
    }

    console.log('Toggling pause - all checks passed');
    isPaused = !isPaused;
    document.getElementById('pauseOverlay').classList.toggle('active', isPaused);
}

function resumeGame() {
    isPaused = false;
    document.getElementById('pauseOverlay').classList.remove('active');
}

// --- Event Listeners ---

function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        // ESC for pause
        if (e.key === 'Escape') {
            togglePause();
        }
        // Game movement
        if (document.getElementById('gameScreen').style.display !== 'none') {
            handleKeyPress(e);
        }
    });

    // Puzzle answer submission
    const puzzleAnswerInput = document.getElementById('puzzleAnswer');
    if (puzzleAnswerInput) {
        puzzleAnswerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitPuzzle();
            }
        });
    }
}
