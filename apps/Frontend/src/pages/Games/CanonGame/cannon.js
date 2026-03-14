import { easeOutCubic, normalizeAngleDeg } from "./physics.js";

export class Cannon {
  constructor({ x, y, side, color }) {
    this.x = x;
    this.y = y;
    this.side = side;
    this.color = color;
    this.angleMin = normalizeAngleDeg(20);
    this.angleMax = normalizeAngleDeg(80);
    this.angle = side === "left" ? normalizeAngleDeg(45) : Math.PI - normalizeAngleDeg(45);
    this.oscillation = Math.random();
    this.freezeAim = false;
    this.recoil = 0;
    this.radius = 30;
    this.barrelLength = 44;
    this.hitRadius = 28;
  }

  update(dt) {
    this.recoil = Math.max(0, this.recoil - dt * 2.6);
    if (this.freezeAim) {
      return;
    }
    this.oscillation += dt * 0.65;
    const t = (Math.sin(this.oscillation * Math.PI * 2) + 1) * 0.5;
    const swing = this.angleMin + (this.angleMax - this.angleMin) * t;
    this.angle = this.side === "left" ? swing : Math.PI - swing;
  }

  setFrozen(frozen) {
    this.freezeAim = frozen;
  }

  fire() {
    this.recoil = 1;
  }

  getBarrelTip() {
    const recoilShift = easeOutCubic(this.recoil) * 10;
    const dirX = Math.cos(this.angle);
    const dirY = -Math.sin(this.angle);
    const offset = this.barrelLength - recoilShift;
    return {
      x: this.x + dirX * offset,
      y: this.y + dirY * offset
    };
  }

  draw(ctx, active) {
    const recoilShift = easeOutCubic(this.recoil) * 10;
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = "rgba(0,0,0,0.24)";
    ctx.beginPath();
    ctx.ellipse(0, 22, 44, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(-this.angle);
    ctx.translate(-recoilShift, 0);
    ctx.fillStyle = active ? "#ffe392" : "#dce6ff";
    ctx.beginPath();
    ctx.roundRect(0, -9, this.barrelLength, 18, 9);
    ctx.fill();
    ctx.restore();

    const tip = this.getBarrelTip();
    ctx.save();
    ctx.strokeStyle = active ? "rgba(255, 227, 146, 0.95)" : "rgba(183, 208, 255, 0.8)";
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(tip.x + Math.cos(this.angle) * 24, tip.y - Math.sin(this.angle) * 24);
    ctx.stroke();
    ctx.restore();
  }
}
