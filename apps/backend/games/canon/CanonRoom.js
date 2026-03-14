import { Room } from "@colyseus/core";
import { CanonState, CanonPlayer } from "./CanonState.js";

const DEFAULT_TARGET_SCORE = 3;
const ALLOWED_TARGETS = new Set([3, 5, 10, 15, 20]);
const ALLOWED_THEMES = new Set(["space", "jungle", "desert"]);

function randomWind() {
  return Number(((Math.random() * 0.6) - 0.3).toFixed(3));
}

function normalizeTargetScore(value) {
  const parsed = Number(value);
  return ALLOWED_TARGETS.has(parsed) ? parsed : DEFAULT_TARGET_SCORE;
}

function normalizeTheme(value) {
  return ALLOWED_THEMES.has(value) ? value : "space";
}

export class CanonRoom extends Room {
  onCreate(options) {
    this.maxClients = 2;
    this.setState(new CanonState());

    this.state.targetScore = options.targetScore ? normalizeTargetScore(options.targetScore) : 3;
    this.state.theme = options.theme ? normalizeTheme(options.theme) : "space";
    this.state.wind = randomWind();

    this.setMetadata({
      creatorName: String(options.playerName || "Player").slice(0, 16),
      roomName: String(options.roomName || "Canon Match")
    });

    // Auto-start handled in onJoin when 2 players connect

    this.onMessage("player-action", (client, message) => {
      const isCreator = client.sessionId === this.clients[0]?.sessionId;
      const side = isCreator ? "left" : "right";
      this.broadcast("player-action", { side, ...message }, { except: client });
    });

    this.onMessage("player-shot", (client, message) => {
      this.state.shotId += 1;
      // In Colyseus, first joined is left, second is right
      const isCreator = client.sessionId === this.clients[0]?.sessionId;
      const side = isCreator ? "left" : "right";

      this.broadcast("player-shot", {
        side: side,
        angle: message.angle,
        power: message.power,
        wind: this.state.wind,
        shotId: this.state.shotId
      }, { except: client });
    });

    // Removed projectile-update handler as it's now simulated locally on clients

    this.onMessage("score-update", (client, message) => {
      const { scorer } = message;
      if (scorer !== "left" && scorer !== "right") return;

      this.state.scores[scorer] += 1;

      const winner = this.state.scores[scorer] >= this.state.targetScore ? scorer : null;
      
      this.broadcast("score-update", {
        scores: { left: this.state.scores.left, right: this.state.scores.right },
        scorer,
        winner,
        targetScore: this.state.targetScore
      });

      if (winner) {
        this.state.phase = "ended";
        this.state.winner = winner;
        this.broadcast("game-over", { 
          winner, 
          scores: { left: this.state.scores.left, right: this.state.scores.right },
          targetScore: this.state.targetScore
        });
      } else {
        this.state.wind = randomWind();
        this.broadcast("round-reset", { 
          wind: this.state.wind, 
          scores: { left: this.state.scores.left, right: this.state.scores.right },
          targetScore: this.state.targetScore, 
          theme: this.state.theme 
        });
      }
    });

    this.onMessage("round-reset", () => {
      this.state.wind = randomWind();
      this.broadcast("round-reset", { 
        wind: this.state.wind,
        scores: { left: this.state.scores.left, right: this.state.scores.right },
        targetScore: this.state.targetScore,
        theme: this.state.theme
      });
    });
  }

  onJoin(client, options) {
    const player = new CanonPlayer();
    player.name = String(options.playerName || "Player").slice(0, 16);
    this.state.players.set(client.sessionId, player);

    // Initial sync of room state implicitly happens by State changes.
    // Let's send a custom welcome to assign 'side'
    client.send("room-state", {
      scores: { left: this.state.scores.left, right: this.state.scores.right },
      wind: this.state.wind,
      targetScore: this.state.targetScore,
      theme: this.state.theme,
      side: this.state.players.size === 1 ? "left" : "right"
    });

    if (this.state.players.size === 2) {
      this.state.wind = randomWind();
      this.state.phase = "playing";
      this.broadcast("round-reset", {
        wind: this.state.wind,
        scores: { left: this.state.scores.left, right: this.state.scores.right },
        targetScore: this.state.targetScore,
        theme: this.state.theme
      });
    }
  }

  onLeave(client, consented) {
    this.state.players.delete(client.sessionId);
    this.broadcast("opponent-left");
  }

  onDispose() { }
}
