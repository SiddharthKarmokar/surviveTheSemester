/**
 * CampusFighter Score Calculator
 * Scoring based on:
 * - HP remaining
 * - Combos performed
 * - Time survived
 */

import BaseScoreCalculator from "./BaseScoreCalculator.js";

const BASE_SCORE = 100;
const HEALTH_PRESERVATION_BONUS = 0.5; // Points per remaining HP percentage
const COMBO_BONUS = 15; // Points per combo

export class CampusFighterScoreCalculator extends BaseScoreCalculator {
  constructor() {
    super("campusFighter");
  }

  calculateWinnerScore(winner, loser, gameMetadata = {}) {
    const {
      healthRemaining = 100,
      combosPerformed = 0,
      timeSurvived = 60000,
    } = gameMetadata;

    let score = BASE_SCORE;

    // Bonus for remaining health
    score += (healthRemaining * HEALTH_PRESERVATION_BONUS) / 100;

    // Bonus for combos
    score += combosPerformed * COMBO_BONUS;

    // Time survived bonus
    score += timeSurvived / 10000; // Extra points per 10 seconds

    return Math.max(10, Math.round(score));
  }

  calculateLoserScore(winner, loser, gameMetadata = {}) {
    const { healthRemaining = 0 } = gameMetadata;
    // Give some credit based on how long they survived
    return Math.max(5, Math.round((healthRemaining * 0.15) / 100 + BASE_SCORE * 0.1));
  }

  getPerformanceMultiplier(winner, loser, gameMetadata = {}) {
    const { healthRemaining = 100, combosPerformed = 0 } = gameMetadata;

    if (healthRemaining >= 80 && combosPerformed >= 5) return 1.5;
    if (healthRemaining >= 60) return 1.2;
    if (healthRemaining >= 40) return 1.0;
    return 0.9;
  }
}

export default CampusFighterScoreCalculator;
