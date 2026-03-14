import { Schema, MapSchema, type } from "@colyseus/schema";

export class BinarySudokuPlayer extends Schema {
  constructor() {
    super(...arguments);
    this.name = "";
    this.solved = false;
    this.time = 0; // seconds taken to solve
    this.ready = false;
  }
}

type("string")(BinarySudokuPlayer.prototype, "name");
type("boolean")(BinarySudokuPlayer.prototype, "solved");
type("number")(BinarySudokuPlayer.prototype, "time");
type("boolean")(BinarySudokuPlayer.prototype, "ready");

export class BinarySudokuState extends Schema {
  constructor() {
    super(...arguments);
    this.players = new MapSchema();
    this.phase = "waiting";     // "waiting", "playing", "ended"
    this.size = 6;
    this.difficulty = "medium";
    
    // We send the puzzle as a stringified JSON array of arrays
    this.puzzleRaw = "";
    this.solutionRaw = "";

    this.timer = 0; // The race clock
    
    this.winner = "";
  }
}

type({ map: BinarySudokuPlayer })(BinarySudokuState.prototype, "players");
type("string")(BinarySudokuState.prototype, "phase");
type("number")(BinarySudokuState.prototype, "size");
type("string")(BinarySudokuState.prototype, "difficulty");
type("string")(BinarySudokuState.prototype, "puzzleRaw");
type("string")(BinarySudokuState.prototype, "solutionRaw");
type("number")(BinarySudokuState.prototype, "timer");
type("string")(BinarySudokuState.prototype, "winner");
