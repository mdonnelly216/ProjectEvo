<?php
// Update these settings to match your SQL Server environment.
$serverName = 'localhost';
$database   = 'evoDB';
$dbUser     = 'root';
$dbPassword = 'mdonnelly';

header('Content-Type: text/html; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo 'Method not allowed.';
    exit;
}

$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirm_password'] ?? '';

if (!$username || !$password || !$confirmPassword) {
    echo 'Username, password, and confirmation are required.';
    exit;
}

if ($password !== $confirmPassword) {
    echo 'Passwords do not match.';
    exit;
}



try {
    $dsn = "mysql:host=$serverName;dbname=$database";
    $pdo = new PDO($dsn, $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    $check = $pdo->prepare('SELECT username FROM users WHERE username = :username');
    $check->execute(['username' => $username]);
    if ($check->fetch()) {
        echo 'That username is already taken. Please choose another one.';
        exit;
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $insert = $pdo->prepare('INSERT INTO users (username, password) VALUES (:username, :password)');
    $insert->execute([
        'username' => $username,
        'password' => $passwordHash,
    ]);

    header('Location: login.html');
    exit;
} catch (PDOException $ex) {
    error_log('Database error: ' . $ex->getMessage());
    echo 'Database error: ' . $ex->getMessage();
    exit;
}
