import { Schema, MapSchema, type } from "@colyseus/schema";

export class MathTugPlayer extends Schema {
  constructor() {
    super(...arguments);
    this.name = "";
    this.score = 0;
    this.currentQuestion = 0;
    this.totalTimeMs = 0;
  }
}

type("string")(MathTugPlayer.prototype, "name");
type("number")(MathTugPlayer.prototype, "score");
type("number")(MathTugPlayer.prototype, "currentQuestion");
type("number")(MathTugPlayer.prototype, "totalTimeMs");

export class MathTugState extends Schema {
  constructor() {
    super(...arguments);
    this.players = new MapSchema();
    this.phase = "waiting";      // "waiting", "playing", "ended"
    this.timer = 180;
    this.totalQuestions = 10;
    this.winnerSessionId = "";
    this.winner = "";
  }
}

type({ map: MathTugPlayer })(MathTugState.prototype, "players");
type("string")(MathTugState.prototype, "phase");
type("number")(MathTugState.prototype, "timer");
type("number")(MathTugState.prototype, "totalQuestions");
type("string")(MathTugState.prototype, "winnerSessionId");
type("string")(MathTugState.prototype, "winner");
