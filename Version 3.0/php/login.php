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
        ob_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Username and password are required'
        ]);
        exit();
    }

    $conn = getDBConnection();
    
    if (!$conn) {
        ob_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed'
        ]);
        exit();
    }

    // Get user
    $stmt = @$conn->prepare("SELECT id, password, s_character FROM users WHERE username = ?");
    
    if (!$stmt) {
        ob_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Database query failed: ' . $conn->error
        ]);
        exit();
    }
    
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        ob_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Invalid credentials - user not found'
        ]);
        $stmt->close();
        $conn->close();
        exit();
    }

    $user = $result->fetch_assoc();

    // Verify password
    if (!password_verify($password, $user['password'])) {
        ob_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Invalid credentials - wrong password'
        ]);
        $stmt->close();
        $conn->close();
        exit();
    }

    // Set session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $username;

    ob_clean();
    echo json_encode([
        'success' => true,
        'username' => $username,
        'character' => $user['s_character']
    ]);

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    ob_clean();
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Login error: ' . $e->getMessage(),
        'line' => $e->getLine(),
        'file' => basename($e->getFile())
    ]);
}
?>