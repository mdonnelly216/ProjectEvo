/* 
 * app-creator.js
 * Project Evo - Creature Creator screen
 * This file depends on:
 *   EvoApp        app-main.js
 *   EvoData       game-data.js
 *   EvoClasses    game-classes.js
 *   app-allocate.js 
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    /* Form fields */
    const $name        = document.getElementById("creatorName");
    const $headShape   = document.getElementById("creatorHeadShape");
    const $headColor   = document.getElementById("creatorHeadColor");
    const $feature     = document.getElementById("creatorFeature");
    const $featureCol  = document.getElementById("creatorFeatureColor");
    const $eyeShape    = document.getElementById("creatorEyeShape");
    const $eyeColor    = document.getElementById("creatorEyeColor");
    const $animalType  = document.getElementById("creatorType");
    const $confirm     = document.getElementById("btnCreatorConfirm");

    /* Preview elements */
    const $prevHead    = document.getElementById("prevHead");
    const $prevFeature = document.getElementById("prevFeature");
    const $prevEyeL    = document.getElementById("prevEyeL");
    const $prevEyeR    = document.getElementById("prevEyeR");

    /* Live preview */
    function updatePreview() {
        $prevHead.setAttribute("fill",    $headColor.value);
        $prevFeature.setAttribute("fill", $featureCol.value);
        $prevEyeL.setAttribute("fill",    $eyeColor.value);
        $prevEyeR.setAttribute("fill",    $eyeColor.value);
    }
    [$headColor, $featureCol, $eyeColor].forEach(el =>
        el.addEventListener("input", updatePreview));

    /* Reset on every entry */
    function resetForm() {
        $name.value       = "";
        $headColor.value  = "#e87a3a";
        $featureCol.value = "#c0602b";
        $eyeColor.value   = "#111111";
        updatePreview();
    }
    EvoApp.onShow("creator", resetForm);

    /* Confirm: create the Species */
    $confirm.addEventListener("click", () => {
        const game = EvoApp.game;

        const name = $name.value.trim() || `Species #${game.species.length + 1}`;
        const s = game.createSpecies(name);

        /* Copy appearance fields off the form into the Species. */
        s.appearance.headShape    = $headShape.value;
        s.appearance.headColor    = $headColor.value;
        s.appearance.feature      = $feature.value;
        s.appearance.featureColor = $featureCol.value;
        s.appearance.eyeShape     = $eyeShape.value;
        s.appearance.eyeColor     = $eyeColor.value;
        s.appearance.animalType   = $animalType.value;
        game.saveSpeciesToStorage();

        game.activeSpecies = s;
        EvoApp.openAllocate({
            species: s,
            pool:    EvoData.STAT_POOL_INITIAL,
            onConfirm: () => {
                EvoApp.popup(`${s.name} is ready!`);
                EvoApp.showScreen("start");   // back to Select Creature
            }
        });
    });
});
