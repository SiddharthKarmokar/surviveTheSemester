import { defineTypes } from '@colyseus/schema';
import { Constants, gameConstants, Maths } from '../src/index.js';
import { Circle } from './circle.js';

export class Monster extends Circle {

    constructor(x, y, radius, mapWidth, mapHeight, lives) {
        super(x, y, radius);

        this.rotation = 0;

        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.lives = lives;

        this.state = 'idle';
        this.lastActionAt = Date.now();
        this.lastAttackAt = Date.now();
        this.idleDuration = 0;
        this.patrolDuration = 0;
        this.targetPlayerId = null;
    }

    update(players) {
        switch (this.state) {
            case 'idle':
                this.updateIdle(players);
                break;
            case 'patrol':
                this.updatePatrol(players);
                break;
            case 'chase':
                this.updateChase(players);
                break;
        }
    }

    updateIdle(players) {

        if (this.lookForPlayer(players)) return;

        const delta = Date.now() - this.lastActionAt;

        if (delta > this.idleDuration) {
            this.startPatrol();
        }
    }

    updatePatrol(players) {

        if (this.lookForPlayer(players)) return;

        const delta = Date.now() - this.lastActionAt;

        if (delta > this.patrolDuration) {
            this.startIdle();
            return;
        }

        this.move(Constants.MONSTER_SPEED_PATROL, this.rotation);

        if (
            this.x < Constants.TILE_SIZE ||
            this.x > this.mapWidth - gameConstants.TILE_SIZE ||
            this.y < Constants.TILE_SIZE ||
            this.y > this.mapHeight - gameConstants.TILE_SIZE
        ) {
            this.x = Maths.clamp(this.x, 0, this.mapWidth);
            this.y = Maths.clamp(this.y, 0, this.mapHeight);
            this.rotation = Maths.getRandomInt(-3, 3);
        }
    }

    updateChase(players) {

        const player = getPlayerFromId(this.targetPlayerId, players);

        if (!player || !player.isAlive) {
            this.startIdle();
            return;
        }

        const distance = Maths.getDistance(this.x, this.y, player.x, player.y);

        if (distance > Constants.MONSTER_SIGHT) {
            this.startIdle();
            return;
        }

        this.rotation = Maths.calculateAngle(player.x, player.y, this.x, this.y);
        this.move(Constants.MONSTER_SPEED_CHASE, this.rotation);
    }

    startIdle() {

        this.state = 'idle';
        this.rotation = 0;
        this.targetPlayerId = null;

        this.idleDuration = Maths.getRandomInt(
            Constants.MONSTER_IDLE_DURATION_MIN,
            Constants.MONSTER_IDLE_DURATION_MAX
        );

        this.lastActionAt = Date.now();
    }

    startPatrol() {

        this.state = 'patrol';
        this.targetPlayerId = null;

        this.patrolDuration = Maths.getRandomInt(
            Constants.MONSTER_PATROL_DURATION_MIN,
            Constants.MONSTER_PATROL_DURATION_MAX
        );

        this.rotation = Maths.getRandomInt(-3, 3);

        this.lastActionAt = Date.now();
    }

    startChase(playerId) {

        this.state = 'chase';
        this.targetPlayerId = playerId;
        this.lastActionAt = Date.now();
    }

    lookForPlayer(players) {

        if (!this.targetPlayerId) {

            const playerId = getClosestPlayerId(this.x, this.y, players);

            if (playerId) {
                this.startChase(playerId);
                return true;
            }
        }

        return false;
    }

    hurt() {
        this.lives -= 1;
    }

    move(speed, rotation) {

        this.x += Math.cos(rotation) * speed;
        this.y += Math.sin(rotation) * speed;
    }

    attack() {
        this.lastAttackAt = Date.now();
    }

    get isAlive() {
        return this.lives > 0;
    }

    get canAttack() {

        const delta = Math.abs(this.lastAttackAt - Date.now());

        return this.state === 'chase' && delta > Constants.MONSTER_ATTACK_BACKOFF;
    }
}

defineTypes(Monster, {
    rotation: "number"
});


function getPlayerFromId(id, players) {
    return players.get(id);
}

function getClosestPlayerId(x, y, players) {

    let closestId = null
    let closestDist = Infinity

    players.forEach((player, id) => {
    if (!player.isAlive) return

    const d = Maths.getDistance(x, y, player.x, player.y)

    if (d < closestDist && d <= Constants.MONSTER_SIGHT) {
        closestDist = d
        closestId = id
    }
    });

    return closestId;
}