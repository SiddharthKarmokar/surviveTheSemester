import { Room } from "@colyseus/core";
import { PuzzleGameState, PuzzlePlayer } from "./schema/PuzzleGameState.js";

// ---------------------------------------------------------------------------
// Puzzle15Room — Colyseus room for the multiplayer 15-puzzle race
//
// Rules:
//  - Exactly 2 players per room, maxClients = 2
//  - Both receive the SAME shuffled starting board (generated on onCreate)
//  - Each player has their own independent board tracked server-side
//  - Server validates every tile move (only adjacent-to-empty moves allowed)
//  - First player to reach the solved state wins
//  - If a player disconnects mid-game the remaining player wins by default
// ---------------------------------------------------------------------------
export class Puzzle15Room extends Room {
  // -------------------------------------------------------------------------
  onCreate(options = {}) {
    this.maxClients = 2;

    const tiles = generateShuffledPuzzle();
    const state = new PuzzleGameState();
    tiles.forEach(t => state.initialTiles.push(t));
    this.setState(state);

    // Store room creator name in metadata so getAvailableRooms() returns it
    this.setMetadata({
      creatorName: String(options.playerName || "Player").slice(0, 16),
    });

    // Handle tile move messages from clients
    this.onMessage("move", (client, message) => {
      this.handleMove(client, message);
    });

    console.log(`[Puzzle15] Room created, initial board: ${tiles.join(",")}`);
  }

  // -------------------------------------------------------------------------
  onJoin(client, options = {}) {
    const player = new PuzzlePlayer();
    player.name = String(options.playerName || "Player").slice(0, 16);

    // Give each player their own copy of the starting board
    this.state.initialTiles.forEach(t => player.tiles.push(t));

    this.state.players.set(client.sessionId, player);

    // Notify all clients about the new join
    this.broadcast("playerJoined", {
      name: player.name,
      count: this.state.players.size,
    });

    console.log(`[Puzzle15] ${player.name} joined (${this.state.players.size}/2)`);

    // Start countdown when the room is full
    if (this.state.players.size === 2) {
      this.state.phase = "countdown";
      this.state.countdownEndsAt = Date.now() + 3000;
      this.broadcast("countdown", { endsAt: this.state.countdownEndsAt });

      this._countdownTimer = setTimeout(() => {
        if (this.state.phase === "countdown") {
          this.state.phase = "game";
          this.broadcast("gameStart", {});
          console.log("[Puzzle15] Game started!");
        }
      }, 3000);
    }
  }

  // -------------------------------------------------------------------------
  onLeave(client, consented) {
    if (!this.state.players.has(client.sessionId)) return;

    const leaving = this.state.players.get(client.sessionId);
    const leavingName = leaving?.name || "Player";
    this.broadcast("playerLeft", { name: leavingName });

    // Award the win to the remaining player if game was active
    if (this.state.phase === "game" || this.state.phase === "countdown") {
      const winnerId = [...this.state.players.keys()].find(id => id !== client.sessionId);
      if (winnerId) {
        const winner = this.state.players.get(winnerId);
        const winnerName = winner?.name || "Player";
        this.state.phase = "ended";
        this.state.winner = winnerId;
        this.state.winnerName = winnerName;
        this.broadcast("ended", {
          winner: winnerId,
          winnerName,
          moves: winner?.moves || 0,
          reason: "opponent_left",
        });
        console.log(`[Puzzle15] ${winnerName} wins — opponent disconnected`);
      }
    }

    this.state.players.delete(client.sessionId);
  }

  // -------------------------------------------------------------------------
  onDispose() {
    if (this._countdownTimer) clearTimeout(this._countdownTimer);
  }

  // -------------------------------------------------------------------------
  // Validate and apply a tile move for a specific client.
  // Message format: { tileIndex: number }  (0-15, the tile the player tapped)
  // -------------------------------------------------------------------------
  handleMove(client, message) {
    if (this.state.phase !== "game") return;

    const { tileIndex } = message;
    if (typeof tileIndex !== "number" || tileIndex < 0 || tileIndex >= 16) return;

    const player = this.state.players.get(client.sessionId);
    if (!player || player.solved) return;

    // Locate the empty slot (value === 0) on this player's board
    let emptyIdx = -1;
    for (let i = 0; i < 16; i++) {
      if (player.tiles[i] === 0) { emptyIdx = i; break; }
    }
    if (emptyIdx === -1) return;

    // Only allow moves to an adjacent cell
    if (!isAdjacent(tileIndex, emptyIdx)) return;

    // Swap tileIndex value with the empty slot
    const val = player.tiles[tileIndex];
    player.tiles[tileIndex] = 0;
    player.tiles[emptyIdx] = val;
    player.moves++;

    // Check whether this player has solved the puzzle
    if (isSolved(player.tiles)) {
      player.solved = true;
      this.state.phase = "ended";
      this.state.winner = client.sessionId;
      this.state.winnerName = player.name;
      this.broadcast("ended", {
        winner: client.sessionId,
        winnerName: player.name,
        moves: player.moves,
        reason: "solved",
      });
      console.log(`[Puzzle15] ${player.name} solved the puzzle in ${player.moves} moves!`);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True when cells a and b are horizontally or vertically adjacent in a 4×4 grid */
function isAdjacent(a, b) {
  const rA = Math.floor(a / 4), cA = a % 4;
  const rB = Math.floor(b / 4), cB = b % 4;
  return Math.abs(rA - rB) + Math.abs(cA - cB) === 1;
}

/** True when tiles [1,2,...,15,0] — fully solved state */
function isSolved(tiles) {
  for (let i = 0; i < 15; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[15] === 0;
}

/**
 * Generate a guaranteed-solvable 15-puzzle board by starting from the solved
 * state and randomising via valid moves (any board reached this way is solvable).
 */
function generateShuffledPuzzle() {
  const tiles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
  let emptyPos = 15;
  for (let i = 0; i < 400; i++) {
    const neighbors = getCellNeighbors(emptyPos);
    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    tiles[emptyPos] = tiles[next];
    tiles[next] = 0;
    emptyPos = next;
  }
  return tiles;
}

/** Return valid neighbour indices for a cell in a 4×4 grid */
function getCellNeighbors(pos) {
  const row = Math.floor(pos / 4), col = pos % 4;
  const result = [];
  if (row > 0) result.push(pos - 4);
  if (row < 3) result.push(pos + 4);
  if (col > 0) result.push(pos - 1);
  if (col < 3) result.push(pos + 1);
  return result;
}
