import { Room } from "@colyseus/core";
import { MathTugState, MathTugPlayer } from "./MathTugState.js";
import { processGameResult, recordGameCompletionActivity } from "../../services/ratingUpdateService.js";

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function compareNumberAsc(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export class MathTugRoom extends Room {
  onCreate(options) {
    this.maxClients = 2;
    this.setState(new MathTugState());
    this.state.totalQuestions = 10;
    this.state.timer = 60;

    this.questions = [];
    this.playerRuntime = new Map();
    this.playerSessions = new Map();
    this.resultRecorded = false;
    
    this.setMetadata({
      creatorName: String(options.playerName || "Player").slice(0, 16),
      roomName: String(options.roomName || "Math Tug Room")
    });

    this.onMessage("submit-answer", (client, message) => {
      if (this.state.phase !== "playing") return;

      const parsedValue = Number(message?.val);
      if (!Number.isFinite(parsedValue)) return;

      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const runtime = this.playerRuntime.get(client.sessionId);
      if (!runtime || runtime.completed) return;

      const qIndex = runtime.currentQuestion;
      if (qIndex >= this.questions.length) return;

      const question = this.questions[qIndex];
      if (!question) return;

      if (parsedValue !== question.answer) {
        client.send("answer-feedback", {
          correct: false,
          message: "Incorrect. Try again.",
          questionIndex: qIndex + 1
        });
        return;
      }

      const elapsedMs = Math.max(0, Date.now() - runtime.questionStartMs);
      runtime.totalTimeMs += elapsedMs;
      runtime.currentQuestion += 1;
      runtime.solveTimesMs.push(elapsedMs);
      runtime.lastSolvedAtMs = Date.now();

      player.score = runtime.currentQuestion;
      player.currentQuestion = runtime.currentQuestion;
      player.totalTimeMs = runtime.totalTimeMs;

      client.send("answer-feedback", {
        correct: true,
        message: "Correct",
        questionIndex: Math.min(runtime.currentQuestion, this.state.totalQuestions)
      });

      if (runtime.currentQuestion >= this.state.totalQuestions) {
        runtime.completed = true;
        client.send("question-update", {
          done: true,
          totalQuestions: this.state.totalQuestions,
          currentIndex: this.state.totalQuestions,
          questionText: ""
        });

        // End the match immediately on the winning answer instead of relying
        // on a later sweep, so the result is declared as soon as someone
        // finishes all questions.
        this.endGameByResult(`${player.name} finished all questions`);
        return;
      }

      runtime.questionStartMs = Date.now();
      this.sendQuestionToClient(client);

      this.maybeEndGame();
    });

    this.onMessage("sync-question", (client) => {
      if (this.state.phase !== "playing") return;
      this.sendQuestionToClient(client);
    });
  }

  generateQuestion() {
    const op = randInt(0, 2);
    const a = randInt(2, 25);
    const b = randInt(2, 15);

    if (op === 0) {
      return { text: `${a} + ${b}`, answer: a + b };
    }
    if (op === 1) {
      return { text: `${a} - ${b}`, answer: a - b };
    }
    return { text: `${a} × ${b}`, answer: a * b };
  }

  buildQuestionSet() {
    this.questions = [];
    for (let i = 0; i < this.state.totalQuestions; i += 1) {
      this.questions.push(this.generateQuestion());
    }
  }

  sendQuestionToClient(client) {
    const runtime = this.playerRuntime.get(client.sessionId);
    if (!runtime) return;

    if (runtime.currentQuestion >= this.state.totalQuestions) {
      client.send("question-update", {
        done: true,
        totalQuestions: this.state.totalQuestions,
        currentIndex: this.state.totalQuestions,
        questionText: ""
      });
      return;
    }

    const question = this.questions[runtime.currentQuestion];
    client.send("question-update", {
      done: false,
      totalQuestions: this.state.totalQuestions,
      currentIndex: runtime.currentQuestion + 1,
      questionText: question.text
    });
  }

  startGame() {
    this.state.phase = "playing";
    this.state.timer = 60;
    this.state.winner = "";
    this.state.winnerSessionId = "";
    this.buildQuestionSet();

    for (const client of this.clients) {
      const runtime = this.playerRuntime.get(client.sessionId);
      if (!runtime) continue;
      runtime.currentQuestion = 0;
      runtime.totalTimeMs = 0;
      runtime.completed = false;
      runtime.questionStartMs = Date.now();
      runtime.solveTimesMs = [];
      runtime.lastSolvedAtMs = 0;

      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.score = 0;
        player.currentQuestion = 0;
        player.totalTimeMs = 0;
      }

      this.sendQuestionToClient(client);

      // Re-send shortly after start so late-bound client handlers still get Q1.
      this.clock.setTimeout(() => {
        if (this.state.phase === "playing") {
          this.sendQuestionToClient(client);
        }
      }, 150);
    }

    if (this.gameTimer) this.gameTimer.clear();

    this.gameTimer = this.clock.setInterval(() => {
      this.state.timer -= 1;
      if (this.state.timer <= 0) {
        this.endGameByResult("Time up");
      }
    }, 1000);
  }

  maybeEndGame() {
    if (this.state.phase !== "playing") return;

    const hasFinisher = this.clients.some((client) => {
      const runtime = this.playerRuntime.get(client.sessionId);
      const player = this.state.players.get(client.sessionId);
      return Boolean(runtime?.completed || Number(player?.score || 0) >= this.state.totalQuestions);
    });

    if (hasFinisher) {
      this.endGameByResult("First player finished all questions");
    }
  }

  endGameByResult(reason = "Game over") {
    if (this.state.phase !== "playing") return;

    const participants = this.clients
      .map((c) => {
        const player = this.state.players.get(c.sessionId);
        const runtime = this.playerRuntime.get(c.sessionId);
        return {
          sessionId: c.sessionId,
          name: player?.name || "Player",
          solved: player?.score || 0,
          totalTimeMs: runtime?.totalTimeMs ?? player?.totalTimeMs ?? 0,
          solveTimesMs: Array.isArray(runtime?.solveTimesMs) ? [...runtime.solveTimesMs] : [],
          lastSolvedAtMs: runtime?.lastSolvedAtMs || 0,
        };
      })
      .sort((a, b) => {
        // 1) Higher solved count wins.
        if (b.solved !== a.solved) return b.solved - a.solved;

        // 2) If solved count ties, compare per-question solve times lexicographically.
        //    The first question where one player is faster decides the winner.
        const compareLength = Math.min(a.solveTimesMs.length, b.solveTimesMs.length, a.solved, b.solved);
        for (let i = 0; i < compareLength; i += 1) {
          const delta = compareNumberAsc(a.solveTimesMs[i], b.solveTimesMs[i]);
          if (delta !== 0) return delta;
        }

        // 3) If still tied, lower total time wins.
        const totalTimeDelta = compareNumberAsc(a.totalTimeMs, b.totalTimeMs);
        if (totalTimeDelta !== 0) return totalTimeDelta;

        // 4) If still tied, earlier last solved timestamp wins (finished milestones earlier).
        const solvedAtDelta = compareNumberAsc(a.lastSolvedAtMs, b.lastSolvedAtMs);
        if (solvedAtDelta !== 0) return solvedAtDelta;

        // 5) Final deterministic fallback.
        return a.sessionId.localeCompare(b.sessionId);
      });

    const winner = participants[0] || null;
    const runnerUp = participants[1] || null;

    let tieBreakMethod = "solved_count";
    if (winner && runnerUp && winner.solved === runnerUp.solved) {
      const compareLength = Math.min(winner.solveTimesMs.length, runnerUp.solveTimesMs.length, winner.solved, runnerUp.solved);
      let foundPerQuestionWinner = false;
      for (let i = 0; i < compareLength; i += 1) {
        if (winner.solveTimesMs[i] !== runnerUp.solveTimesMs[i]) {
          tieBreakMethod = `per_question_speed_q${i + 1}`;
          foundPerQuestionWinner = true;
          break;
        }
      }

      if (!foundPerQuestionWinner) {
        if (winner.totalTimeMs !== runnerUp.totalTimeMs) {
          tieBreakMethod = "total_solve_time";
        } else if ((winner.lastSolvedAtMs || 0) !== (runnerUp.lastSolvedAtMs || 0)) {
          tieBreakMethod = "last_solved_timestamp";
        } else {
          tieBreakMethod = "deterministic_session_fallback";
        }
      }
    }

    // Update state first to block any further submissions
    this.state.phase = "ended";
    this.state.winner = winner?.name || "No winner";
    this.state.winnerSessionId = winner?.sessionId || "";

    if (this.gameTimer) {
      this.gameTimer.clear();
      this.gameTimer = null;
    }

    if (!this.resultRecorded && participants.length >= 2) {
      this.resultRecorded = true;
      const participantUserIds = participants
        .map((entry) => this.playerSessions.get(entry.sessionId)?.userId)
        .filter(Boolean);

      void recordGameCompletionActivity(participantUserIds, new Date()).catch((error) => {
        console.error("[MathTug] Failed to record streak activity:", error);
      });

      const winnerSession = participants[0]?.sessionId;
      const loserSession = participants[1]?.sessionId;
      const winnerUserId = this.playerSessions.get(winnerSession)?.userId;
      const loserUserId = this.playerSessions.get(loserSession)?.userId;

      if (winnerUserId && loserUserId) {
        const winnerMeta = participants[0];
        const loserMeta = participants[1];

        void processGameResult({
          gameType: "mathTug",
          winnerId: winnerUserId,
          loserId: loserUserId,
          gameMetadata: {
            reason,
            totalQuestions: this.state.totalQuestions,
            timerRemaining: this.state.timer,
            tieBreakMethod,
            winnerSolved: winnerMeta?.solved || 0,
            loserSolved: loserMeta?.solved || 0,
            winnerTotalTimeMs: winnerMeta?.totalTimeMs || 0,
            loserTotalTimeMs: loserMeta?.totalTimeMs || 0,
            winnerSolveTimesMs: winnerMeta?.solveTimesMs || [],
            loserSolveTimesMs: loserMeta?.solveTimesMs || [],
          },
        }).catch((error) => {
          console.error("[MathTug] Failed to process rating update:", error);
        });
      }
    }

    // Send result directly to each client immediately (not batched)
    const resultPayload = {
      reason,
      winnerSessionId: this.state.winnerSessionId,
      winnerName: this.state.winner,
      standings: participants,
      tieBreakMethod,
    };

    for (const client of this.clients) {
      client.send("game-over", resultPayload);
    }

    this.broadcast("game-over", resultPayload);
  }

  onJoin(client, options) {
    const player = new MathTugPlayer();
    player.name = String(options.playerName || "Player").slice(0, 16);
    this.state.players.set(client.sessionId, player);
    this.playerSessions.set(client.sessionId, {
      userId: options.userId || null,
      name: player.name,
    });

    this.playerRuntime.set(client.sessionId, {
      currentQuestion: 0,
      totalTimeMs: 0,
      questionStartMs: Date.now(),
      completed: false,
      solveTimesMs: [],
      lastSolvedAtMs: 0,
    });

    const isCreator = this.state.players.size === 1;
    client.send("room-state", {
      side: isCreator ? "left" : "right"
    });

    if (this.state.players.size === 2) {
      this.startGame();
    }
  }

  onLeave(client, consented) {
    this.playerRuntime.delete(client.sessionId);
    this.playerSessions.delete(client.sessionId);
    this.state.players.delete(client.sessionId);

    if (this.state.phase === "playing" && this.state.players.size > 0) {
      this.endGameByResult("Opponent disconnected");
      this.broadcast("opponent-left");
    }

    if (this.state.players.size === 0 && this.gameTimer) {
      this.gameTimer.clear();
      this.gameTimer = null;
    }
  }

  onDispose() {
    if (this.gameTimer) this.gameTimer.clear();
  }
}
