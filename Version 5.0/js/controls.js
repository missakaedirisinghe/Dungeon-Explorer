// Game Controls

function handleKeyPress(e) {
    if (document.querySelector('.modal.active')) return;

    let newX = gameState.playerPos.x;
    let newY = gameState.playerPos.y;

    switch (e.key) {
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

    // Check chest 
    for (let i = 0; i < gameState.chests.length; i++) {
        const chest = gameState.chests[i];
        if (chest.x === newX && chest.y === newY) {
            if (!chest.opened) {
                openChest(i);
            }
            return;
        }
    }

    // Check door 
    if (gameState.doorPos && gameState.doorPos.x === newX && gameState.doorPos.y === newY) {
        if (gameState.doorUnlocked) {
            audioManager.play('door_open');
            nextLevel();
        }
        return;
    }

    // Move player
    gameState.playerPos.x = newX;
    gameState.playerPos.y = newY;

    // Trigger animation and sound
    gameState.isWalking = true;
    audioManager.play('step');
    renderDungeon();


    if (gameState.walkTimeout) {
        clearTimeout(gameState.walkTimeout);
    }

    // Stop walking animation 
    gameState.walkTimeout = setTimeout(() => {
        gameState.isWalking = false;

        const playerSprite = document.querySelector('.player-sprite');
        if (playerSprite) playerSprite.classList.remove('walking');
    }, 200);
}


document.addEventListener('keydown', (e) => {
    // ESC for pause
    if (e.key === 'Escape' && document.getElementById('gameScreen').style.display !== 'none') {
        if (!document.querySelector('.modal.active')) {
            if (typeof togglePause === 'function') togglePause();
        }
    }
});


