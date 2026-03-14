import { Room } from "@colyseus/core";
import { MathTugState, MathTugPlayer } from "./MathTugState.js";

function rand() {
  return Math.floor(Math.random() * 10) + 1;
}

export class MathTugRoom extends Room {
  onCreate(options) {
    this.maxClients = 2;
    this.setState(new MathTugState());
    
    this.setMetadata({
      creatorName: String(options.playerName || "Player").slice(0, 16),
      roomName: String(options.roomName || "Math Tug Room")
    });

    this.onMessage("submit-answer", (client, message) => {
      if (this.state.phase !== "playing") return;

      const { side, val } = message;
      // In colyseus, map is not ordered reliably, but we assign P1 to clients[0], P2 to clients[1]
      const isCreator = client.sessionId === this.clients[0]?.sessionId;
      const expectedSide = isCreator ? "left" : "right";

      if (side !== expectedSide) return; // Prevent spoofing

      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      if (side === "left" && val === this.state.q1Ans) {
        this.state.flagPos -= 40;
        player.score += 1;
        this.broadcast("pull-anim", { side: "left", flagPos: this.state.flagPos });
        this.checkWinner();
      } else if (side === "right" && val === this.state.q2Ans) {
        this.state.flagPos += 40;
        player.score += 1;
        this.broadcast("pull-anim", { side: "right", flagPos: this.state.flagPos });
        this.checkWinner();
      }
    });
  }

  generateQuestions() {
    let a = rand();
    let b = rand();
    this.state.q1Ans = a + b;
    this.state.q1Str = `${a} + ${b}`;

    a = rand();
    b = rand();
    this.state.q2Ans = a * b;
    this.state.q2Str = `${a} × ${b}`;
  }

  startRound() {
    this.generateQuestions();
    this.state.timer = 10;
    
    if (this.roundTimer) this.roundTimer.clear();

    this.roundTimer = this.clock.setInterval(() => {
      this.state.timer -= 1;
      if (this.state.timer <= 0) {
        this.startRound();
      }
    }, 1000);
  }

  checkWinner() {
    if (this.state.flagPos <= -200) {
      this.endGame("left");
    } else if (this.state.flagPos >= 200) {
      this.endGame("right");
    }
  }

  endGame(winnerSide) {
    this.state.phase = "ended";
    this.state.winner = winnerSide;
    if (this.roundTimer) {
      this.roundTimer.clear();
      this.roundTimer = null;
    }
    this.broadcast("game-over", { winner: winnerSide });
  }

  onJoin(client, options) {
    const player = new MathTugPlayer();
    player.name = String(options.playerName || "Player").slice(0, 16);
    this.state.players.set(client.sessionId, player);

    const isCreator = this.state.players.size === 1;
    client.send("room-state", {
      side: isCreator ? "left" : "right"
    });

    if (this.state.players.size === 2) {
      this.state.phase = "playing";
      this.state.flagPos = 0;
      this.startRound();
    }
  }

  onLeave(client, consented) {
    this.state.players.delete(client.sessionId);
    if (this.state.phase === "playing") {
      this.endGame(this.state.players.size > 0 ? (this.clients[0].sessionId === client.sessionId ? "right" : "left") : "nobody");
      this.broadcast("opponent-left");
    }
  }

  onDispose() {
    if (this.roundTimer) this.roundTimer.clear();
  }
}
