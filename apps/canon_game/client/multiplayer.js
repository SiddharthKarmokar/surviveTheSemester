export class MultiplayerClient {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io();
    }
    return this.socket;
  }

  createRoom(targetScore, theme) {
    return new Promise((resolve) => {
      this.connect().emit("create-room", { targetScore, theme }, resolve);
    });
  }

  joinRoom(roomId) {
    return new Promise((resolve) => {
      this.connect().emit("join-room", { roomId }, resolve);
    });
  }

  readyUp() {
    this.connect().emit("player-ready");
  }

  sendShot(payload) {
    this.connect().emit("player-shot", payload);
  }

  sendProjectileUpdate(payload) {
    this.connect().emit("projectile-update", payload);
  }

  sendScoreUpdate(payload) {
    this.connect().emit("score-update", payload);
  }

  sendRoundReset() {
    this.connect().emit("round-reset");
  }

  on(event, handler) {
    this.connect().on(event, handler);
  }
}
