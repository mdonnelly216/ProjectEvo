/* 
 * game-data.js
 * Project Evo - game data.
 */

"use strict";

/* TRAITS */
const TRAITS = [
    { key: "hp",        label: "HP",             short: "HP",  min: 1,  max: 30, help: "Health points per population member." },
    { key: "attack",    label: "Attack",         short: "STR", min: 0,  max: 30, help: "Damage dealt to predators and rival species." },
    { key: "defense",   label: "Defense",        short: "DEF", min: 0,  max: 30, help: "Damage reduction when attacked." },
    { key: "speed",     label: "Speed",          short: "SPE", min: 1,  max: 30, help: "Tiles moved per simulation tick." },
    { key: "evasion",   label: "Evasion",        short: "EVA", min: 0,  max: 30, help: "Chance to dodge a predator encounter." },
    { key: "hungerRate",label: "Hunger Rate",    short: "HUN", min: 1,  max: 30, help: "Higher = gets hungry faster (bad)." },
    { key: "incubation",label: "Incubation Time",short: "INC", min: 1,  max: 30, help: "Ticks needed for females to reproduce (lower = faster births)." }
];

/* INITIAL STAT ALLOCATION */
const STAT_POOL_INITIAL    = 35;   // total points at creation
const STAT_POOL_PER_LEVEL  = 15;   // bonus pool granted after each win
const STAT_DEFAULT_VALUE   = 5;    // starting value per trait

/* MUTATIONS */
const MUTATIONS = [
    {
        id: "wings",
        name: "Wings",
        blurb: "Evasion +, Defense -, Speed +",
        effects: { evasion: +4, defense: -2, speed: +2 },
        conflicts: ["flippers"]
    },
    {
        id: "warmBlooded",
        name: "Warm Blooded",
        blurb: "Hunger Rate -, Speed +",
        effects: { hungerRate: -3, speed: +2 },
        conflicts: []
    },
    {
        id: "bigTail",
        name: "Big Tail",
        blurb: "Attack +, Speed +, HP -",
        effects: { attack: +3, speed: +2, hp: -2 },
        conflicts: []
    },
    {
        id: "spikySkin",
        name: "Spiky Skin",
        blurb: "Defense +, Speed -",
        effects: { defense: +4, speed: -2 },
        conflicts: []
    },
    {
        id: "camouflage",
        name: "Camouflage",
        blurb: "Evasion +, Attack -",
        effects: { evasion: +5, attack: -2 },
        conflicts: []
    },
    {
        id: "flippers",
        name: "Flippers",
        blurb: "Speed + in water, Defense -",
        effects: { speed: +3, defense: -2 },
        conflicts: ["wings"]
    },
    {
        id: "thickFur",
        name: "Thick Fur",
        blurb: "HP +, Hunger Rate -, Speed -",
        effects: { hp: +4, hungerRate: -2, speed: -2 },
        conflicts: []
    }
];

/* STAGES */
const STAGES = [
    { number: 1, name: "Grasslands", biome: "grass",    predatorCount: 1, foodCount: 6, waterCount: 3, winPopulation: 5,  tickLimit: 260 },
    { number: 2, name: "Woodlands",  biome: "forest",   predatorCount: 2, foodCount: 6, waterCount: 3, winPopulation: 7,  tickLimit: 260 },
    { number: 3, name: "Wetlands",   biome: "swamp",    predatorCount: 3, foodCount: 5, waterCount: 5, winPopulation: 9,  tickLimit: 260 },
    { number: 4, name: "Highlands",  biome: "mountain", predatorCount: 3, foodCount: 4, waterCount: 2, winPopulation: 10, tickLimit: 280 },
    { number: 5, name: "Tundra",     biome: "ice",      predatorCount: 4, foodCount: 3, waterCount: 2, winPopulation: 12, tickLimit: 300 }
];

/*  BOARD */
const BOARD_COLS = 10;
const BOARD_ROWS = 8;

/* SIMULATION TUNING */
const SIM_TICK_MS          = 180;    // real ms between simulation ticks
const SIM_STARTING_POP     = 5;      // population size at Stage 1 start
const SIM_FOOD_RESTORE     = 40;     // hunger reduction on eating food
const SIM_PREDATOR_DMG     = 12;     // base damage predators inflict
const SIM_REPRO_HUNGER_MAX = 55;     // must be below this to breed
const SIM_LOSS_POPULATION  = 2;      // below this -> game over

/* Export to global */
window.EvoData = {
    TRAITS,
    STAT_POOL_INITIAL,
    STAT_POOL_PER_LEVEL,
    STAT_DEFAULT_VALUE,
    MUTATIONS,
    STAGES,
    BOARD_COLS,
    BOARD_ROWS,
    SIM_TICK_MS,
    SIM_STARTING_POP,
    SIM_FOOD_RESTORE,
    SIM_PREDATOR_DMG,
    SIM_REPRO_HUNGER_MAX,
    SIM_LOSS_POPULATION
};
