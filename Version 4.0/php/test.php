<?php
// Simple test file to check if PHP is working
@error_reporting(0);
@ini_set('display_errors', 0);

header('Content-Type: application/json');

echo json_encode([
    'success' => true,
    'message' => 'PHP is working correctly!',
    'php_version' => phpversion(),
    'mysqli_available' => extension_loaded('mysqli')
]);
?>