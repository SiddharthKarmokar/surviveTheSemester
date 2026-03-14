import { Cannon } from "./cannon.js";
import { Projectile } from "./projectile.js";
import { ParticleSystem } from "./particles.js";
import { BotController } from "./bot.js";
import { clamp, distance, pointOnTerrain } from "./physics.js";
import { drawWindRibbon, randomWind } from "./wind.js";

const DEFAULT_TARGET_SCORE = 3;
const MAX_HOLD = 900;
const MAX_VELOCITY = 540;
const ROUND_RESET_DELAY = 0.55;
const GROUND_DAMPING = 0.68;
const GROUND_FRICTION = 0.82;
const MIN_BOUNCE_SPEED = 70;
const FIRE_INTERVAL = 0.28;
const BOT_FIRE_INTERVAL = 0.65;

const THEMES = {
  space: {
    key: "space",
    skyTop: "#13284b",
    skyMid: "#10203e",
    skyBottom: "#1b2230",
    terrainTop: "#325a5c",
    terrainBottom: "#1c2b32",
    ridge: "rgba(152, 246, 185, 0.14)",
    stars: true,
    moon: true,
    jungle: false,
    desert: false,
    sun: false
  },
  jungle: {
    key: "jungle",
    skyTop: "#244d2f",
    skyMid: "#356844",
    skyBottom: "#13291b",
    terrainTop: "#6c8c3b",
    terrainBottom: "#34461c",
    ridge: "rgba(208, 255, 132, 0.16)",
    stars: false,
    moon: false,
    jungle: true,
    desert: false,
    sun: false
  },
  desert: {
    key: "desert",
    skyTop: "#ffd36e",
    skyMid: "#ffb86b",
    skyBottom: "#f08b57",
    terrainTop: "#d8a45b",
    terrainBottom: "#9d6333",
    ridge: "rgba(255, 240, 186, 0.22)",
    stars: false,
    moon: false,
    jungle: false,
    desert: true,
    sun: true
  }
};

