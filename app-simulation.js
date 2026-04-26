/* 
 * app-simulation.js
 * Project Evo -  Simulation screen.
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* User interface elements */
    const $score   = document.getElementById("hudScore");
    const $pop     = document.getElementById("hudPop");
    const $pred    = document.getElementById("hudPred");
    const $tick    = document.getElementById("hudTick");
    const $hpFill  = document.getElementById("avgHpFill");
    const $stage   = document.getElementById("stageLabel");
    const $canvas  = document.getElementById("gameCanvas");
    const $btnGo   = document.getElementById("gameStart");
    const $btnAbort= document.getElementById("gameAbort");
    const $grid    = document.getElementById("speciesGrid");

    /*  Select Creature grid */

    function renderSelectGrid() {
        $grid.innerHTML = "";
        const game = EvoApp.game;

        for (const s of game.species) {
            const card = document.createElement("button");
            card.className = "species-card";
            card.innerHTML = `
                <svg viewBox="0 0 120 120" width="80" height="80">
                    <circle  cx="60" cy="70" r="44" fill="${s.appearance.headColor}"/>
                    <polygon points="30,40 45,10 60,38 75,10 90,40" fill="${s.appearance.featureColor}"/>
                    <circle  cx="48" cy="66" r="5"  fill="${s.appearance.eyeColor}"/>
                    <circle  cx="72" cy="66" r="5"  fill="${s.appearance.eyeColor}"/>
                </svg>
                <div class="name">${EvoApp.escapeHtml(s.name)}</div>`;
            card.addEventListener("click", () => {
                game.selectSpecies(s.id);
                game.startNewGame();
                EvoApp.enterGameScreen();
            });
            $grid.appendChild(card);
        }

        /* + card opens the Creature Creator */
        const add = document.createElement("button");
        add.className = "species-card-add";
        add.textContent = "+";
        add.title = "Create a new species";
        add.addEventListener("click", () => EvoApp.showScreen("creator"));
        $grid.appendChild(add);
    }
    EvoApp.onShow("start", renderSelectGrid);

    /* Game screen */

    /* When the player starts a game, we create a Simulation instance to run the level */
    function enterGameScreen() {
        updateStageLabel();
        updateHud();
        EvoApp.showScreen("game");
        if (!EvoApp.state.simulation) newSimulation();
        EvoApp.state.simulation.draw();
        $btnGo.disabled = false;
    }
    EvoApp.enterGameScreen = enterGameScreen;   // exposed for app-cleared.js to call when advancing to the next stage

    function updateStageLabel() {
        const l = EvoApp.game.level;
        if (l) $stage.textContent = `Stage ${l.stage.number} - ${l.stage.name}`;
    }

    function updateHud() {
        const game = EvoApp.game;
        const l = game.level;
        $score.textContent = game.score;
        $pop.textContent   = l ? l.board.population() : 0;
        $pred.textContent  = l ? l.board.predators.filter(p=>p.alive).length : 0;
        $tick.textContent  = l ? l.tick : 0;

        if (l && l.board.animals.length) {
            const alive = l.board.animals.filter(a => a.alive);
            if (alive.length) {
                const avg = alive.reduce((s, a) => s + a.hp / a.maxHp, 0) / alive.length;
                $hpFill.style.width = `${Math.round(avg * 100)}%`;
            }
        }
    }

    function newSimulation() {
        if (EvoApp.state.simulation) EvoApp.state.simulation.stop();
        EvoApp.state.simulation = new EvoEngine.Simulation(EvoApp.game.level, $canvas, {
            onTick: updateHud,
            onEnd:  handleLevelEnd
        });
    }
    /* Expose newSimulation on EvoApp so it can be called by app-cleared.js when the player advances to the next stage. */
    EvoApp.newSimulation = newSimulation;

    /* Called by Simulation when the level ends (win or loss). */
    function handleLevelEnd(outcome, level) {
        $btnGo.disabled = false;
        const game = EvoApp.game;
        if (outcome === "win") {
            game.awardStageScore(level.board.population());
            if (game.currentLevel >= EvoData.STAGES.length) {
                EvoApp.popup("You cleared every stage!");
                EvoApp.openGameOver();   // shows score + leaderboard prompt
            } else {
                EvoApp.openStageCleared();
            }
        } else {
            EvoApp.openGameOver();
        }
    }

    /* HUD buttons */
    $btnGo.addEventListener("click", () => {
        if (!EvoApp.state.simulation) newSimulation();
        EvoApp.state.simulation.start();
        $btnGo.disabled = true;
    });

    $btnAbort.addEventListener("click", () => {
        if (EvoApp.state.simulation) EvoApp.state.simulation.stop();
        EvoApp.state.simulation = null;
        $btnGo.disabled = false;
        EvoApp.showScreen("menu");
    });
});
