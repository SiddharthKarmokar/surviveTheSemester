function alphaColor(color, alpha) {
  if (color.startsWith("rgba(")) {
    return color.replace(/,\s*[\d.]+\)$/, `, ${alpha})`);
  }
  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
  }
  return color;
}

export class ParticleSystem {
  constructor() {
    this.items = [];
  }

  burst(x, y, palette, count = 18, speed = 120) {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
      const magnitude = speed * (0.4 + Math.random() * 0.9);
      this.items.push({
        x,
        y,
        vx: Math.cos(angle) * magnitude,
        vy: Math.sin(angle) * magnitude,
        life: 0,
        ttl: 0.45 + Math.random() * 0.35,
        size: 3 + Math.random() * 6,
        color: palette[Math.floor(Math.random() * palette.length)]
      });
    }
  }

  trail(x, y) {
    this.items.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 18,
      vy: 15 + Math.random() * 18,
      life: 0,
      ttl: 0.24 + Math.random() * 0.18,
      size: 2 + Math.random() * 3,
      color: Math.random() > 0.5 ? "rgba(255,214,130,0.85)" : "rgba(255,129,82,0.75)"
    });
  }

  update(dt) {
    this.items = this.items.filter((particle) => {
      particle.life += dt;
      if (particle.life >= particle.ttl) {
        return false;
      }
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 180 * dt;
      return true;
    });
  }

  draw(ctx) {
    for (const particle of this.items) {
      const alpha = 1 - particle.life / particle.ttl;
      ctx.fillStyle = alphaColor(particle.color, alpha);
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
