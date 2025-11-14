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

$stmt = $conn->prepare("SELECT s_character FROM users WHERE id = ?");
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
    'username' => $_SESSION['username'],
    'character' => $user['s_character']
]);

$stmt->close();
$conn->close();
?>