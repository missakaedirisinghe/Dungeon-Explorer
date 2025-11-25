// Initialize
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
                    document.getElementById('menuAuthButtons').style.display = 'none';
                    document.getElementById('menuUserDisplay').style.display = 'flex';
                    document.getElementById('menuUsername').textContent = userData.username;
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        } else {
            // User is signed out
            document.getElementById('menuAuthButtons').style.display = 'flex';
            document.getElementById('menuUserDisplay').style.display = 'none';
        }
    });
}


// Main Menu Functions
function showMainMenu() {
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('characterScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'none';
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

// Update leaderboard preview on main menu
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

// Auth Functions
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

