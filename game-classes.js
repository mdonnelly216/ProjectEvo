/* 
 * game-classes.js
 * Project Evo - Domain classes and game logic
 *   The three-tier architecture keeps game logic inside the
 */

"use strict";

/* A short function used all over the file */
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* Clamp a value to a min/max range. */
function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}


/* 
 * Mutation 
 * MUTATIONS[] row from game-data.js defines the possible mutations
 */
class Mutation {

    constructor(definition) {
        this.id        = definition.id;
        this.name      = definition.name;
        this.blurb     = definition.blurb;
        this.effects   = definition.effects;
        this.conflicts = definition.conflicts || [];
    }

    /* Check if this mutation can be applied to the given species */
    isValid(species) {
        for (const existingId of species.mutations) {
            if (this.conflicts.includes(existingId)) return false;
        }
        return true;
    }

    /* Apply the effects of this mutation to the given species */
    applyTo(species) {
        for (const [traitKey, delta] of Object.entries(this.effects)) {
            const trait = EvoData.TRAITS.find(t => t.key === traitKey);
            if (!trait) continue;
            species.stats[traitKey] = clamp(
                species.stats[traitKey] + delta,
                trait.min,
                trait.max
            );
        }
        species.mutations.push(this.id);
    }
}


/* Species */
class Species {

    constructor(name) {
        this.id        = Date.now() + Math.floor(Math.random() * 1000);
        this.name      = name || "Unnamed";
        this.mutations = [];   // array of mutation ids
       
        this.appearance = {
            headShape:  "round",
            headColor:  "#e87a3a",   
            feature:    "spikes",
            featureColor: "#c0602b",
            eyeShape:   "round",
            eyeColor:   "#111111",
            animalType: "Bird"
        };
        
        this.stats = {};
        for (const t of EvoData.TRAITS) {
            this.stats[t.key] = EvoData.STAT_DEFAULT_VALUE;
        }
    }

    
    pointsSpent() {
        return Object.values(this.stats).reduce((sum, v) => sum + v, 0);
    }

    /* Randomize allocation */
    randomize(pool) {
        for (const t of EvoData.TRAITS) this.stats[t.key] = t.min;
        let remaining = pool - this.pointsSpent();
        while (remaining > 0) {
            const t = EvoData.TRAITS[randInt(0, EvoData.TRAITS.length - 1)];
            if (this.stats[t.key] < t.max) {
                this.stats[t.key]++;
                remaining--;
            }
        }
    }
}


/* Animal */
class Animal {

    constructor(species, x, y, gender) {
        this.species = species;       // reference to owner Species
        this.x       = x;             // current column
        this.y       = y;             // current row
        this.hp      = species.stats.hp * 10;        // scale to a usable HP bar
        this.hunger  = 0.0;                          // 0 = full, 100 = starving
        this.gender  = gender;                       // true=male, false=female
        this.age     = 0;                            // ticks lived
        this.incubating = 0;                         // ticks until birth (female only)
        this.alive   = true;
    }

    get maxHp()  { return this.species.stats.hp * 10; }
    get isFemale() { return this.gender === false; }
}


/* Predator */
class Predator {
    constructor(x, y, power) {
        this.x = x;
        this.y = y;
        this.hp = 20 + power * 4;
        this.power = power;
        this.alive = true;
    }
}


/* Tile */
class Tile {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type || "empty";
    }
}


/* Board / Environment */
class Board {

    constructor(cols, rows, stage) {
        this.cols = cols;
        this.rows = rows;
        this.stage = stage;
        this.tiles = [];
        for (let y = 0; y < rows; y++) {
            this.tiles.push([]);
            for (let x = 0; x < cols; x++) {
                this.tiles[y].push(new Tile(x, y, "empty"));
            }
        }
        this.animals   = [];
        this.predators = [];
        this.seedResources();
    }

    /* Randomly place food and water on the board according to the stage definition. */
    seedResources() {
        const place = (type, count) => {
            let placed = 0, guard = 0;
            while (placed < count && guard++ < 500) {
                const x = randInt(0, this.cols - 1);
                const y = randInt(0, this.rows - 1);
                if (this.tiles[y][x].type === "empty") {
                    this.tiles[y][x].type = type;
                    placed++;
                }
            }
        };
        place("food",  this.stage.foodCount);
        place("water", this.stage.waterCount);
    }

    /* Add an animal at a random empty-ish tile. */
    spawnAnimal(species, gender) {
        const x = randInt(0, this.cols - 1);
        const y = randInt(0, this.rows - 1);
        this.animals.push(new Animal(species, x, y, gender));
    }

