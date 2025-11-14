<?php
// Suppress all errors from displaying
@ini_set('display_errors', 0);
@ini_set('display_startup_errors', 0);
@error_reporting(0);

// Start output buffering to catch any stray output
ob_start();

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'dungeon_explorer');

// Create connection
function getDBConnection() {
    // Clear any previous output
    ob_clean();
    
    try {
        $conn = @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            ob_clean();
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Database connection failed. Please check your database configuration.'
            ]);
            exit();
        }
        
        $conn->set_charset('utf8mb4');
        return $conn;
    } catch (Exception $e) {
        ob_clean();
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Server error. Please try again later.'
        ]);
        exit();
    }
}

// Start session
if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

// Clear output buffer and set headers
ob_clean();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>