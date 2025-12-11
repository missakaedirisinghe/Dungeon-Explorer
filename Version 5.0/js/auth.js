// Authentication Functions

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

    if (password !== passwordConfirm) {
        document.getElementById('authMessage').textContent = 'Passwords do not match';
        document.getElementById('authMessage').className = 'text-red-400 text-xs mt-4 text-center';
        return;
    }

    // Validate password strength
    const passwordRequirements = {
        length: password.length >= 12,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[!@#$%&*]/.test(password)
    };

    if (!passwordRequirements.length) {
        document.getElementById('authMessage').textContent = 'Password must be at least 12 characters';
        document.getElementById('authMessage').className = 'text-red-400 text-xs mt-4 text-center';
        return;
    }

    if (!passwordRequirements.uppercase) {
        document.getElementById('authMessage').textContent = 'Password must contain at least one uppercase letter';
        document.getElementById('authMessage').className = 'text-red-400 text-xs mt-4 text-center';
        return;
    }

    if (!passwordRequirements.lowercase) {
        document.getElementById('authMessage').textContent = 'Password must contain at least one lowercase letter';
        document.getElementById('authMessage').className = 'text-red-400 text-xs mt-4 text-center';
        return;
    }

    if (!passwordRequirements.number) {
        document.getElementById('authMessage').textContent = 'Password must contain at least one number';
        document.getElementById('authMessage').className = 'text-red-400 text-xs mt-4 text-center';
        return;
    }

    if (!passwordRequirements.symbol) {
        document.getElementById('authMessage').textContent = 'Password must contain at least one symbol (!, @, #, $, %, &, *)';
        document.getElementById('authMessage').className = 'text-red-400 text-xs mt-4 text-center';
        return;
    }

    try {
        // Create Firebase user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;


        await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            character: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Send email verification
        await user.sendEmailVerification();

        document.getElementById('authMessage').textContent = 'Account created! Verification email sent.';
        document.getElementById('authMessage').className = 'text-green-400 text-xs mt-4 text-center';

        setTimeout(() => {
            if (typeof showLogin === 'function') {
                showLogin();
            }
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
        // Sign in with Firebase
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

async function loadUserSession() {
    const currentUserId = localStorage.getItem('currentUserId');
    if (currentUserId) {
        try {
            const userDoc = await db.collection('users').doc(currentUserId).get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                gameState.currentUser = userData.username;
                gameState.currentUserId = currentUserId;

                if (userData.character) {
                    gameState.character = userData.character;
                    await loadProgress();

                } else {
                    showCharacterSelection();
                }
            } else {
                localStorage.removeItem('currentUserId');
            }
        } catch (error) {
            console.error('Session check error:', error);
        }
    }
}

// Password Strength Validation
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


    return Object.values(requirements).every(req => req === true);
}

function updateRequirement(elementId, isValid) {
    const element = document.getElementById(elementId);
    const icon = element.querySelector('.req-icon');

    if (isValid) {
        element.classList.add('valid');
        icon.textContent = '✓';
    } else {
        element.classList.remove('valid');
        icon.textContent = '✗';
    }
}

// Save/Load Progress with Firestore
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

        // Update leaderboard
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
