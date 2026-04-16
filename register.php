<?php
// Update these settings to match your SQL Server environment.
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
$confirmPassword = $_POST['confirm_password'] ?? '';

if (!$username || !$password || !$confirmPassword) {
    echo 'Username, password, and confirmation are required.';
    exit;
}

if ($password !== $confirmPassword) {
    echo 'Passwords do not match.';
    exit;
}

if (strlen($password) < 6) {
    echo 'Password must be at least 6 characters.';
    exit;
}

try {
    $dsn = "sqlsrv:Server=$serverName;Database=$database";
    $pdo = new PDO($dsn, $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    $check = $pdo->prepare('SELECT Username FROM dbo.users WHERE Username = :username');
    $check->execute(['username' => $username]);
    if ($check->fetch()) {
        echo 'That username is already taken. Please choose another one.';
        exit;
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $insert = $pdo->prepare('INSERT INTO dbo.users (Username, PasswordHash) VALUES (:username, :passwordHash)');
    $insert->execute([
        'username' => $username,
        'passwordHash' => $passwordHash,
    ]);

    header('Location: login.html');
    exit;
} catch (PDOException $ex) {
    error_log('Database error: ' . $ex->getMessage());
    echo 'An error occurred while creating your account.';
    exit;
}
