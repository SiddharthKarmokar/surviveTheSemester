export const ACTION_TYPES = {
    MOVE: 'move',
    ROTATE: 'rotate',
    SHOOT: 'shoot'
};

/**
 * @typedef {'move' | 'rotate' | 'shoot'} ActionType
 */

/**
 * @typedef {Object} ActionJSON
 * @property {ActionType} type
 * @property {number} ts
 * @property {string} playerId
 * @property {*} value
 */