// Game states
export const GAME_STATES = {
    WAITING: 'waiting',
    LOBBY: 'lobby',
    GAME: 'game'
};

// Game modes
export const GAME_MODES = {
    DEATHMATCH: 'deathmatch',
    TEAM_DEATHMATCH: 'team deathmatch'
};

// Teams
export const TEAMS = {
    RED: 'Red',
    BLUE: 'Blue'
};

// Wall collision types
export const WALL_COLLISION_TYPES = {
    FULL: 'full',
    NONE: 'none'
};

/**
 * PlayerOptions
 * @typedef {Object} PlayerOptions
 * @property {string} [playerName]
 */

/**
 * RoomOptions
 * @typedef {Object} RoomOptions
 * @property {string} [playerName]
 * @property {string} roomName
 * @property {string} roomMap
 * @property {number} roomMaxPlayers
 * @property {string} mode
 */