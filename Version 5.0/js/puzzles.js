
function openChest(index) {
    audioManager.play('chest_open');
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
        // Call Banana API directly using HTTPS 
        const response = await fetch('https://marcconrad.com/uob/banana/api.php?out=json');

        // Check if response is OK (status 200-299)
        if (!response.ok) {
            console.log('Banana API not available (status ' + response.status + '), using math puzzle');
            generateMathPuzzle();
            return;
        }

        // parse as JSON 
        const data = await response.json();

        // Banana API returns
        if (data.question && data.solution !== undefined) {
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
                console.log('Failed to load puzzle image, using math puzzle');
                generateMathPuzzle();
            };

            document.getElementById('puzzleQuestion').textContent = 'What number do you see?';
        } else {

            console.log('Invalid Banana API response format, using math puzzle');
            generateMathPuzzle();
        }

    } catch (error) {

        console.log('Banana API error, using math puzzle:', error.message);
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

        // Effects and saves
        if (typeof renderDungeon === 'function') renderDungeon();
        if (typeof updateUI === 'function') updateUI();
        if (typeof saveProgress === 'function') await saveProgress();


        if (typeof createParticles === 'function') {
            const chestPos = gameState.chests[gameState.currentChestIndex];

        }

    } else {
        // Wrong answer
        gameState.hearts--;
        closePuzzle();

        document.getElementById('correctAnswer').textContent = gameState.currentPuzzle.answer;
        document.getElementById('deathModal').classList.add('active');

        if (typeof updateUI === 'function') updateUI();
        if (typeof saveProgress === 'function') await saveProgress();

        if (gameState.hearts <= 0) {
            setTimeout(() => {
                closeDeath();
                if (typeof gameOver === 'function') gameOver();
            }, 2000);
        }
    }
}

function closePuzzle() {
    document.getElementById('puzzleModal').classList.remove('active');
}

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
