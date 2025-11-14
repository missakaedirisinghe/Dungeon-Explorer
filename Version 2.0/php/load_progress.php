<?php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Not logged in'
    ]);
    exit();
}

$conn = getDBConnection();

$stmt = $conn->prepare("SELECT hearts, xp, player_level, current_level FROM users WHERE id = ?");
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'User not found'
    ]);
    exit();
}

$user = $result->fetch_assoc();

echo json_encode([
    'success' => true,
    'progress' => [
        'hearts' => intval($user['hearts'] ?? 3),
        'xp' => intval($user['xp'] ?? 0),
        'playerLevel' => intval($user['player_level'] ?? 1),
        'currentLevel' => intval($user['current_level'] ?? 1)
    ]
]);

$stmt->close();
$conn->close();
?>