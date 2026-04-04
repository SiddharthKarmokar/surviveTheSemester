/**
 * Canon Score Calculator
 * Scoring based on:
 * - Shots fired (efficiency)
 * - Score achieved relative to target
 * - Time taken
 */

import BaseScoreCalculator from "./BaseScoreCalculator.js";

const SHOTS_BASE_SCORE = 100;
const EFFICIENCY_BONUS_FACTOR = 0.3;
const PERFECT_SHOTS = 3; // Assumed optimal number of shots to win

export class CanonScoreCalculator extends BaseScoreCalculator {
  constructor() {
    super("canon");
  }

  /**
   * Calculate score based on target score reached and efficiency
   */
  calculateWinnerScore(winner, loser, gameMetadata = {}) {
    const { shotsFired = 5, targetScore = 3, timeTaken = 120000 } = gameMetadata;

    let score = SHOTS_BASE_SCORE;

    // Bonus for using fewer shots
    const efficiencyBonus = Math.max(0, (PERFECT_SHOTS - shotsFired) * EFFICIENCY_BONUS_FACTOR);
    score += efficiencyBonus * 10;

    // Ensure minimum score
    return Math.max(10, Math.round(score));
  }

  calculateLoserScore(winner, loser, gameMetadata = {}) {
    return Math.round(SHOTS_BASE_SCORE * 0.15);
  }

  getPerformanceMultiplier(winner, loser, gameMetadata = {}) {
    const { shotsFired = 5, targetScore = 3 } = gameMetadata;

    if (shotsFired <= 3) {
      return 1.4; // Excellent
    } else if (shotsFired <= 5) {
      return 1.1; // Good
    } else {
      return 0.9; // Average
    }
  }
}

export default CanonScoreCalculator;
