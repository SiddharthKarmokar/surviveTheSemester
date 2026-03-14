export const GRAVITY = 9.8;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function stepProjectile(projectile, dt, windForce) {
  projectile.vx += windForce * dt * 60;
  projectile.x += projectile.vx * dt;
  projectile.y -= projectile.vy * dt;
  projectile.vy -= GRAVITY * projectile.gravityScale * dt * 60;
}

export function pointOnTerrain(x, width, height, terrain) {
  const nx = clamp(x / width, 0, 1);
  return height - terrain(nx) * height;
}

export function normalizeAngleDeg(deg) {
  return (deg * Math.PI) / 180;
}
