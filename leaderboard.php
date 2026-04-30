<?php
$serverName = 'localhost';
$database   = 'evoDB';
$dbUser     = 'root';
$dbPassword = 'mdonnelly';

try {
    $dsn = "mysql:host=$serverName;dbname=$database";
    $pdo = new PDO($dsn, $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $stmt = $pdo->prepare(
       "SELECT id, name, score, species_id, level, username
        FROM leaderboard_entry
        ORDER BY score DESC"
    );
    $stmt->execute();
    $rowsArray = $stmt->fetchAll();
    $rows = json_encode($rowsArray);

    if (isset($_GET['json'])) {//render table in admin panel
        header('Content-Type: application/json');
        echo $rows;
        exit;
    }
} catch (PDOException $ex) {
    error_log('Database error: ' . $ex->getMessage());
    $rows = "[]";
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Project Evo</title>
    <link rel="stylesheet" href="game.css" />
</head>
<body>

<div class="app-shell">
    <header class="app-header">
        <div>
            <span class="user-tag" id="userTag">Signed in</span>
            <a class="logout-link" href="login.html">Log out</a>
        </div>
    </header>

    <section id="screen-menu" class="screen active">
        <div style="position:relative; display:flex; justify-content:center; align-items:flex-start; min-height:340px;">
            <!-- Centered game panel -->
            <div class="panel wavy" style="max-width:900px; width:100%;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <a href="game.html" class="btn btn-small btn-ghost">Back</a>
                <h2 style="margin:0;">Leaderboard</h2>
                <span type="hidden">
            </div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Score</th>
                            <th>Species ID</th>
                            <th>Level</th>
                            <th>Username</th>
                        </tr>
                    </thead>
                    <tbody id="resultsBody">
                        <tr><td colspan="6" class="empty">No entries found.</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>
</div>
<script>
    const username = sessionStorage.getItem("evo.username") || "guest";
    document.getElementById("userTag").textContent = `Signed in as ${username}`;

    const rows = <?= $rows ?>;
    document.getElementById('resultsBody').innerHTML = rows.length ? rows.map(row =>
    `<tr>
        <td>${(row.id)}</td>
        <td>${(row.name)}</td>
        <td>${(row.score)}</td>
        <td>${(row.species_id)}</td>
        <td>${(row.level)}</td>
        <td>${(row.username)}</td>
    </tr>`).join('') : '<tr><td colspan="6" class="empty">No entries found.</td></tr>';
</script>
</body>
</html>

