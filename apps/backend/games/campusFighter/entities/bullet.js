import { defineTypes } from "@colyseus/schema";
import { Circle } from "./circle.js";

export class Bullet extends Circle {

  constructor(playerId, team, x, y, radius, rotation, color, shotAt) {
    super(x, y, radius);

    this.playerId = playerId;
    this.team = team;
    this.rotation = rotation;
    this.fromX = x;
    this.fromY = y;
    this.active = true;
    this.color = color;
    this.shotAt = shotAt;
  }

  move(speed) {
    this.x += Math.cos(this.rotation) * speed;
    this.y += Math.sin(this.rotation) * speed;
  }

  reset(playerId, team, x, y, radius, rotation, color, shotAt) {
    this.playerId = playerId;
    this.team = team;
    this.fromX = x;
    this.fromY = y;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.rotation = rotation;
    this.active = true;
    this.color = color;
    this.shotAt = shotAt;
  }

}

defineTypes(Bullet, {
  playerId: "string",
  team: "string",
  rotation: "number",
  fromX: "number",
  fromY: "number",
  active: "boolean",
  color: "string",
  shotAt: "number"
});