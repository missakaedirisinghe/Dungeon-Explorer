<?php
@error_reporting(0);
@ini_set('display_errors', 0);
ob_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
try {
    // Banana API endpoint - try HTTPS first
    $apiUrl = 'https://marcconrad.com/uob/banana/api.php?out=json&base64=no';
    
    // Initialize cURL
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // Follow redirects
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Skip SSL verification if needed
    curl_setopt($ch, CURLOPT_TIMEOUT, 10); // 10 second timeout
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        // If HTTPS fails, try HTTP
        curl_close($ch);
        
        $apiUrl = 'http://marcconrad.com/uob/banana/api.php?out=json&base64=no';
        $ch = curl_init();
        
        curl_setopt($ch, CURLOPT_URL, $apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    }
    
    curl_close($ch);
    
    if ($httpCode === 200 && $response) {
        // Return the API response
        ob_clean();
        echo $response;
    } else {
        // Return fallback puzzle
        ob_clean();
        echo json_encode([
            'fallback' => true,
            'question' => 'What is ' . rand(1, 20) . ' + ' . rand(1, 20) . '?',
            'solution' => 0 // Will be calculated on client side for fallback
        ]);
    }
    
} catch (Exception $e) {
    ob_clean();
    echo json_encode([
        'fallback' => true,
        'error' => $e->getMessage()
    ]);
}
?>