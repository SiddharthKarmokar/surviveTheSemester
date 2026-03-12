import { defineTypes } from "@colyseus/schema";
import { Maths } from "../../../core/common/index.js";
import { Circle } from "./circle.js";

export class Player extends Circle {

  constructor(playerId, x, y, radius, lives, maxLives, name, team) {
    super(x, y, radius);

    this.playerId = playerId;
    this.lives = lives;
    this.maxLives = maxLives;
    this.name = validateName(name);
    this.team = team;
    this.color = team ? getTeamColor(team) : "#FFFFFF";
    this.kills = 0;
    this.rotation = 0;
    this.lastShootAt = undefined;
  }

  move(dirX, dirY, speed) {
    const magnitude = Maths.normalize2D(dirX, dirY);

    const speedX = Math.round(Maths.round2Digits(dirX * (speed / magnitude)));
    const speedY = Math.round(Maths.round2Digits(dirY * (speed / magnitude)));

    this.x += speedX;
    this.y += speedY;
  }

  hurt() { this.lives -= 1; }
  heal() { this.lives += 1; }

  get isAlive() { return this.lives > 0; }
  get isFullLives() { return this.lives === this.maxLives; }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setRotation(rotation) { this.rotation = rotation; }

}

defineTypes(Player, {
  playerId: "string",
  name: "string",
  lives: "number",
  maxLives: "number",
  team: "string",
  color: "string",
  kills: "number",
  rotation: "number",
  ack: "number"
});

const validateName = (name) => name.trim().slice(0, 16);
const getTeamColor = (team) => team === "Blue" ? "#0000FF" : "#FF0000";