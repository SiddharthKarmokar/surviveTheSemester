/**
 * @typedef {Object} ITile
 * @property {number} tileId
 * @property {number[]} [tileIds]   // Used for animated tiles
 * @property {string} [type]        // Collision type ('full', 'half', etc.)
 * @property {number} minX
 * @property {number} minY
 * @property {number} maxX
 * @property {number} maxY
 */

/**
 * @typedef {Object} ISpriteLayer
 * @property {string} name
 * @property {ITile[]} tiles
 */

/**
 * @typedef {Object.<string, ITile>} ITileSets
 */