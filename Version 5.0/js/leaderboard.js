// Leaderboard Logic
async function showLeaderboard() {
    await updateLeaderboard();
    document.getElementById('leaderboardModal').classList.add('active');
}

function closeLeaderboard() {
    document.getElementById('leaderboardModal').classList.remove('active');
}

async function updateLeaderboard() {
    try {
        // Get top 10 by highest level
        const levelSnapshot = await db.collection('leaderboard')
            .orderBy('highestLevel', 'desc')
            .orderBy('totalXp', 'desc')
            .limit(10)
            .get();

        let levelHTML = '';
        let levelRank = 1;
        levelSnapshot.forEach((doc) => {
            const player = doc.data();
            levelHTML += `
                <tr style="${player.username === gameState.currentUser ? 'background:#3a3a5e;' : ''}">
                    <td>${levelRank++}</td>
                    <td>${player.username}</td>
                    <td>${player.highestLevel}</td>
                    <td>${player.totalXp}</td>
                </tr>
            `;
        });
        document.getElementById('levelLeaderboard').innerHTML = levelHTML || '<tr><td colspan="4">No data yet</td></tr>';

        // Get top 10 by XP
        const xpSnapshot = await db.collection('leaderboard')
            .orderBy('totalXp', 'desc')
            .limit(10)
            .get();

        let xpHTML = '';
        let xpRank = 1;
        xpSnapshot.forEach((doc) => {
            const player = doc.data();
            xpHTML += `
                <tr style="${player.username === gameState.currentUser ? 'background:#3a3a5e;' : ''}">
                    <td>${xpRank++}</td>
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