    /* Spawn one predator, scaled by stage number for difficulty. */
    spawnPredator(stageNumber) {
        const x = randInt(0, this.cols - 1);
        const y = randInt(0, this.rows - 1);
        this.predators.push(new Predator(x, y, stageNumber));
    }

    /* Count living population members. */
    population() {
        return this.animals.filter(a => a.alive).length;
    }
}


/* Level - holds the board and the active species, and evaluates win/loss conditions */
class Level {

    constructor(stage, species) {
        this.stage   = stage;
        this.species = species;
        this.board   = new Board(EvoData.BOARD_COLS, EvoData.BOARD_ROWS, stage);
        this.tick    = 0;

        
        for (let i = 0; i < EvoData.SIM_STARTING_POP; i++) {
            this.board.spawnAnimal(species, i % 2 === 0);
        }
        for (let i = 0; i < stage.predatorCount; i++) {
            this.board.spawnPredator(stage.number);
        }
    }

    /* Win condition */
    evaluate() {
        const pop = this.board.population();
        if (pop < EvoData.SIM_LOSS_POPULATION) return "loss";
        if (pop >= this.stage.winPopulation && this.tick >= 60) return "win";
        if (this.tick >= this.stage.tickLimit && pop >= this.stage.winPopulation) return "win";
        if (this.tick >= this.stage.tickLimit) return "loss";
        return "running";
    }
}

/* Game */
class Game {

    constructor(username) {
        this.username    = username || "guest";
        this.species     = [];
        this.activeSpecies = null;
        this.level       = null;
        this.score       = 0;
        this.currentLevel = 1;
        this.loadSpeciesFromStorage();
    }

    /* species management */

    createSpecies(name) {
        const s = new Species(name || `Species #${this.species.length + 1}`);
        this.species.push(s);
        this.saveSpeciesToStorage();
        return s;
    }

    selectSpecies(speciesId) {
        this.activeSpecies = this.species.find(s => s.id === speciesId) || null;
        return this.activeSpecies;
    }

    /* level progression */

    /* Start a new game with the currently active species.  Returns the new Level instance. */
    startNewGame() {
        if (!this.activeSpecies) throw new Error("No species selected");
        this.currentLevel = 1;
        this.score = 0;
        this.level = new Level(EvoData.STAGES[0], this.activeSpecies);
        return this.level;
    }

    /* Advance to the next stage.  Returns null when all stages done. */
    advanceLevel() {
        this.currentLevel++;
        if (this.currentLevel > EvoData.STAGES.length) return null;
        const stage = EvoData.STAGES[this.currentLevel - 1];
        this.level = new Level(stage, this.activeSpecies);
        return this.level;
    }

    /* Score formula: base per cleared stage + survivors at clear time. */
    awardStageScore(survivors) {
        this.score += 1000 * this.currentLevel + survivors * 50;
    }

    /* Pick 3 random mutations */
    rollMutationChoices(count = 3) {
        const valid = EvoData.MUTATIONS
            .filter(m => !this.activeSpecies.mutations.includes(m.id))
            .filter(m => new Mutation(m).isValid(this.activeSpecies));
        /* Fisher-Yates shuffle */
        for (let i = valid.length - 1; i > 0; i--) {
            const j = randInt(0, i);
            [valid[i], valid[j]] = [valid[j], valid[i]];
        }
        return valid.slice(0, count);
    }

    /* Apply a chosen mutation to the active species */
    applyMutation(mutationId) {
        const def = EvoData.MUTATIONS.find(m => m.id === mutationId);
        if (!def) return { ok: false, message: "Unknown mutation." };
        const mut = new Mutation(def);
        if (!mut.isValid(this.activeSpecies)) {
            return { ok: false, message: `${def.name} conflicts with a previous mutation.` };
        }
        mut.applyTo(this.activeSpecies);
        return { ok: true, message: `${def.name} applied.` };
    }

    
    saveSpeciesToStorage() {
        try {
            localStorage.setItem(
                `evo.species.${this.username}`,
                JSON.stringify(this.species)
            );
        } catch (_) {  /* private browsing etc - silently ignore */ }
    }

    loadSpeciesFromStorage() {
        try {
            const raw = localStorage.getItem(`evo.species.${this.username}`);
            if (!raw) return;
            const arr = JSON.parse(raw);
            /* Rehydrate into Species instances so methods still work. */
            this.species = arr.map(obj => Object.assign(new Species(obj.name), obj));
        } catch (_) { this.species = []; }
    }

}


window.EvoClasses = {
    Mutation, Species, Animal, Predator, Tile, Board, Level, Game, randInt, clamp
};
