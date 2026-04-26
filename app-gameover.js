/* 
 * app-gameover.js
 * Project Evo - Game Over screen
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const $score   = document.getElementById("goScore");
    const $stage   = document.getElementById("goStage");
    const $name    = document.getElementById("goName");
    const $btnSubmit = document.getElementById("goSubmit");
    const $btnSkip   = document.getElementById("goSkip");

    EvoApp.openGameOver = function () {
        const game = EvoApp.game;
        $score.textContent = game.score;
        $stage.textContent = `Stage ${game.currentLevel}`;

        /* If the player got a score of 0, they probably quit mid-game. In that case, skip the submission step and just return to menu. */
        $name.value = (EvoApp.state.username === "guest") ? "" : EvoApp.state.username;

        EvoApp.showScreen("gameover");
    };

    $btnSubmit.addEventListener("click", async () => {
        const name = $name.value.trim();
        if (!name) { $name.focus(); return; }

        const game = EvoApp.game;
        const form = new FormData();
        form.append('name',         name);
        form.append('score',        game.score);
        form.append('level',        game.currentLevel);
        form.append('species_name', game.activeSpecies ? game.activeSpecies.name : 'Unknown');
        form.append('username',     game.username !== 'guest' ? game.username : '');

        $btnSubmit.disabled = true;
        try {
            const res  = await fetch('submit-score.php', { method: 'POST', body: form });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error);
        } catch (e) {
            console.error('Score submission failed:', e);
        } finally {
            $btnSubmit.disabled = false;
            EvoApp.showScreen("menu");
        }
    });

    /* Skip back to menu */
    $btnSkip.addEventListener("click", () => EvoApp.showScreen("menu"));
});
