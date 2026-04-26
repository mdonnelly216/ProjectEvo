/* 
 * cleared.js
 * Project Evo - Stage Cleared screen.
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const $list      = document.getElementById("mutationList");
    const $rows      = document.getElementById("upgradeRows");
    const $remaining = document.getElementById("upgradeRemaining");
    const $confirm   = document.getElementById("clearedConfirm");

    let ctx = null;

    EvoApp.openStageCleared = function () {
        ctx = {
            chosenMutation: null,
            pool:           EvoData.STAT_POOL_PER_LEVEL,
            originalStats:  { ...EvoApp.game.activeSpecies.stats },
            spent:          0
        };
        renderMutations();
        renderUpgradeRows();
        EvoApp.showScreen("cleared");
    };

    /* Mutation cards  */
    function renderMutations() {
        $list.innerHTML = "";
        const game = EvoApp.game;

        const options = game.rollMutationChoices(3);
        options.forEach(m => {
            const btn = document.createElement("button");
            btn.className = "mutation-card";
            btn.innerHTML = `
                <div class="name">${EvoApp.escapeHtml(m.name)}</div>
                <div class="blurb">${EvoApp.escapeHtml(m.blurb)}</div>`;
            btn.addEventListener("click", () => selectCard(btn, m.id));
            $list.appendChild(btn);
        });

        /* Skip option for no mutation*/
        const skip = document.createElement("button");
        skip.className = "mutation-card";
        skip.innerHTML = `<div class="name">Skip</div>
                          <div class="blurb">No mutation applied this round</div>`;
        skip.addEventListener("click", () => selectCard(skip, null));
        $list.appendChild(skip);
    }

    function selectCard(btn, mutationId) {
        $list.querySelectorAll(".mutation-card").forEach(c => c.classList.remove("selected"));
        btn.classList.add("selected");
        ctx.chosenMutation = mutationId;
    }

    /* Stat upgrade rows  */
    function renderUpgradeRows() {
        $rows.innerHTML = "";
        const s = EvoApp.game.activeSpecies;
        for (const trait of EvoData.TRAITS) {
            const value = s.stats[trait.key];
            const fillW = (value / trait.max) * 100;
            const row = document.createElement("div");
            row.className = "stat-row";
            row.innerHTML = `
                <div class="label">${trait.short}</div>
                <div class="bar"><div class="fill" style="width:${fillW}%"></div></div>
                <div class="value">${value}</div>
                <div class="pm">
                    <button data-op="dec" data-key="${trait.key}">&minus;</button>
                    <button data-op="inc" data-key="${trait.key}">+</button>
                </div>`;
            $rows.appendChild(row);
        }
        $rows.querySelectorAll("button").forEach(btn => {
            btn.addEventListener("click",
                () => handlePlusMinus(btn.dataset.key, btn.dataset.op));
        });
        $remaining.textContent = ctx.pool - ctx.spent;
    }

    function handlePlusMinus(key, op) {
        const trait = EvoData.TRAITS.find(t => t.key === key);
        const s = EvoApp.game.activeSpecies;
        if (op === "inc") {
            if (ctx.spent >= ctx.pool)        return EvoApp.popup("No upgrade points left.", true);
            if (s.stats[key] >= trait.max)    return EvoApp.popup(`${trait.label} is maxed out.`, true);
            s.stats[key]++;
            ctx.spent++;
        } else {
            /* Don't allow going back below the starting point for this level */
            if (s.stats[key] <= ctx.originalStats[key])
                return EvoApp.popup("Can't go below starting value.", true);
            s.stats[key]--;
            ctx.spent--;
        }
        renderUpgradeRows();
    }

    /* Confirm: apply mutation, advance, restart simulation */
    $confirm.addEventListener("click", () => {
        const game = EvoApp.game;
        if (ctx.chosenMutation) {
            const res = game.applyMutation(ctx.chosenMutation);
            if (!res.ok) { EvoApp.popup(res.message, true); return; }
        }
        game.advanceLevel();
        EvoApp.newSimulation();
        ctx = null;
        EvoApp.enterGameScreen();
    });
});
