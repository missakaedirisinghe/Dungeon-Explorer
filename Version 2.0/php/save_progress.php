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
$character = $input['character'] ?? '';

if (!in_array($character, ['male', 'female'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid character type'
    ]);
    exit();
}

$conn = getDBConnection();

$stmt = $conn->prepare("UPDATE users SET character = ? WHERE id = ?");
$stmt->bind_param("si", $character, $_SESSION['user_id']);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Character set successfully'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to set character'
    ]);
}

$stmt->close();
$conn->close();
?>