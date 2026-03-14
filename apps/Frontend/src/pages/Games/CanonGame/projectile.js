import { stepProjectile } from "./physics.js";

export class Projectile {
  constructor({ x, y, vx, vy, owner }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.owner = owner;
    this.radius = 8;
    this.gravityScale = 0.21;
    this.alive = true;
    this.life = 0;
    this.bounces = 0;
    this.maxBounces = 3;
  }

  update(dt, windForce) {
    if (!this.alive) {
      return;
    }
    this.life += dt;
    stepProjectile(this, dt, windForce);
  }

  draw(ctx) {
    const glow = ctx.createRadialGradient(this.x, this.y, 2, this.x, this.y, 18);
    glow.addColorStop(0, "rgba(255,248,200,1)");
    glow.addColorStop(0.45, "rgba(255,174,88,0.9)");
    glow.addColorStop(1, "rgba(255,120,76,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff7d6";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
