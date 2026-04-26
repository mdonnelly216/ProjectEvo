<?php
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

if (!$username || !$password) {
    echo 'Username and password are required.';
    exit;
}

try {
    $dsn = "mysql:host=$serverName;dbname=$database";
    $pdo = new PDO($dsn, $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    $stmt = $pdo->prepare('SELECT username, password FROM admin WHERE username = :username');
    $stmt->execute(['username' => $username]);
    $admin = $stmt->fetch();

    if (!$admin || $admin['password'] !== $password) {
        echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Error</title>
        <style>body{font-family:Arial,sans-serif;background:#121212;color:#f0f0f0;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;}
        .card{background:#1e1e1e;border-radius:12px;padding:32px;text-align:center;}
        .error{color:#ff6b6b;margin-bottom:16px;}
        a{color:#7ccfff;}</style></head><body>
        <div class="card"><p class="error">Invalid admin username or password.</p><a href="login.html">&larr; Back to Login</a></div>
        </body></html>';
        exit;
    }

    session_start();
    $_SESSION['admin'] = $admin['username'];

    $name = json_encode($admin['username']);
    echo "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Admin signing in...</title></head><body>";
    echo "<script>sessionStorage.setItem('evo.admin', $name); location.replace('admin.html');</script>";
    echo "<noscript>Login successful. <a href='admin.html'>Continue to Admin Panel</a>.</noscript>";
    echo "</body></html>";
    exit;

} catch (PDOException $ex) {
    error_log('Database error: ' . $ex->getMessage());
    echo 'An error occurred while trying to authenticate.';
    exit;
}
