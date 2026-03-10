import { COLLISION_TYPES } from './types.js';
import { RectangleBody } from '../geometry.js';
import { circleToRectangleSide, rectangleToRectangleSide } from './index.js';
import RBush from 'rbush';

/**
 * A R-Tree implementation handling Rectangle and Circle bodies
 */
export class TreeCollider extends RBush {

    // Collisions
    collidesWithRectangle(body, type) {
        if (!type) {
            return this.collides({
                minX: body.left,
                minY: body.top,
                maxX: body.right,
                maxY: body.bottom,
            });
        }

        const leaves = this.searchWithRectangle(body);
        if (!leaves || !leaves.length) {
            return false;
        }

        for (const wall of leaves) {
            if (wall.collider === 'full') {
                return true;
            }
        }

        return false;
    }

    collidesWithCircle(body, type) {
        if (!type) {
            return this.collides({
                minX: body.left,
                minY: body.top,
                maxX: body.right,
                maxY: body.bottom,
            });
        }

        const leaves = this.searchWithCircle(body);
        if (!leaves || !leaves.length) {
            return false;
        }

        for (const wall of leaves) {
            if (wall.collider === 'full') {
                return true;
            }
        }

        return false;
    }

    // Searches
    searchWithRectangle(body) {
        return this.search({
            minX: body.left,
            minY: body.top,
            maxX: body.right,
            maxY: body.bottom,
        });
    }

    searchWithCircle(body) {
        return this.search({
            minX: body.left,
            minY: body.top,
            maxX: body.right,
            maxY: body.bottom,
        });
    }

    // Corrects
    correctWithRectangle(body) {
        const leaves = this.searchWithRectangle(body);

        if (!leaves || !leaves.length) {
            return body;
        }

        const updatedBody = body.copy();
        const leafBody = new RectangleBody(0, 0, 0, 0);

        for (const wall of leaves) {
            if (!wall.collider || !COLLISION_TYPES.includes(wall.collider)) {
                continue;
            }

            leafBody.x = wall.minX;
            leafBody.y = wall.minY;
            leafBody.width = wall.maxX - wall.minX;
            leafBody.height = wall.maxY - wall.minY;

            const side = rectangleToRectangleSide(updatedBody, leafBody);

            switch (side) {
                case 'left':
                    updatedBody.right = leafBody.left;
                    break;

                case 'top':
                    updatedBody.bottom = leafBody.top;
                    break;

                case 'right':
                    updatedBody.left = leafBody.right;
                    break;

                case 'bottom':
                    updatedBody.top = leafBody.bottom;
                    break;

                default:
                    break;
            }
        }

        return updatedBody;
    }

    correctWithCircle(body) {
        const leaves = this.searchWithCircle(body);

        if (!leaves || !leaves.length) {
            return body;
        }

        const updatedBody = body.copy();
        const leafBody = new RectangleBody(0, 0, 0, 0);

        for (const wall of leaves) {
            if (!wall.collider || !COLLISION_TYPES.includes(wall.collider)) {
                continue;
            }

            leafBody.x = wall.minX;
            leafBody.y = wall.minY;
            leafBody.width = wall.maxX - wall.minX;
            leafBody.height = wall.maxY - wall.minY;

            const side = circleToRectangleSide(body, leafBody);

            switch (side) {
                case 'left':
                    updatedBody.right = leafBody.left;
                    break;

                case 'top':
                    updatedBody.bottom = leafBody.top;
                    break;

                case 'right':
                    updatedBody.left = leafBody.right;
                    break;

                case 'bottom':
                    updatedBody.top = leafBody.bottom;
                    break;

                default:
                    break;
            }
        }

        return updatedBody;
    }

    // Getters
    getAllByType(type) {
        const walls = this.all();

        const filtered = walls.filter((wall) => wall.type === type);

        const mapped = filtered.map(
            (wall) => new RectangleBody(wall.minX, wall.minY, wall.maxX, wall.maxY)
        );

        return mapped;
    }
}