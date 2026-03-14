import { clamp } from "./physics.js";

const difficultyProfiles = {
  easy: { angleError: 14, powerError: 0.18, iterations: 10 },
  normal: { angleError: 8, powerError: 0.11, iterations: 18 },
  hard: { angleError: 3.5, powerError: 0.05, iterations: 32 }
};

export class BotController {
  constructor(difficulty = "normal") {
    this.setDifficulty(difficulty);
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    this.profile = difficultyProfiles[difficulty] || difficultyProfiles.normal;
  }

  chooseShot({ bot, target, wind, maxVelocity }) {
    let best = { score: Number.POSITIVE_INFINITY, angle: 45, power: 0.7 };

    for (let i = 0; i < this.profile.iterations; i += 1) {
      const angleDeg = 20 + Math.random() * 60;
      const power = 0.35 + Math.random() * 0.6;
      const score = this.scoreShot({ bot, target, angleDeg, power, wind, maxVelocity });
      if (score < best.score) {
        best = { score, angle: angleDeg, power };
      }
    }

    return {
      angle: clamp(best.angle + (Math.random() - 0.5) * this.profile.angleError, 20, 80),
      power: clamp(best.power + (Math.random() - 0.5) * this.profile.powerError, 0.18, 1)
    };
  }

  scoreShot({ bot, target, angleDeg, power, wind, maxVelocity }) {
    const angleRad = (Math.PI / 180) * angleDeg;
    let x = bot.x;
    let y = bot.y - 18;
    let vx = -Math.cos(angleRad) * power * maxVelocity;
    let vy = Math.sin(angleRad) * power * maxVelocity;

    for (let i = 0; i < 190; i += 1) {
      vx += wind * 0.016 * 60;
      x += vx * 0.016;
      y -= vy * 0.016;
      vy -= 9.8 * 0.21 * 0.016 * 60;
      if (y > bot.groundY + 80) {
        break;
      }
    }

    return Math.abs(x - target.x) + Math.abs(y - target.y) * 0.35;
  }
}
