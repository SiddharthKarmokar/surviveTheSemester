import { clamp } from "./physics.js";

export function randomWind() {
  return Number(((Math.random() * 0.6) - 0.3).toFixed(3));
}

export function describeWind(wind) {
  const dir = wind >= 0 ? "->" : "<-";
  return `${dir} Wind ${Math.round(Math.abs(wind) * 100)}%`;
}

export function drawWindRibbon(ctx, width, wind) {
  const strength = clamp(Math.abs(wind) / 0.3, 0, 1);
  const dir = wind >= 0 ? 1 : -1;
  ctx.save();
  ctx.translate(width * 0.5, 76);
  ctx.strokeStyle = `rgba(148, 225, 255, ${0.45 + strength * 0.45})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-30 * dir, 0);
  ctx.quadraticCurveTo(0, -10 - strength * 14, 30 * dir, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(30 * dir, 0);
  ctx.lineTo((30 - 10) * dir, -8);
  ctx.lineTo((30 - 10) * dir, 8);
  ctx.closePath();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fill();
  ctx.restore();
}
