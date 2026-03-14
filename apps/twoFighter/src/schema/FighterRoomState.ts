import { ArraySchema, MapSchema, Schema, defineTypes } from '@colyseus/schema';

class CircleState extends Schema {
    x = 0;
    y = 0;
    radius = 0;
}

defineTypes(CircleState, {
    x: 'number',
    y: 'number',
    radius: 'number',
});

class GameNode extends Schema {
    state = 'lobby';
    roomName = '';
    mapName = '';
    lobbyEndsAt = 0;
    gameEndsAt = 0;
    maxPlayers = 0;
    mode = '';
}

defineTypes(GameNode, {
    state: 'string',
    roomName: 'string',
    mapName: 'string',
    lobbyEndsAt: 'number',
    gameEndsAt: 'number',
    maxPlayers: 'number',
    mode: 'string',
});

class PlayerNode extends CircleState {
    playerId = '';
    name = '';
    lives = 0;
    maxLives = 0;
    team = '';
    color = '#FFFFFF';
    kills = 0;
    rotation = 0;
    ack = 0;
}

defineTypes(PlayerNode, {
    playerId: 'string',
    name: 'string',
    lives: 'number',
    maxLives: 'number',
    team: 'string',
    color: 'string',
    kills: 'number',
    rotation: 'number',
    ack: 'number',
});

class MonsterNode extends CircleState {
    rotation = 0;
}

defineTypes(MonsterNode, {
    rotation: 'number',
});

class PropNode extends CircleState {
    type = '';
    active = true;
}

defineTypes(PropNode, {
    type: 'string',
    active: 'boolean',
});

class BulletNode extends CircleState {
    playerId = '';
    team = '';
    rotation = 0;
    fromX = 0;
    fromY = 0;
    active = true;
    color = '#FFFFFF';
    shotAt = 0;
}

defineTypes(BulletNode, {
    playerId: 'string',
    team: 'string',
    rotation: 'number',
    fromX: 'number',
    fromY: 'number',
    active: 'boolean',
    color: 'string',
    shotAt: 'number',
});

export class FighterRoomState extends Schema {
    game = new GameNode();
    players = new MapSchema<PlayerNode>();
    monsters = new MapSchema<MonsterNode>();
    props = new ArraySchema<PropNode>();
    bullets = new ArraySchema<BulletNode>();
}

defineTypes(FighterRoomState, {
    game: GameNode,
    players: { map: PlayerNode },
    monsters: { map: MonsterNode },
    props: [PropNode],
    bullets: [BulletNode],
});
