<?php
$serverName = 'localhost';
$database   = 'evoDB';
$dbUser     = 'your_db_user';
$dbPassword = 'your_db_password';

header('Content-Type: text/html; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo 'Method not allowed.';
    exit;
}

$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';

if (!$username || !$password) {
    echo 'Username and password are required.';
    exit;
}

try {
    $dsn = "sqlsrv:Server=$serverName;Database=$database";
    $pdo = new PDO($dsn, $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    $stmt = $pdo->prepare('SELECT Username, PasswordHash FROM dbo.users WHERE Username = :username');
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch();

    if (!$user) {
        echo 'Invalid username or password.';
        exit;
    }

    if (!password_verify($password, $user['PasswordHash'])) {
        echo 'Invalid username or password.';
        exit;
    }

    session_start();
    $_SESSION['username'] = $user['Username'];

    echo 'Login successful';
    // Redirect goes here
    
    exit;
} catch (PDOException $ex) {
    error_log('Database error: ' . $ex->getMessage());
    echo 'An error occurred while trying to authenticate.';
    exit;
}
