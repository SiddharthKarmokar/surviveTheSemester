/**
 * A partial definition of the TMX format in JSON.
 */
export const TMX = {};

/**
 * @typedef {Object} TMX.IMap
 * @property {number} tilewidth   Width in pixels
 * @property {number} tileheight  Height in pixels
 * @property {number} width       Width in tiles
 * @property {number} height      Height in tiles
 * @property {TMX.ITileSet[]} tilesets
 * @property {TMX.ILayer[]} layers
 */

/**
 * Tileset used by layers
 * @typedef {Object} TMX.ITileSet
 * @property {string} name
 * @property {number} columns
 * @property {string} image
 * @property {number} margin
 * @property {number} spacing
 * @property {number} imageheight
 * @property {number} imagewidth
 * @property {number} tilewidth
 * @property {number} tileheight
 * @property {number} tilecount
 * @property {number} firstgid
 * @property {TMX.ITile[]} tiles
 */

/**
 * @typedef {Object} TMX.ITile
 * @property {number} id
 * @property {TMX.ITileAnimFrame[]} [animation]
 * @property {string} [type]
 * @property {TMX.ITileObjectGroup} [objectgroup]
 */

/**
 * @typedef {Object} TMX.ITileAnimFrame
 * @property {number} duration
 * @property {number} tileid
 */

/**
 * @typedef {Object} TMX.ITileObjectGroup
 * @property {number} x
 * @property {number} y
 * @property {string} name
 * @property {string} draworder
 * @property {boolean} visible
 * @property {string} type
 * @property {number} opacity
 */

/**
 * Different layers of the map
 * @typedef {Object} TMX.ILayer
 * @property {number} id
 * @property {string} name
 * @property {string} type
 * @property {number} x
 * @property {number} y
 * @property {number} width   In tile unit
 * @property {number} height  In tile unit
 * @property {number} opacity
 * @property {boolean} visible
 * @property {number[]} data  Tiles from left-to-right, top-to-bottom
 */