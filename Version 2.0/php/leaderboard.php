<?php
require_once 'config.php';

$conn = getDBConnection();

// Get leaderboard sorted by highest level
$levelLeaderboard = [];
$stmt = $conn->prepare("SELECT username, highest_level, total_xp FROM users WHERE highest_level IS NOT NULL ORDER BY highest_level DESC, total_xp DESC LIMIT 10");
$stmt->execute();
$result = $stmt->get_result();

while ($row = $result->fetch_assoc()) {
    $levelLeaderboard[] = [
        'username' => $row['username'],
        'highest_level' => intval($row['highest_level'] ?? 1),
        'total_xp' => intval($row['total_xp'] ?? 0)
    ];
}

// Get leaderboard sorted by player level and XP
$xpLeaderboard = [];
$stmt = $conn->prepare("SELECT username, player_level, total_xp FROM users WHERE player_level IS NOT NULL ORDER BY player_level DESC, total_xp DESC LIMIT 10");
$stmt->execute();
$result = $stmt->get_result();

while ($row = $result->fetch_assoc()) {
    $xpLeaderboard[] = [
        'username' => $row['username'],
        'player_level' => intval($row['player_level'] ?? 1),
        'total_xp' => intval($row['total_xp'] ?? 0)
    ];
}

echo json_encode([
    'success' => true,
    'levelLeaderboard' => $levelLeaderboard,
    'xpLeaderboard' => $xpLeaderboard
]);

$stmt->close();
$conn->close();
?>