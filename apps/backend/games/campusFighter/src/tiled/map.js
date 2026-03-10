/**
 * A class used to parse Tiled maps from JSON.
 */
export class Map {

    // Constructor
    constructor(data, fixedTileSize) {
        if (!data) {
            throw Error('Map does not exist');
        }

        // Metrics
        this.mapWidthUnits = data.width;
        this.mapHeightUnits = data.height;
        this.fixedTileSize = fixedTileSize;

        this.imageName = '';
        this.tilesets = {};
        this.collisions = [];
        this.spawners = [];
        this.layers = [];

        this.computeTileSets(data.tilesets);
        this.computeCollisions(data.layers);
        this.computeSpawners(data.layers);
        this.computeLayers(data.layers);
    }

    // Methods
    computeTileSets(tilesets) {
        if (!tilesets || !tilesets.length) {
            return;
        }

        const foundTileset = tilesets[0];
        const offset = foundTileset.firstgid;
        this.imageName = foundTileset.image;

        const tileWidth = foundTileset.tilewidth;
        const tileHeight = foundTileset.tileheight;
        const imageWidthInUnits = foundTileset.imagewidth / tileWidth;

        let col = 0;
        let row = 0;
        let x;
        let y;

        for (let i = 0; i < foundTileset.tilecount; i++) {
            const tileId = i + offset;

            x = col * tileWidth;
            y = row * tileHeight;

            this.tilesets[tileId] = {
                tileId,
                minX: x,
                minY: y,
                maxX: x + tileWidth,
                maxY: y + tileHeight,
            };

            col++;

            if (col === imageWidthInUnits) {
                col = 0;
                row++;
            }
        }

        // Compute special tiles
        foundTileset.tiles.forEach((tile) => {
            const tileId = tile.id + offset;

            if (tile.animation && tile.animation.length > 0) {
                const animationId = tileId;
                const foundTile = this.tilesets[animationId];

                if (foundTile) {
                    this.tilesets[animationId].tileIds =
                        tile.animation.map((frame) => frame.tileid + offset);
                }
            }

            if (tile.type) {
                this.tilesets[tileId].type = tile.type;
            }
        });
    }

    computeCollisions(layers) {
        const foundLayer = layers.find((layer) => layer.name === 'collisions');
        if (!foundLayer) return;

        this.collisions = this.parseLayer(foundLayer.data);
    }

    computeSpawners(layers) {
        const foundLayer = layers.find((layer) => layer.name === 'spawners');
        if (!foundLayer) return;

        this.spawners = this.parseLayer(foundLayer.data);
    }

    computeLayers(layers) {
        if (!layers || !layers.length) return;

        layers.forEach((layer) => {
            this.layers.push({
                name: layer.name,
                tiles: this.parseLayer(layer.data),
            });
        });
    }

    parseLayer(data) {
        if (!data || !data.length) {
            return [];
        }

        let col = 0;
        let row = 0;
        let x = 0;
        let y = 0;

        const tileWidth = this.fixedTileSize;
        const tileHeight = this.fixedTileSize;

        const tiles = [];

        data.forEach((tileId) => {

            if (tileId !== 0) {
                const foundTile = this.tilesets[tileId];

                x = col * tileWidth;
                y = row * tileHeight;

                tiles.push({
                    tileId,
                    minX: x,
                    minY: y,
                    maxX: x + tileWidth,
                    maxY: y + tileHeight,
                    ...(foundTile?.type && { type: foundTile.type }),
                });
            }

            col++;

            if (col === this.widthInUnits) {
                col = 0;
                row++;
            }

        });

        return tiles;
    }

    // Getters
    get widthInUnits() {
        return this.mapWidthUnits;
    }

    get heightInUnits() {
        return this.mapHeightUnits;
    }

    get widthInPixels() {
        return this.mapWidthUnits * this.fixedTileSize;
    }

    get heightInPixels() {
        return this.mapHeightUnits * this.fixedTileSize;
    }
}