class AudioEngine {
  constructor() {
    this.ctx = null;
  }

  ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  tone({ frequency, duration, type = "sine", gain = 0.05, ramp = "exponential" }) {
    this.ensure();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    amp.gain.setValueAtTime(gain, now);
    if (ramp === "exponential") {
      amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
    } else {
      amp.gain.linearRampToValueAtTime(0.001, now + duration);
    }
    osc.connect(amp).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playShoot() {
    this.tone({ frequency: 180, duration: 0.18, type: "square", gain: 0.08 });
    this.tone({ frequency: 90, duration: 0.24, type: "triangle", gain: 0.035 });
  }

  playExplosion() {
    this.tone({ frequency: 58, duration: 0.45, type: "sawtooth", gain: 0.07, ramp: "linear" });
  }

  playHit() {
    this.tone({ frequency: 420, duration: 0.12, type: "triangle", gain: 0.06 });
  }
}

export class CannonDuelGame {
  constructor(canvas, ui, multiplayer) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = ui;
    this.multiplayer = multiplayer;
    this.audio = new AudioEngine();
    this.bot = new BotController("normal");
    this.particles = new ParticleSystem();
    this.mode = "menu";
    this.localSide = "left";
    this.roomId = null;
    this.targetScore = DEFAULT_TARGET_SCORE;
    this.theme = THEMES.space;
    this.isCharging = false;
    this.chargeStart = 0;
    this.pendingBotShots = [];
    this.roundCooldown = 0;
    this.projectiles = [];
    this.sideCooldowns = { left: 0, right: 0 };
    this.wind = randomWind();
    this.scores = { left: 0, right: 0 };
    this.lastShotId = 0;
    this.lastTime = performance.now();
    this.stars = Array.from({ length: 100 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.6,
      size: 0.5 + Math.random() * 2,
      twinkle: Math.random() * Math.PI * 2
    }));
    this.resize();
    this.bindEvents();
    this.bindSocketEvents();
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());
    this.canvas.addEventListener("pointerdown", () => this.onPointerDown());
    window.addEventListener("pointerup", () => this.onPointerUp());
    window.addEventListener("keydown", (event) => {
      if (event.code !== "Space" || event.repeat) {
        return;
      }
      event.preventDefault();
      this.onPointerDown();
    });
    window.addEventListener("keyup", (event) => {
      if (event.code !== "Space") {
        return;
      }
      event.preventDefault();
      this.onPointerUp();
    });
  }

  bindSocketEvents() {
    this.multiplayer.on("room-state", (state) => {
      this.scores = { ...state.scores };
      this.wind = state.wind;
      this.targetScore = state.targetScore || this.targetScore;
      this.setTheme(state.theme || this.theme.key);
      this.ui.setScores(this.scores.left, this.scores.right, this.targetScore, { left: "Player", right: "Opponent" });
      this.ui.setWind(this.wind);
    });

    this.multiplayer.on("player-shot", ({ side, angle, power, wind, shotId }) => {
      this.wind = wind;
      this.fire(side, angle, power, { id: shotId, fromNetwork: true });
    });

    this.multiplayer.on("player-action", ({ side, type, angle }) => {
      const cannon = this.getCannon(side);
      if (type === "charge") {
         cannon.angle = angle;
         cannon.setFrozen(true);
      }
    });

    this.multiplayer.on("projectile-update", ({ id, x, y, vx, vy, alive }) => {
      const projectile = this.projectiles.find((item) => item.id === id);
      if (!projectile) {
        return;
      }
      projectile.x = x;
      projectile.y = y;
      projectile.vx = vx;
      projectile.vy = vy;
      projectile.alive = alive;
    });

    this.multiplayer.on("score-update", ({ scores, winner, targetScore }) => {
      this.scores = { ...scores };
      this.targetScore = targetScore || this.targetScore;
      this.ui.setScores(this.scores.left, this.scores.right, this.targetScore, { left: "Player", right: "Opponent" });
      if (winner) {
        this.endMatch(winner === this.localSide ? "Victory" : "Defeat", `${winner === "left" ? "Left" : "Right"} cannon wins the duel.`);
      }
    });

    this.multiplayer.on("round-reset", ({ wind, scores, targetScore, theme }) => {
      this.wind = wind;
      this.scores = { ...scores };
      this.targetScore = targetScore || this.targetScore;
      this.setTheme(theme || this.theme.key);
      this.setupRound();
      this.ui.setScores(this.scores.left, this.scores.right, this.targetScore, { left: "Player", right: "Opponent" });
      this.ui.setWind(this.wind);
      this.ui.setRoomStatus("");
    });

    this.multiplayer.on("opponent-left", () => {
      if (this.mode === "online") {
        this.endMatch("Opponent Left", "The other player disconnected.");
      }
    });

    this.multiplayer.on("game-over", ({ winner }) => {
      this.endMatch(winner === this.localSide ? "Victory" : "Defeat", `${winner === "left" ? "Left" : "Right"} cannon wins the duel.`);
    });
  }

  setTheme(themeKey) {
    this.theme = THEMES[themeKey] || THEMES.space;
  }

  resize() {
    this.canvas.width = window.innerWidth * window.devicePixelRatio;
    this.canvas.height = window.innerHeight * window.devicePixelRatio;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.setupRound();
  }

  terrainFn(nx) {
    return 0.18 + Math.sin(nx * Math.PI) * 0.08 + Math.sin(nx * Math.PI * 3) * 0.015;
  }

  terrainY(x) {
    return pointOnTerrain(x, this.width, this.height, (nx) => this.terrainFn(nx));
  }

  setupRound() {
    const leftX = 110;
    const rightX = this.width - 110;
    const leftY = this.terrainY(leftX) - 18;
    const rightY = this.terrainY(rightX) - 18;
    this.leftCannon = new Cannon({ x: leftX, y: leftY, side: "left", color: "#ff9f68" });
    this.rightCannon = new Cannon({ x: rightX, y: rightY, side: "right", color: "#71c7ff" });
    this.leftCannon.groundY = leftY;
    this.rightCannon.groundY = rightY;
    this.projectiles = [];
    this.pendingBotShots = [];
    this.sideCooldowns = { left: 0, right: 0 };
    this.isCharging = false;
    this.roundCooldown = 0;
    this.ui.setWind(this.wind);
    if (this.mode === "bot") {
      this.scheduleBotShot();
    }
  }

  start(mode, options = {}) {
    this.mode = mode;
    this.ui.showHud(true);
    this.ui.showScreen(null);
    this.scores = { left: 0, right: 0 };
    this.targetScore = options.targetScore || DEFAULT_TARGET_SCORE;
    this.setTheme(options.theme || this.theme.key);
    this.wind = randomWind();
    this.bot.setDifficulty(options.difficulty || "normal");
    this.ui.setScores(0, 0, this.targetScore, { left: "Player", right: mode === "bot" ? "Bot" : "Opponent" });
    this.setupRound();
  }

  exitToMenu() {
    this.mode = "menu";
    this.projectiles = [];
    this.pendingBotShots = [];
    this.roundCooldown = 0;
    this.ui.showHud(false);
    this.ui.showScreen("menu");
    this.ui.setRoomStatus("Create a room or enter a code to join.", false);
    this.roomId = null;
  }

  canFire(side) {
    return this.roundCooldown <= 0 && this.sideCooldowns[side] <= 0;
  }

  onPointerDown() {
    if (this.mode === "menu" || this.isCharging || !this.canFire(this.localSide)) {
      return;
    }
    this.audio.ensure();
    const cannon = this.getCannon(this.localSide);
    cannon.setFrozen(true);
    this.isCharging = true;
    this.chargeStart = performance.now();

    if (this.mode === "online") {
      this.multiplayer.sendAction({ type: "charge", angle: cannon.angle });
    }
  }

  onPointerUp() {
    if (!this.isCharging) {
      return;
    }
    this.isCharging = false;
    const hold = clamp(performance.now() - this.chargeStart, 120, MAX_HOLD);
    const power = hold / MAX_HOLD;
    const cannon = this.getCannon(this.localSide);
    const angleDeg = this.toGameplayAngle(cannon.angle, cannon.side);
    cannon.setFrozen(false);

    if (this.mode === "online") {
      this.multiplayer.sendShot({ angle: angleDeg, power });
    }

    this.fire(this.localSide, angleDeg, power, { id: `local-${++this.lastShotId}` });
  }

  getCannon(side) {
    return side === "left" ? this.leftCannon : this.rightCannon;
  }

  getOpponentSide(side) {
    return side === "left" ? "right" : "left";
  }

  toGameplayAngle(angleRad, side) {
    const deg = (angleRad * 180) / Math.PI;
    return side === "left" ? deg : 180 - deg;
  }

  fromGameplayAngle(angleDeg, side) {
    const rad = (angleDeg * Math.PI) / 180;
    return side === "left" ? rad : Math.PI - rad;
  }

  fire(side, angleDeg, power, options = {}) {
    if (!this.canFire(side) && !options.fromNetwork) {
      return;
    }

    const cannon = this.getCannon(side);
    cannon.angle = this.fromGameplayAngle(angleDeg, side);
    cannon.setFrozen(false);
    cannon.fire();
    const tip = cannon.getBarrelTip();
    const velocity = power * MAX_VELOCITY;
    const direction = side === "left" ? 1 : -1;
    const angleRad = (angleDeg * Math.PI) / 180;
    const projectile = new Projectile({
      x: tip.x,
      y: tip.y,
      vx: Math.cos(angleRad) * velocity * direction,
      vy: Math.sin(angleRad) * velocity,
      owner: side
    });
    projectile.id = options.id || `${side}-${++this.lastShotId}`;
    this.projectiles.push(projectile);
    this.sideCooldowns[side] = side === "right" && this.mode === "bot" ? BOT_FIRE_INTERVAL : FIRE_INTERVAL;
    this.audio.playShoot();

    if (this.mode === "bot" && side === "left") {
      this.scheduleBotShot();
    }
  }

  scheduleBotShot() {
    if (this.mode !== "bot" || this.roundCooldown > 0) {
      return;
    }
    if (this.pendingBotShots.length > 1) {
      return;
    }
    const shot = this.bot.chooseShot({
      bot: this.rightCannon,
      target: this.leftCannon,
      wind: this.wind,
      maxVelocity: MAX_VELOCITY
    });
    this.pendingBotShots.push({
      at: performance.now() + 350 + Math.random() * 700,
      angle: shot.angle,
      power: shot.power
    });
    this.rightCannon.angle = this.fromGameplayAngle(shot.angle, "right");
    this.rightCannon.setFrozen(true);
  }

  isRoundAuthority() {
    return this.mode !== "online" || this.localSide === "left";
  }

  awardPoint(side) {
    if (this.mode === "online") {
      if (this.isRoundAuthority()) {
        this.multiplayer.sendScoreUpdate({ scorer: side });
      }
      return;
    }

    this.scores[side] += 1;
    this.ui.setScores(this.scores.left, this.scores.right, this.targetScore, { left: "Player", right: this.mode === "bot" ? "Bot" : "Opponent" });
    this.projectiles = [];
    this.pendingBotShots = [];
    if (this.scores[side] >= this.targetScore) {
      const playerWon = side === "left";
      this.endMatch(playerWon ? "Victory" : "Defeat", `${playerWon ? "Player" : "Opponent"} reaches ${this.targetScore} points.`);
      return;
    }
    this.scheduleNextRound();
  }

  endMatch(title, body) {
    this.mode = "menu";
    this.ui.showHud(false);
    this.ui.showOverlay(title, body);
  }

  update(dt) {
    if (this.mode === "menu") {
      return;
    }

    this.roundCooldown = Math.max(0, this.roundCooldown - dt);
    this.sideCooldowns.left = Math.max(0, this.sideCooldowns.left - dt);
    this.sideCooldowns.right = Math.max(0, this.sideCooldowns.right - dt);
    this.leftCannon.update(dt);
    this.rightCannon.update(dt);

    while (this.pendingBotShots.length > 0 && performance.now() >= this.pendingBotShots[0].at) {
      const shot = this.pendingBotShots.shift();
      this.rightCannon.setFrozen(false);
      this.fire("right", shot.angle, shot.power, { id: `bot-${++this.lastShotId}` });
    }

    if (this.mode === "bot" && this.pendingBotShots.length === 0 && this.sideCooldowns.right <= 0 && this.roundCooldown <= 0) {
      this.scheduleBotShot();
    }

    for (const projectile of this.projectiles) {
      projectile.update(dt, this.wind);
      this.particles.trail(projectile.x, projectile.y);
    }

    this.checkProjectileCollisions();
    for (const projectile of [...this.projectiles]) {
      this.checkProjectileState(projectile);
    }

    this.particles.update(dt);
  }

  checkProjectileCollisions() {
    for (let i = 0; i < this.projectiles.length; i += 1) {
      for (let j = i + 1; j < this.projectiles.length; j += 1) {
        const a = this.projectiles[i];
        const b = this.projectiles[j];
        if (a.owner === b.owner) {
          continue;
        }
        if (distance(a, b) <= a.radius + b.radius) {
          const x = (a.x + b.x) * 0.5;
          const y = (a.y + b.y) * 0.5;
          this.removeProjectileById(a.id);
          this.removeProjectileById(b.id);
          this.audio.playExplosion();
          this.particles.burst(x, y, [
            "rgba(255,245,204,1)",
            "rgba(255,181,84,1)",
            "rgba(255,104,76,1)",
            "rgba(120,209,255,1)"
          ], 26, 150);
          return;
        }
      }
    }
  }

  checkProjectileState(projectile) {
    if (!projectile) {
      return;
    }

    const enemy = this.getCannon(this.getOpponentSide(projectile.owner));
    const terrainY = this.terrainY(projectile.x);
    const speed = Math.hypot(projectile.vx, projectile.vy);

    if (distance(projectile, enemy) < enemy.hitRadius + projectile.radius) {
      this.resolveExplosion(projectile.x, projectile.y, projectile.owner, projectile.id);
      return;
    }

    if (
      projectile.y + projectile.radius >= terrainY - 2 ||
      (projectile.y >= terrainY - 10 && speed < 40) ||
      projectile.x < -20 ||
      projectile.x > this.width + 20 ||
      projectile.y > this.height + 40 ||
      projectile.life > 10
    ) {
      this.handleGroundContact(projectile, terrainY);
    }
  }

  handleGroundContact(projectile, terrainY) {
    projectile.y = terrainY - projectile.radius;
    const impactSpeed = Math.hypot(projectile.vx, projectile.vy);

    if (projectile.bounces < projectile.maxBounces && impactSpeed > MIN_BOUNCE_SPEED) {
      projectile.bounces += 1;
      projectile.vy = Math.abs(projectile.vy) * GROUND_DAMPING;
      projectile.vx *= GROUND_FRICTION;
      this.particles.burst(projectile.x, terrainY, [
        "rgba(255,214,130,0.65)",
        "rgba(134,204,177,0.55)",
        "rgba(255,129,82,0.55)"
      ], 8, 46);
      return;
    }

    this.removeProjectileById(projectile.id);
    this.particles.burst(projectile.x, terrainY, [
      "rgba(255,214,130,0.45)",
      "rgba(134,204,177,0.45)",
      "rgba(255,129,82,0.35)"
    ], 10, 34);
  }

  removeProjectileById(id) {
    this.projectiles = this.projectiles.filter((projectile) => projectile.id !== id);
  }

  resolveExplosion(x, y, scoringSide = null, projectileId = null) {
    if (projectileId) {
      this.removeProjectileById(projectileId);
    }
    this.audio.playExplosion();
    if (scoringSide) {
      this.audio.playHit();
    }
    this.particles.burst(x, y, [
      "rgba(255,245,204,1)",
      "rgba(255,181,84,1)",
      "rgba(255,104,76,1)",
      "rgba(120,209,255,1)"
    ], scoringSide ? 28 : 18, scoringSide ? 160 : 110);
    if (scoringSide) {
      this.roundCooldown = ROUND_RESET_DELAY;
      this.awardPoint(scoringSide);
    }
  }

  scheduleNextRound() {
    this.wind = randomWind();
    this.setupRound();
  }

  drawSky() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, this.theme.skyTop);
    gradient.addColorStop(0.6, this.theme.skyMid);
    gradient.addColorStop(1, this.theme.skyBottom);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.theme.moon) {
      this.ctx.fillStyle = "rgba(245, 244, 226, 0.95)";
      this.ctx.beginPath();
      this.ctx.arc(this.width * 0.82, this.height * 0.18, 38, 0, Math.PI * 2);
      this.ctx.fill();
    }

    if (this.theme.sun) {
      const sunGlow = this.ctx.createRadialGradient(this.width * 0.82, this.height * 0.2, 10, this.width * 0.82, this.height * 0.2, 68);
      sunGlow.addColorStop(0, "rgba(255, 247, 190, 0.95)");
      sunGlow.addColorStop(1, "rgba(255, 247, 190, 0)");
      this.ctx.fillStyle = sunGlow;
      this.ctx.beginPath();
      this.ctx.arc(this.width * 0.82, this.height * 0.2, 68, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = "rgba(255, 237, 160, 0.98)";
      this.ctx.beginPath();
      this.ctx.arc(this.width * 0.82, this.height * 0.2, 34, 0, Math.PI * 2);
      this.ctx.fill();
    }

    if (this.theme.stars) {
      for (const star of this.stars) {
        const alpha = 0.4 + (Math.sin(performance.now() * 0.0015 + star.twinkle) + 1) * 0.25;
        this.ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(star.x * this.width, star.y * this.height, star.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    if (this.theme.jungle) {
      this.ctx.fillStyle = "rgba(16, 44, 21, 0.7)";
      for (let i = 0; i < 7; i += 1) {
        const x = (i / 6) * this.width;
        this.ctx.beginPath();
        this.ctx.moveTo(x - 70, this.height * 0.72);
        this.ctx.quadraticCurveTo(x, this.height * 0.42, x + 70, this.height * 0.72);
        this.ctx.fill();
      }
      this.ctx.fillStyle = "rgba(46, 86, 49, 0.6)";
      for (let i = 0; i < 10; i += 1) {
        const x = (i / 9) * this.width;
        this.ctx.fillRect(x, this.height * 0.47, 10, this.height * 0.23);
      }
    }

    if (this.theme.desert) {
      this.ctx.fillStyle = "rgba(188, 118, 49, 0.35)";
      for (let i = 0; i < 4; i += 1) {
        const x = this.width * (0.15 + i * 0.22);
        const y = this.height * (0.58 + (i % 2) * 0.05);
        this.ctx.beginPath();
        this.ctx.arc(x, y, 34, Math.PI, 0);
        this.ctx.arc(x + 24, y, 30, Math.PI, 0);
        this.ctx.fill();
      }

      this.ctx.strokeStyle = "rgba(111, 133, 52, 0.75)";
      this.ctx.lineWidth = 6;
      for (let i = 0; i < 5; i += 1) {
        const x = this.width * (0.1 + i * 0.2);
        const baseY = this.height * (0.78 - (i % 2) * 0.04);
        this.ctx.beginPath();
        this.ctx.moveTo(x, baseY);
        this.ctx.lineTo(x, baseY - 42);
        this.ctx.moveTo(x, baseY - 24);
        this.ctx.quadraticCurveTo(x - 16, baseY - 36, x - 20, baseY - 54);
        this.ctx.moveTo(x, baseY - 18);
        this.ctx.quadraticCurveTo(x + 18, baseY - 30, x + 22, baseY - 48);
        this.ctx.stroke();
      }
    }
  }

  drawTerrain() {
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.height);
    for (let x = 0; x <= this.width; x += 12) {
      this.ctx.lineTo(x, this.terrainY(x));
    }
    this.ctx.lineTo(this.width, this.height);
    this.ctx.closePath();

    const gradient = this.ctx.createLinearGradient(0, this.height * 0.65, 0, this.height);
    gradient.addColorStop(0, this.theme.terrainTop);
    gradient.addColorStop(1, this.theme.terrainBottom);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    this.ctx.strokeStyle = this.theme.ridge;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
  }

  render() {
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawSky();
    drawWindRibbon(this.ctx, this.width, this.wind);
    this.drawTerrain();
    this.leftCannon.draw(this.ctx, this.sideCooldowns.left <= 0);
    this.rightCannon.draw(this.ctx, this.sideCooldowns.right <= 0);
    this.particles.draw(this.ctx);
    for (const projectile of this.projectiles) {
      projectile.draw(this.ctx);
    }
    this.ctx.restore();
  }

  loop = (time) => {
    const dt = Math.min((time - this.lastTime) / 1000, 1 / 30);
    this.lastTime = time;
    this.update(dt);
    this.render();
    requestAnimationFrame(this.loop);
  };
}
