// Dungeon Logic

function initLevel() {
    const config = getLevelConfig(gameState.currentLevel);

    // Reset door state
    gameState.doorUnlocked = false;

    // Generate chest positions 
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

    // Generate door position 
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

                player.dataset.char = gameState.character;

                const isMale = gameState.character && gameState.character.toLowerCase().trim() === 'male';
                const sprite = document.createElement('div');
                sprite.className = 'player-sprite ' + (isMale ? 'male-char' : 'female-char');

                if (gameState.isWalking) {
                    sprite.classList.add('walking');
                }

                player.appendChild(sprite);
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

async function nextLevel() {
    gameState.currentLevel++;
    gameState.hearts = gameState.maxHearts; // Restore hearts

    // Show level transition
    if (typeof showLevelTransition === 'function') {
        showLevelTransition(gameState.currentLevel);
    }

    // initializing new level
    setTimeout(() => {
        initLevel();
        if (typeof updateUI === 'function') updateUI();
    }, 500);

    await saveProgress();
}
