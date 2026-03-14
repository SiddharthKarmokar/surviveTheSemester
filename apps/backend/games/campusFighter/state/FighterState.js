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
    this.waitingNotified = false;

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
    if (this.game.state === "lobby" && this.players.size < Constants.ROOM_PLAYERS_MIN) {
      this.game.lobbyEndsAt = 0;

      if (!this.waitingNotified) {
        this.handleWaitingStart();
        this.waitingNotified = true;
      }
      return;
    }

    // Auto-start logic when enough players have joined.
    if (this.game.state === "lobby" && this.players.size >= Constants.ROOM_PLAYERS_MIN && !this.game.lobbyEndsAt) {
      this.waitingNotified = false;
      if (this.game.onLobbyStart) this.game.onLobbyStart();
      this.game.lobbyEndsAt = Date.now() + 3000; // Start after 3 seconds
    }

    if (this.game.state === "game") {
      this.checkWinCondition();
    }
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
            tile.maxX - tile.minX,
            tile.maxY - tile.minY
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

    if (this.game.state === "game") {
      this.checkWinCondition();
    }
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

    for (const [playerId, player] of this.players.entries()) {
      if (!player.isAlive || playerId === bullet.playerId) continue;
      if (bullet.team && player.team && bullet.team === player.team) continue;
      if (!Collisions.circleToCircle(bullet.body, player.body)) continue;

      bullet.active = false;
      player.hurt();

      if (!player.isAlive) {
        const killer = this.players.get(bullet.playerId);
        if (killer) {
          killer.kills += 1;
        }

        this.onMessage({
          type: "killed",
          from: "server",
          ts: Date.now(),
          params: {
            killerName: killer?.name || "Unknown",
            killedName: player.name,
          }
        });

        this.checkWinCondition();
      }

      return;
    }

    for (const monster of this.monsters.values()) {
      if (!monster.isAlive) continue;
      if (!Collisions.circleToCircle(bullet.body, monster.body)) continue;

      bullet.active = false;
      monster.hurt();
      return;
    }

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
      player.lives = active ? player.maxLives : 0;
    });
  }

  setPlayersPositionRandomly() {
    this.players.forEach(player => {
      const spawner = this.getSpawnerRandomly();
      if (spawner) {
        player.setPosition(
          spawner.x + Constants.PLAYER_SIZE / 2,
          spawner.y + Constants.PLAYER_SIZE / 2
        );
      }
    });
  }

  setPlayersTeamsRandomly() {
    let i = 0;
    this.players.forEach(player => {
      player.team = (i % 2 === 0) ? "Red" : "Blue";
      player.color = player.team === "Blue" ? "#0000FF" : "#FF0000";
      i++;
    });
  }

  propsAdd(count) {
    // Add simple flask props
    for (let i = 0; i < count; i++) {
        const spawner = this.getSpawnerRandomly();
        if (spawner) {
             this.props.push(new Prop(
                 "flask",
                 spawner.x + Constants.PLAYER_SIZE/2,
                 spawner.y + Constants.PLAYER_SIZE/2,
                 16
             ));
        }
    }
  }

  monstersAdd(count) {
    // Add monsters
    for (let i = 0; i < count; i++) {
        const spawner = this.getSpawnerRandomly();
        if (spawner) {
             this.monsters.set("monster-" + i, new Monster(
                 spawner.x + Constants.PLAYER_SIZE/2,
                 spawner.y + Constants.PLAYER_SIZE/2,
                 Constants.MONSTER_SIZE/2,
                 this.map.width,
                 this.map.height,
                 Constants.MONSTER_LIVES
             ));
        }
    }
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
    this.game.gameEndsAt = Date.now() + Constants.GAME_DURATION;

    this.propsAdd(Constants.FLASKS_COUNT || 0);
    this.monstersAdd(Constants.MONSTERS_COUNT || 0);

    this.onMessage({
      type: "start",
      from: "server",
      ts: Date.now(),
      params: {}
    });
  }

  handleGameEnd(message) {
    if (message) {
      this.onMessage(message);
    }

    const winnerName = this.getWinnerName();
    if (winnerName) {
      this.onMessage({
        type: "won",
        from: "server",
        ts: Date.now(),
        params: { name: winnerName }
      });
    }
  }

  checkWinCondition() {
    if (this.game.state !== "game") {
      return;
    }

    const alivePlayers = Array.from(this.players.values()).filter((player) => player.isAlive);

    if (this.game.mode === "team deathmatch") {
      const aliveTeams = new Set(alivePlayers.map((player) => player.team).filter(Boolean));
      if (aliveTeams.size === 1 && alivePlayers.length > 0) {
        this.finishGame(`${Array.from(aliveTeams)[0]} team`);
      }
      return;
    }

    if (alivePlayers.length === 1 && this.players.size > 1) {
      this.finishGame(alivePlayers[0].name);
    }
  }

  finishGame(winnerName) {
    if (this.game.state === "end") {
      return;
    }

    this.game.state = "end";
    this.game.gameEndsAt = Date.now();

    this.onMessage({
      type: "won",
      from: "server",
      ts: Date.now(),
      params: { name: winnerName }
    });
  }

  getWinnerName() {
    if (this.game.mode === "team deathmatch") {
      const scores = new Map();
      this.players.forEach((player) => {
        const team = player.team || "Unknown";
        scores.set(team, (scores.get(team) || 0) + player.kills);
      });

      const winner = Array.from(scores.entries()).sort((left, right) => right[1] - left[1])[0];
      return winner ? `${winner[0]} team` : null;
    }

    const players = Array.from(this.players.values());
    const aliveWinner = players.find((player) => player.isAlive);
    if (aliveWinner) {
      return aliveWinner.name;
    }

    const topPlayer = players.sort((left, right) => right.kills - left.kills)[0];
    return topPlayer ? topPlayer.name : null;
  }

}

/* Colyseus Schema registration */

type(Game)(GameState.prototype, "game");
type({ map: Player })(GameState.prototype, "players");
type({ map: Monster })(GameState.prototype, "monsters");
type([Prop])(GameState.prototype, "props");
type([Bullet])(GameState.prototype, "bullets");