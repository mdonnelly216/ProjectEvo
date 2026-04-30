<?php
$serverName = 'localhost';
$database   = 'evoDB';
$dbUser     = 'root';
$dbPassword = 'mdonnelly';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed.']);
    exit;
}

$action = trim($_POST['action'] ?? '');
$entry  = trim($_POST['entry'] ?? '');
$id     = intval($_POST['id'] ?? 0);

try {
    $dsn = "mysql:host=$serverName;dbname=$database";
    $pdo = new PDO($dsn, $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    if ($action === 'add') {
        if (!$entry) {
            echo json_encode(['ok' => false, 'error' => 'Entry text is required.']);
            exit;
        }
        $stmt = $pdo->prepare('INSERT INTO changelog (entry) VALUES (:entry)');
        $stmt->execute(['entry' => $entry]);
        echo json_encode(['ok' => true, 'id' => $pdo->lastInsertId()]);

    } elseif ($action === 'edit') {
        if (!$id || !$entry) {
            echo json_encode(['ok' => false, 'error' => 'ID and entry text are required.']);
            exit;
        }
        $stmt = $pdo->prepare('UPDATE changelog SET entry = :entry WHERE id = :id');
        $stmt->execute(['entry' => $entry, 'id' => $id]);
        echo json_encode(['ok' => true]);

    } elseif ($action === 'delete') {
        if (!$id) {
            echo json_encode(['ok' => false, 'error' => 'ID is required.']);
            exit;
        }
        $stmt = $pdo->prepare('DELETE FROM changelog WHERE id = :id');
        $stmt->execute(['id' => $id]);
        echo json_encode(['ok' => true]);
    } elseif ($action === 'deleteLeaderboard') {
        if (!$id) {
            echo json_encode(['ok' => false, 'error' => 'ID is required.']);
            exit;
        }
        $stmt = $pdo->prepare('DELETE FROM leaderboard_entry WHERE id = :id');
        $stmt->execute(['id' => $id]);
        echo json_encode(['ok' => true]);
    } else {
        echo json_encode(['ok' => false, 'error' => 'Unknown action.']);
    }

} catch (PDOException $ex) {
    error_log('Database error: ' . $ex->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Database error.']);
}
