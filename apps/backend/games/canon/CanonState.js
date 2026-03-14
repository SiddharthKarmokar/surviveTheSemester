import { Schema, MapSchema, type } from "@colyseus/schema";

export class CanonPlayer extends Schema {
  constructor() {
    super();
    this.name = "Player";
    this.ready = false;
  }
}

type("string")(CanonPlayer.prototype, "name");
type("boolean")(CanonPlayer.prototype, "ready");

export class CanonScores extends Schema {
  constructor() {
    super();
    this.left = 0;
    this.right = 0;
  }
}

type("number")(CanonScores.prototype, "left");
type("number")(CanonScores.prototype, "right");

export class CanonState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.scores = new CanonScores();
    this.wind = 0;
    this.shotId = 0;
    this.targetScore = 3;
    this.theme = "space";
    this.phase = "waiting"; // "waiting", "playing", "ended"
    this.winner = "";
  }
}

type({ map: CanonPlayer })(CanonState.prototype, "players");
type(CanonScores)(CanonState.prototype, "scores");
type("number")(CanonState.prototype, "wind");
type("number")(CanonState.prototype, "shotId");
type("number")(CanonState.prototype, "targetScore");
type("string")(CanonState.prototype, "theme");
type("string")(CanonState.prototype, "phase");
type("string")(CanonState.prototype, "winner");
