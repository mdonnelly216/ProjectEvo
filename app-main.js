/* main.js
 * Project Evo - .js entry point, global state and controller.
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* Username */
    /* Store information in login.php to write sessionStorage.evo.username right before redirecting to game.html*/
    const username = sessionStorage.getItem("evo.username") || "guest";
    document.getElementById("userTag").textContent = `Signed in as ${username}`;

    /* The single Game instance */

    const game = new EvoClasses.Game(username);

    const state = {
        simulation: null,   // active EvoEngine.Simulation
        username:   username
    };

    /* Navigation to different screens */

    const NAV = {
        "menu":        "screen-menu",
        "creator":     "screen-creator",
        "start":       "screen-select",   // Start New Game select species
        "select":      "screen-select",
        "allocate":    "screen-allocate",
        "game":        "screen-game",
        "cleared":     "screen-cleared",
        "gameover":    "screen-gameover"

    };

    /* Refreshes page when you visit a screen */
    const showHooks = {};

    function showScreen(key) {
        
        if (showHooks[key]) {
            try { showHooks[key](); }
            catch (e) { console.error("show hook failed for", key, e); }
        }

       
        const id = NAV[key] || key;
        document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
        const target = document.getElementById(id);
        if (target) target.classList.add("active");
    }

    function onShow(key, fn) { showHooks[key] = fn; }

        /* Wire up the nav buttons in the static HTML. These use data-nav attributes */
    document.querySelectorAll("[data-nav]").forEach(btn => {
        btn.addEventListener("click", () => {
            const key = btn.getAttribute("data-nav");

            showScreen(key);
        });
    });

    /* Popup notification */

    function popup(msg, isError) {
        const el = document.createElement("div");
        el.className = "popup" + (isError ? " error" : "");
        el.textContent = msg;
        document.getElementById("popupRoot").appendChild(el);
        setTimeout(() => el.remove(), 2400);
    }

    /* Simple HTML escaper for user-generated content. */
    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, c =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;",
               '"': "&quot;", "'": "&#39;" })[c]);
    }

    /* The global EvoApp object that other files will use to access the game*/
    window.EvoApp = {
        game,
        state,
        showScreen,
        onShow,
        popup,
        escapeHtml,

     
        enterGameScreen: () => showScreen("menu")
    };

    /* EvoApp on the global scope. */
    window.__evo = window.EvoApp;
});
