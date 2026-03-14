import { Room } from "@colyseus/core";
import { BinarySudokuState, BinarySudokuPlayer } from "./BinarySudokuState.js";

function validLine(arr, size) {
  if (arr.includes("")) return false;
  let zeros = arr.filter(v => v === 0).length;
  let ones = arr.filter(v => v === 1).length;
  if (zeros !== size / 2 || ones !== size / 2) return false;
  for (let i = 0; i < size - 2; i++) {
    if (arr[i] === arr[i + 1] && arr[i] === arr[i + 2]) return false;
  }
  return true;
}

function unique(lines) {
  let set = new Set();
  for (let line of lines) {
    let str = line.join("");
    if (set.has(str)) return false;
    set.add(str);
  }
  return true;
}

function isValid(boardData, size) {
  for (let i = 0; i < size; i++) {
    let row = boardData[i];
    let col = boardData.map(r => r[i]);
    if (!validLine(row, size) || !validLine(col, size)) return false;
  }
  if (!unique(boardData)) return false;
  let columns = [];
  for (let i = 0; i < size; i++) {
    columns.push(boardData.map(r => r[i]));
  }
  if (!unique(columns)) return false;
  return true;
}

function createSolution(n) {
  while (true) {
    let board = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => Math.random() > 0.5 ? 1 : 0)
    );
    if (isValid(board, n)) return board;
  }
}

function createPuzzle(sol, size, difficulty) {
  let puzzle = JSON.parse(JSON.stringify(sol));
  let remove;
  if (difficulty === "easy") remove = size * size * 0.3;
  else if (difficulty === "medium") remove = size * size * 0.5;
  else remove = size * size * 0.65;
  let removed = 0;
  while (removed < remove) {
    let r = Math.floor(Math.random() * size);
    let c = Math.floor(Math.random() * size);
    if (puzzle[r][c] !== "") {
      puzzle[r][c] = "";
      removed++;
    }
  }
  return puzzle;
}

export class BinarySudokuRoom extends Room {
  onCreate(options) {
    this.maxClients = 2;
    // Keep reservation window short so a stale/abandoned reservation doesn't
    // lock the room for the real joiner on the next retry.
    this.seatReservationTime = 5;

    this.setState(new BinarySudokuState());

    this.state.size = parseInt(options.size) || 6;
    this.state.difficulty = options.difficulty || "medium";

    this.setMetadata({
      creatorName: String(options.playerName || "Player").slice(0, 16),
      roomName: String(options.roomName || "Binary Sudoku")
    });

    this.onMessage("board-solved", (client) => {
      if (this.state.phase !== "playing") return;
      
      const player = this.state.players.get(client.sessionId);
      if (player && !player.solved) {
        player.solved = true;
        player.time = this.state.timer;

        let allSolved = true;
        this.state.players.forEach((p) => {
          if (!p.solved) allSolved = false;
        });

        if (this.state.winner === "") {
          this.state.winner = client.sessionId;
        }

        if (allSolved) {
          this.endGame();
        } else {
            this.broadcast("player-finished", { sessionId: client.sessionId, message: `${player.name} finished the puzzle!`});
        }
      }
    });

    this.onMessage("opponent-board-update", (client, message) => {
      this.broadcast("opponent-board-update", { sessionId: client.sessionId, boardData: message.boardData }, { except: client });
    });
  }

  startRace() {
    const sol = createSolution(this.state.size);
    const puz = createPuzzle(sol, this.state.size, this.state.difficulty);
    
    this.state.solutionRaw = JSON.stringify(sol);
    this.state.puzzleRaw = JSON.stringify(puz);
    this.state.phase = "playing";
    this.state.timer = 0;
    
    if (this.raceTimer) this.raceTimer.clear();
    this.raceTimer = this.clock.setInterval(() => {
      this.state.timer += 1;
    }, 1000);
  }

  endGame() {
    this.state.phase = "ended";
    if (this.raceTimer) {
      this.raceTimer.clear();
      this.raceTimer = null;
    }
    this.broadcast("game-over");
  }

  onJoin(client, options) {
    const player = new BinarySudokuPlayer();
    player.name = String(options.playerName || "Player").slice(0, 16);
    this.state.players.set(client.sessionId, player);

    if (this.state.players.size === 2 && this.state.phase === "waiting") {
      this.startRace();
    }
  }

  onLeave(client, consented) {
    const p = this.state.players.get(client.sessionId);
    this.state.players.delete(client.sessionId);

    if (this.state.phase === "playing") {
      this.broadcast("opponent-left", { name: p?.name });
      this.endGame();
    }
  }

  onDispose() {
    if (this.raceTimer) this.raceTimer.clear();
  }
}
