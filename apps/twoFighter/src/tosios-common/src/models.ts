import { CircleBody } from '../../../../backend/games/campusFighter/src/geometry.js';

export const ACTION_TYPES = {
    MOVE: 'move',
    ROTATE: 'rotate',
    SHOOT: 'shoot',
} as const;

export const MESSAGE_TYPES = {
    WAITING: 'waiting',
    START: 'start',
    STOP: 'stop',
    JOINED: 'joined',
    KILLED: 'killed',
    WON: 'won',
    LEFT: 'left',
    TIMEOUT: 'timeout',
} as const;

export type PropType = string;

export interface BaseCircle {
    x: number;
    y: number;
    radius: number;
}

export interface PlayerJSON extends BaseCircle {
    rotation: number;
    playerId: string;
    name: string;
    lives: number;
    maxLives: number;
    team?: string;
    color: string;
    kills: number;
    ack?: number;
}

export interface MonsterJSON extends BaseCircle {
    lives: number;
    maxLives?: number;
}

export interface PropJSON extends BaseCircle {
    type: string;
}

export interface BulletJSON extends BaseCircle {
    rotation: number;
    active: boolean;
    fromX: number;
    fromY: number;
    shotAt: number;
    playerId: string;
    team?: string;
    color: string;
}

export interface MessageJSON {
    type: string;
    ts: number;
    from: string;
    params: any;
}

export interface ActionJSON {
    type: string;
    ts: number;
    playerId: string;
    value: any;
}

export function movePlayer(
    x: number,
    y: number,
    radius: number,
    dirX: number,
    dirY: number,
    speed: number,
    walls: { correctWithCircle: (body: CircleBody) => CircleBody },
) {
    const magnitude = Math.hypot(dirX, dirY);
    if (magnitude === 0) {
        return { x, y };
    }

    const nextX = x + dirX * speed;
    const nextY = y + dirY * speed;
    const corrected = walls.correctWithCircle(new CircleBody(nextX, nextY, radius));

    return {
        x: corrected.x,
        y: corrected.y,
    };
}
