import { Schema, MapSchema, type } from "@colyseus/schema";

export class MathTugPlayer extends Schema {
  constructor() {
    super(...arguments);
    this.name = "";
    this.score = 0;
  }
}

type("string")(MathTugPlayer.prototype, "name");
type("number")(MathTugPlayer.prototype, "score");

export class MathTugState extends Schema {
  constructor() {
    super(...arguments);
    this.players = new MapSchema();
    this.phase = "waiting";      // "waiting", "playing", "ended"
    this.flagPos = 0;            // P1 pulls negative (-), P2 pulls positive (+)
    this.timer = 10;
    
    // Questions
    this.q1Str = "";
    this.q1Ans = 0;
    this.q2Str = "";
    this.q2Ans = 0;
    
    this.winner = "";
  }
}

type({ map: MathTugPlayer })(MathTugState.prototype, "players");
type("string")(MathTugState.prototype, "phase");
type("number")(MathTugState.prototype, "flagPos");
type("number")(MathTugState.prototype, "timer");
type("string")(MathTugState.prototype, "q1Str");
type("number")(MathTugState.prototype, "q1Ans");
type("string")(MathTugState.prototype, "q2Str");
type("number")(MathTugState.prototype, "q2Ans");
type("string")(MathTugState.prototype, "winner");
