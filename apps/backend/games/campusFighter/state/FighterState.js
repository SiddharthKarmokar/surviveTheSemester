import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";
import { Bullet, Game, Monster, Player, Prop } from "../entities/index.js";

import {
  Collisions,
  Constants,
  Entities,
  Geometry,
  Maps,
  Maths,
  // Models,
  Tiled
} from "../src/index.js";

export class GameState extends Schema {

  constructor(roomName, mapName, maxPlayers, mode, onMessage) {
    super();

    this.game = new Game({
      roomName,
      mapName,
      maxPlayers,
      mode,
      onWaitingStart: this.handleWaitingStart.bind(this),
      onLobbyStart: this.handleLobbyStart.bind(this),
      onGameStart: this.handleGameStart.bind(this),
      onGameEnd: this.handleGameEnd.bind(this),
    });

    this.players = new MapSchema();
    this.monsters = new MapSchema();
    this.props = new ArraySchema();
    this.bullets = new ArraySchema();

    this.map = null;
    this.walls = null;
    this.spawners = [];
    this.actions = [];
    this.onMessage = onMessage;

    this.initializeMap(mapName);
  }

  update() {
    this.updateGame();
    this.updatePlayers();
    this.updateMonsters();
    this.updateBullets();
  }

  updateGame() {
    this.game.update(this.players);
  }

  updatePlayers() {
    while (this.actions.length > 0) {
      const action = this.actions.shift();

      switch (action.type) {
        case "move":
          this.playerMove(action.playerId, action.ts, action.value);
          break;

        case "rotate":
          this.playerRotate(action.playerId, action.ts, action.value.rotation);
          break;

        case "shoot":
          this.playerShoot(action.playerId, action.ts, action.value.angle);
          break;
      }
    }
  }

  updateMonsters() {
    this.monsters.forEach((monster, id) => {
      this.monsterUpdate(id);
    });
  }

  updateBullets() {
    for (let i = 0; i < this.bullets.length; i++) {
      this.bulletUpdate(i);
    }
  }

  initializeMap(mapName) {
    const data = Maps.List[mapName];
    const tiledMap = new Tiled.Map(data, Constants.TILE_SIZE);

    this.map = new Entities.Map(
      tiledMap.widthInPixels,
      tiledMap.heightInPixels
    );

    this.walls = new Collisions.TreeCollider();

    tiledMap.collisions.forEach(tile => {
      if (tile.tileId > 0) {
        this.walls.insert({
          minX: tile.minX,
          minY: tile.minY,
          maxX: tile.maxX,
          maxY: tile.maxY,
          collider: tile.type
        });
      }
    });

    tiledMap.spawners.forEach(tile => {
      if (tile.tileId > 0) {
        this.spawners.push(
          new Geometry.RectangleBody(
            tile.minX,
            tile.minY,
            tile.maxX,
            tile.maxY
          )
        );
      }
    });
  }

  playerAdd(id, name) {

    const spawner = this.getSpawnerRandomly();

    const player = new Player(
      id,
      spawner.x + Constants.PLAYER_SIZE / 2,
      spawner.y + Constants.PLAYER_SIZE / 2,
      Constants.PLAYER_SIZE / 2,
      0,
      Constants.PLAYER_MAX_LIVES,
      name || id
    );

    if (this.game.mode === "team deathmatch") {
      player.setTeam("Red");
    }

    this.players.set(id, player);

    this.onMessage({
      type: "joined",
      from: "server",
      ts: Date.now(),
      params: { name: player.name }
    });
  }

  playerRemove(id) {

    const player = this.players.get(id);
    if (!player) return;

    this.onMessage({
      type: "left",
      from: "server",
      ts: Date.now(),
      params: { name: player.name }
    });

    this.players.delete(id);
  }

  playerPushAction(action) {
    this.actions.push(action);
  }

  playerMove(id, ts, dir) {

    const player = this.players.get(id);
    if (!player || dir.empty) return;

    player.move(dir.x, dir.y, Constants.PLAYER_SPEED);

    const clamped = this.map.clampCircle(player.body);
    player.setPosition(clamped.x, clamped.y);

    const corrected = this.walls.correctWithCircle(player.body);
    player.setPosition(corrected.x, corrected.y);

    player.ack = ts;
  }

  playerRotate(id, ts, rotation) {
    const player = this.players.get(id);
    if (!player) return;

    player.setRotation(rotation);
  }

  playerShoot(id, ts, angle) {

    const player = this.players.get(id);
    if (!player || !player.isAlive || this.game.state !== "game") return;

    const delta = ts - player.lastShootAt;

    if (player.lastShootAt && delta < Constants.BULLET_RATE) return;

    player.lastShootAt = ts;

    const bulletX = player.x + Math.cos(angle) * Constants.PLAYER_WEAPON_SIZE;
    const bulletY = player.y + Math.sin(angle) * Constants.PLAYER_WEAPON_SIZE;

    const index = this.bullets.findIndex(b => !b.active);

    if (index === -1) {

      this.bullets.push(
        new Bullet(
          id,
          player.team,
          bulletX,
          bulletY,
          Constants.BULLET_SIZE,
          angle,
          player.color,
          Date.now()
        )
      );

    } else {

      this.bullets[index].reset(
        id,
        player.team,
        bulletX,
        bulletY,
        Constants.BULLET_SIZE,
        angle,
        player.color,
        Date.now()
      );

    }
  }

  monsterUpdate(id) {

    const monster = this.monsters.get(id);
    if (!monster || !monster.isAlive) return;

    monster.update(this.players);
  }

  bulletUpdate(index) {

    const bullet = this.bullets[index];
    if (!bullet || !bullet.active) return;

    bullet.move(Constants.BULLET_SPEED);

    if (this.walls.collidesWithCircle(bullet.body, "half")) {
      bullet.active = false;
      return;
    }

    if (this.map.isCircleOutside(bullet.body)) {
      bullet.active = false;
    }
  }

  getSpawnerRandomly() {
    return this.spawners[
      Maths.getRandomInt(0, this.spawners.length - 1)
    ];
  }

  handleWaitingStart() {
    this.onMessage({
      type: "waiting",
      from: "server",
      ts: Date.now(),
      params: {}
    });
  }

  setPlayersActive(active) {
    this.players.forEach(player => {
      player.setLives(active ? player.maxLives : 0);
    });

  }

  handleLobbyStart() {
    this.setPlayersActive(false);
  }

  handleGameStart() {

    if (this.game.mode === "team deathmatch") {
      this.setPlayersTeamsRandomly();
    }

    this.setPlayersPositionRandomly();
    this.setPlayersActive(true);

    this.propsAdd(Constants.FLASKS_COUNT);
    this.monstersAdd(Constants.MONSTERS_COUNT);

    this.onMessage({
      type: "start",
      from: "server",
      ts: Date.now(),
      params: {}
    });

  }

  handleGameEnd(message) {
    if (message) this.onMessage(message);
  }

}

/* Colyseus Schema registration */

type(Game)(GameState.prototype, "game");
type({ map: Player })(GameState.prototype, "players");
type({ map: Monster })(GameState.prototype, "monsters");
type([Prop])(GameState.prototype, "props");
type([Bullet])(GameState.prototype, "bullets");