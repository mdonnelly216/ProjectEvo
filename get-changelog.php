<?php
$serverName = 'localhost';
$database   = 'evoDB';
$dbUser     = 'root';
$dbPassword = 'mdonnelly';

header('Content-Type: application/json; charset=utf-8');

try {
    $dsn = "mysql:host=$serverName;dbname=$database";
    $pdo = new PDO($dsn, $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    $stmt = $pdo->query('SELECT id, entry, created_at FROM changelog ORDER BY created_at DESC');
    $rows = $stmt->fetchAll();

    echo json_encode(['ok' => true, 'entries' => $rows]);

} catch (PDOException $ex) {
    error_log('Database error: ' . $ex->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Database error.']);
}
