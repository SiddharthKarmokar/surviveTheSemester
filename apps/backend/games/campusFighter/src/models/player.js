import { CircleBody } from '../geometry';
import { Maths } from '..';

/**
 * PlayerJSON structure
 * 
 * @typedef {Object} PlayerJSON
 * @property {number} x
 * @property {number} y
 * @property {number} radius
 * @property {number} rotation
 * @property {string} playerId
 * @property {string} name
 * @property {number} lives
 * @property {number} maxLives
 * @property {string} [team]
 * @property {string} color
 * @property {number} kills
 * @property {number} [ack]
 */

export function movePlayer(player, dirX, dirY, speed, walls) {
    const magnitude = Maths.normalize2D(dirX, dirY);
    if (magnitude === 0) return;

    player.x += dirX * speed;
    player.y += dirY * speed;

    const corrected = walls.correctWithCircle(
        new CircleBody(player.x, player.y, player.radius)
    );

    player.x = corrected.x;
    player.y = corrected.y;
}