<?php
/* submit-score.php
 * Project Evo - Leaderboard score submission endpoint.
 * Inserts the species name into the species table, then records the
 * leaderboard entry linked to it.  Returns JSON {ok, id} or {ok, error}.
 */

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

$name        = trim($_POST['name']         ?? '');
$speciesName = trim($_POST['species_name'] ?? '');
$score       = intval($_POST['score']      ?? 0);
$level       = intval($_POST['level']      ?? 1);
$username    = trim($_POST['username']     ?? '') ?: null;

if (!$name || !$speciesName) {
    echo json_encode(['ok' => false, 'error' => 'Name and species name are required.']);
    exit;
}

try {
    $dsn = "mysql:host=$serverName;dbname=$database";
    $pdo = new PDO($dsn, $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    /* Insert species and get its new id */
    $stmt = $pdo->prepare('INSERT INTO species (name) VALUES (:name)');
    $stmt->execute(['name' => $speciesName]);
    $speciesId = $pdo->lastInsertId();

    /* If username is provided but doesn't exist in users, treat as guest */
    if ($username !== null) {
        $check = $pdo->prepare('SELECT username FROM users WHERE username = :u');
        $check->execute(['u' => $username]);
        if (!$check->fetch()) {
            $username = null;
        }
    }

    /* Insert the leaderboard entry */
    $stmt = $pdo->prepare(
        'INSERT INTO leaderboard_entry (name, score, species_id, level, username)
         VALUES (:name, :score, :species_id, :level, :username)'
    );
    $stmt->execute([
        'name'       => $name,
        'score'      => $score,
        'species_id' => $speciesId,
        'level'      => $level,
        'username'   => $username,
    ]);

    echo json_encode(['ok' => true, 'id' => $pdo->lastInsertId()]);

} catch (PDOException $ex) {
    error_log('Database error: ' . $ex->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Database error.']);
}
