/* 
 * game-engine.js
 * Project Evo - Simulation engine
 */

"use strict";

class Simulation {

    /**
     * @param {Level}        level    the Level to simulate
     * @param {HTMLCanvasElement} canvas  where the board is drawn
     * @param {object}       opts     {onTick, onEnd} callbacks
     */
    constructor(level, canvas, opts) {
        this.level   = level;
        this.canvas  = canvas;
        this.ctx     = canvas.getContext("2d");
        this.onTick  = (opts && opts.onTick) || (() => {});
        this.onEnd   = (opts && opts.onEnd)  || (() => {});
        this.timerId = null;
    }

    /* start() and stop() control the main loop */
    start() {
        this.stop();  // paranoia - never run two loops at once
        this.draw();
        this.timerId = setInterval(() => this._loop(), EvoData.SIM_TICK_MS);
    }

    stop() {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    /* ---- private: the inner loop ---- */
    _loop() {
        this.tick();
        this.draw();
        this.onTick(this.level);

        const outcome = this.level.evaluate();
        if (outcome !== "running") {
            this.stop();
            this.onEnd(outcome, this.level);
        }
    }

    /* tick() */
    tick() {
        const lvl   = this.level;
        const board = lvl.board;
        lvl.tick++;

        /* --- animals: move, feed, fight, breed --- */
        for (const a of board.animals) {
            if (!a.alive) continue;
            a.age++;

            /* Hunger grows each tick, scaled by the species Hunger Rate */
            a.hunger += a.species.stats.hungerRate * 0.12;

            /* Starvation damage. */
            if (a.hunger >= 100) {
                a.hp -= 3;
                if (a.hp <= 0) { a.alive = false; continue; }
            }

            /* Move a number of times based on the species Speed stat. */
            const moves = Math.max(1, Math.floor(a.species.stats.speed / 5));
            for (let i = 0; i < moves; i++) this._moveAnimal(a);

            /* Eat if standing on a food/water tile. */
            const tile = board.tiles[a.y][a.x];
            if (tile.type === "food") {
                a.hunger = Math.max(0, a.hunger - EvoData.SIM_FOOD_RESTORE);
                tile.type = "empty";
                /* Food respawns elsewhere so resources don't run dry. */
                this._respawnResource("food", board);
            } else if (tile.type === "water") {
                a.hunger = Math.max(0, a.hunger - EvoData.SIM_FOOD_RESTORE * 0.5);
            }

            /* Incubation tick for females. */
            if (a.isFemale && a.incubating > 0) {
                a.incubating--;
                if (a.incubating === 0) this._birth(a, board);
            } else if (a.isFemale
                       && a.hunger < EvoData.SIM_REPRO_HUNGER_MAX
                       && a.age > a.species.stats.incubation * 4) {
                /* Look for a mate on the same tile. */
                const mate = board.animals.find(o =>
                    o !== a && o.alive && !o.isFemale
                    && o.x === a.x && o.y === a.y
                    && o.hunger < EvoData.SIM_REPRO_HUNGER_MAX);
                if (mate) a.incubating = Math.max(2, a.species.stats.incubation);
            }
        }

        /* predators: move and hunt */
        for (const p of board.predators) {
            if (!p.alive) continue;
            this._movePredator(p, board);

            /* Attack any living animal on this tile. */
            for (const a of board.animals) {
                if (!a.alive || a.x !== p.x || a.y !== p.y) continue;

                /* Evasion check: each point of Evasion gives 2% chance to dodge an attack. */
                if (Math.random() * 100 < a.species.stats.evasion * 2) continue;

                const damage = Math.max(
                    1,
                    EvoData.SIM_PREDATOR_DMG + p.power * 2
                      - a.species.stats.defense
                );
                a.hp -= damage;
                if (a.hp <= 0) { a.alive = false; continue; }

                /* Counter-attack with species Attack stat. */
                p.hp -= a.species.stats.attack;
                if (p.hp <= 0) p.alive = false;
            }
        }

        /* Prune dead - stops array from ballooning over long runs. */
        board.animals   = board.animals.filter(a => a.alive);
        board.predators = board.predators.filter(p => p.alive);
    }

    _moveAnimal(a) {
        const b = this.level.board;
        const dx = EvoClasses.randInt(-1, 1);
        const dy = EvoClasses.randInt(-1, 1);
        a.x = EvoClasses.clamp(a.x + dx, 0, b.cols - 1);
        a.y = EvoClasses.clamp(a.y + dy, 0, b.rows - 1);
    }

    _movePredator(p, board) {
        /* Predators drift toward the nearest animal */
        let target = null, best = Infinity;
        for (const a of board.animals) {
            if (!a.alive) continue;
            const d = Math.abs(a.x - p.x) + Math.abs(a.y - p.y);
            if (d < best) { best = d; target = a; }
        }
        if (target) {
            p.x += Math.sign(target.x - p.x);
            p.y += Math.sign(target.y - p.y);
        } else {
            p.x = EvoClasses.clamp(p.x + EvoClasses.randInt(-1, 1), 0, board.cols - 1);
            p.y = EvoClasses.clamp(p.y + EvoClasses.randInt(-1, 1), 0, board.rows - 1);
        }
    }

    _respawnResource(type, board) {
        for (let i = 0; i < 8; i++) {
            const x = EvoClasses.randInt(0, board.cols - 1);
            const y = EvoClasses.randInt(0, board.rows - 1);
            if (board.tiles[y][x].type === "empty") {
                board.tiles[y][x].type = type;
                return;
            }
        }
    }

    _birth(mother, board) {
        /* Offspring inherits species and starts with same stats as mother */
        const gender = Math.random() < 0.5;
        board.animals.push(new EvoClasses.Animal(
            mother.species, mother.x, mother.y, gender
        ));
    }


    /* draw() */
    draw() {
        const c   = this.canvas;
        const ctx = this.ctx;
        const b   = this.level.board;

        /* Tile dimensions come from the canvas current size so the
         * board auto-scales when CSS resizes the element. */
        const tileW = c.width  / b.cols;
        const tileH = c.height / b.rows;

        /* 1. Grid + tile fills */
        for (let y = 0; y < b.rows; y++) {
            for (let x = 0; x < b.cols; x++) {
                const t = b.tiles[y][x];
                ctx.fillStyle = this._tileColor(t, b.stage.biome);
                ctx.fillRect(x * tileW, y * tileH, tileW, tileH);
                ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
                ctx.lineWidth = 1;
                ctx.strokeRect(x * tileW, y * tileH, tileW, tileH);
            }
        }

        /* 2. Resources - food shows as a small leaf, water as droplets */
        for (let y = 0; y < b.rows; y++) {
            for (let x = 0; x < b.cols; x++) {
                const t = b.tiles[y][x];
                if (t.type === "food")      this._drawFood(x * tileW, y * tileH, tileW, tileH);
                else if (t.type === "water") this._drawWater(x * tileW, y * tileH, tileW, tileH);
            }
        }

        /* 3. Predators */
        for (const p of b.predators) {
            if (!p.alive) continue;
            this._drawPredator(p.x * tileW, p.y * tileH, tileW, tileH);
        }

        /* 4. Population members  */
        for (const a of b.animals) {
            if (!a.alive) continue;
            this._drawAnimal(a.x * tileW, a.y * tileH, tileW, tileH, a.species.appearance.headColor);
        }
    }

    _tileColor(tile, biome) {
        
        const base = {
            grass:    "#d7dca7",
            forest:   "#b5c686",
            swamp:    "#9db48f",
            mountain: "#c5c1b4",
            ice:      "#dce7ec"
        };
        return base[biome] || "#e4e4c9";
    }

    _drawFood(x, y, w, h) {
        const cx = x + w / 2, cy = y + h / 2;
        this.ctx.fillStyle = "#3d8b3a";
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, w * 0.28, h * 0.18, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    _drawWater(x, y, w, h) {
        this.ctx.fillStyle = "#5aa8d6";
        this.ctx.fillRect(x + w * 0.1, y + h * 0.1, w * 0.8, h * 0.8);
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        this.ctx.fillRect(x + w * 0.15, y + h * 0.15, w * 0.25, h * 0.1);
    }

    _drawAnimal(x, y, w, h, color) {
        const cx = x + w / 2, cy = y + h / 2;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, Math.min(w, h) * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "#111";
        this.ctx.beginPath();
        this.ctx.arc(cx - w * 0.08, cy - h * 0.05, Math.min(w, h) * 0.06, 0, Math.PI * 2);
        this.ctx.arc(cx + w * 0.08, cy - h * 0.05, Math.min(w, h) * 0.06, 0, Math.PI * 2);
        this.ctx.fill();
    }

    _drawPredator(x, y, w, h) {
        const cx = x + w / 2, cy = y + h / 2;
        this.ctx.fillStyle = "#7a2323";
        /* A simple spiky shape - a triangle with two smaller triangles on top for ears */
        this.ctx.beginPath();
        this.ctx.moveTo(cx, y + h * 0.15);
        this.ctx.lineTo(x + w * 0.85, y + h * 0.85);
        this.ctx.lineTo(x + w * 0.15, y + h * 0.85);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = "#f2d16b";
        this.ctx.beginPath();
        this.ctx.arc(cx, cy + h * 0.1, Math.min(w, h) * 0.06, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

/* Export to global */
window.EvoEngine = { Simulation };
