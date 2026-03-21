import { Schema, MapSchema, ArraySchema, defineTypes } from "@colyseus/schema";

// ---------------------------------------------------------------------------
// PuzzlePlayer — per-player board + stats (synced to all clients in real-time)
// ---------------------------------------------------------------------------
export class PuzzlePlayer extends Schema {
  constructor() {
    super();
    this.name = "";
    this.moves = 0;
    this.tiles = ""; // JSON stringified array
  }
}

defineTypes(PuzzlePlayer, {
  name: "string",
  moves: "number",
  solved: "boolean",
  tiles: "string",
});

// ---------------------------------------------------------------------------
// PuzzleGameState — top-level room state
// Phases: "waiting" → (2nd player joins) → "countdown" → "game" → "ended"
// ---------------------------------------------------------------------------
export class PuzzleGameState extends Schema {
  constructor() {
    super();
    this.phase = "waiting";         // waiting | countdown | game | ended
    this.players = new MapSchema(); // sessionId → PuzzlePlayer
    this.winner = "";               // session ID of winner
    this.initialTiles = ""; // same starting board for every player
    this.countdownEndsAt = 0;       // epoch ms
  }
}

defineTypes(PuzzleGameState, {
  phase: "string",
  players: { map: PuzzlePlayer },
  winner: "string",
  winnerName: "string",
  initialTiles: "string",
  countdownEndsAt: "number",
});
