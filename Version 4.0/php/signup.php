<?php
@error_reporting(0);
@ini_set('display_errors', 0);
ob_start();

try {
    require_once 'config.php';

    // Clear any output and ensure JSON header
    ob_clean();
    header('Content-Type: application/json');

    // Get JSON input
    $input = @json_decode(file_get_contents('php://input'), true);

    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';

    // Validate input
    if (empty($username) || empty($password)) {
        echo json_encode([
            'success' => false,
            'message' => 'Username and password are required'
        ]);
        exit();
    }

    $conn = getDBConnection();

    // Check if username exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Username already exists'
        ]);
        exit();
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert new user
    $stmt = $conn->prepare("INSERT INTO users (username, password, created_at) VALUES (?, ?, NOW())");
    $stmt->bind_param("ss", $username, $hashedPassword);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Account created successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create account'
        ]);
    }

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    ob_clean();
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Server error. Please check database connection.',
        'error' => $e->getMessage()
    ]);
}
?>