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

    $btnSubmit.addEventListener("click", () => {
        
        EvoApp.showScreen("menu");
    });

    /* Skip back to menu */
    $btnSkip.addEventListener("click", () => EvoApp.showScreen("menu"));
});
