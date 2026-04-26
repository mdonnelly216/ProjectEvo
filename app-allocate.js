/* 
 * app-allocate.js
 * Project Evo - Allocate Your Stats screen.
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const $rows      = document.getElementById("allocRows");
    const $remaining = document.getElementById("allocRemaining");
    const $btnRand   = document.getElementById("allocRandomize");
    const $btnCancel = document.getElementById("allocCancel");
    const $btnOk     = document.getElementById("allocConfirm");

    /*   Only one allocation may be open at a time */
    let ctx = null;

    EvoApp.openAllocate = function ({ species, pool, onConfirm }) {
        ctx = {
            species,
            pool,
            /* starting stats so Cancel can revert them. */
            original: { ...species.stats },
            onConfirm
        };
        renderRows();
        EvoApp.showScreen("allocate");
    };

    /* Rendering  */
    function renderRows() {
        $rows.innerHTML = "";
        for (const trait of EvoData.TRAITS) {
            const value = ctx.species.stats[trait.key];
            const fillW = (value / trait.max) * 100;

            const row = document.createElement("div");
            row.className = "stat-row";
            row.innerHTML = `
                <div class="label" title="${trait.help}">${trait.short}</div>
                <div class="bar"><div class="fill" style="width:${fillW}%"></div></div>
                <div class="value">${value}</div>
                <div class="pm">
                    <button data-op="dec" data-key="${trait.key}">&minus;</button>
                    <button data-op="inc" data-key="${trait.key}">+</button>
                </div>`;
            $rows.appendChild(row);
        }
        /* Attach click handlers after innerHTML has wiped them. */
        $rows.querySelectorAll("button").forEach(btn => {
            btn.addEventListener("click",
                () => handlePlusMinus(btn.dataset.key, btn.dataset.op));
        });
        $remaining.textContent = remainingPoints();
    }

    /* Points still available = pool - (currently spent above the minimum baseline). */
    function remainingPoints() {
        const minSum = EvoData.TRAITS.reduce((s, t) => s + t.min, 0);
        return ctx.pool - (ctx.species.pointsSpent() - minSum);
    }

    /* +/- handlers  */
    function handlePlusMinus(key, op) {
        const s = ctx.species;
        const trait = EvoData.TRAITS.find(t => t.key === key);
        if (op === "inc") {
            if (remainingPoints() <= 0)   return EvoApp.popup("No points left to spend.", true);
            if (s.stats[key] >= trait.max) return EvoApp.popup(`${trait.label} is maxed out.`, true);
            s.stats[key]++;
        } else {
            if (s.stats[key] <= trait.min) return EvoApp.popup(`${trait.label} can't go lower.`, true);
            s.stats[key]--;
        }
        renderRows();
    }

    /* Buttons */
    $btnRand.addEventListener("click", () => {
        ctx.species.randomize(ctx.pool + EvoData.TRAITS.length * EvoData.TRAITS[0].min);
        renderRows();
    });

    $btnCancel.addEventListener("click", () => {
        ctx.species.stats = { ...ctx.original };
        EvoApp.showScreen("menu");
    });

    $btnOk.addEventListener("click", () => {
        if (remainingPoints() > 0) {
            EvoApp.popup(`You still have ${remainingPoints()} unspent points.`, true);
            if (!confirm(`You still have ${remainingPoints()} unspent points. Continue anyway?`)) return;
        }
        EvoApp.game.saveSpeciesToStorage();
        const cb = ctx.onConfirm;
        ctx = null;
        if (cb) cb();
    });
});
