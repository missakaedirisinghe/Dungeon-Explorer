<?php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Not logged in'
    ]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

$hearts = intval($input['hearts'] ?? 3);
$xp = intval($input['xp'] ?? 0);
$playerLevel = intval($input['playerLevel'] ?? 1);
$currentLevel = intval($input['currentLevel'] ?? 1);

$conn = getDBConnection();

// Calculate total XP
$totalXP = ($playerLevel - 1) * 100 + $xp;

// Update user stats
$stmt = $conn->prepare("UPDATE users SET hearts = ?, xp = ?, player_level = ?, current_level = ?, total_xp = ?, highest_level = GREATEST(highest_level, ?) WHERE id = ?");
$stmt->bind_param("iiiiiii", $hearts, $xp, $playerLevel, $currentLevel, $totalXP, $currentLevel, $_SESSION['user_id']);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Progress saved successfully'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to save progress'
    ]);
}

$stmt->close();
$conn->close();
?>