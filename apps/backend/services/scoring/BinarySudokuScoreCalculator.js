/**
 * BinarySudoku Score Calculator
 * Scoring based on:
 * - Moves/cells filled
 * - Time taken
 * - Difficulty level
 */

import BaseScoreCalculator from "./BaseScoreCalculator.js";

const BASE_SCORE = 100;
const OPTIMAL_MOVES = 40; // Optimal number of moves to complete
const TIME_BONUS_FACTOR = 0.15;

export class BinarySudokuScoreCalculator extends BaseScoreCalculator {
  constructor() {
    super("binarySudoku");
  }

  calculateWinnerScore(winner, loser, gameMetadata = {}) {
    const { moves = 40, timeTaken = 90000, difficulty = "medium" } = gameMetadata;

    let score = BASE_SCORE;
    const difficultyMultiplier = this._getDifficultyMultiplier(difficulty);

    // Penalize extra moves
    const excessMoves = Math.max(0, moves - OPTIMAL_MOVES);
    score -= excessMoves * 0.5;

    // Time bonus
    const timeBonus = Math.max(0, (120000 - timeTaken) * TIME_BONUS_FACTOR) / 1000;
    score += timeBonus;

    return Math.max(10, Math.round(score * difficultyMultiplier));
  }

  calculateLoserScore(winner, loser, gameMetadata = {}) {
    return Math.round(BASE_SCORE * 0.2);
  }

  getPerformanceMultiplier(winner, loser, gameMetadata = {}) {
    const { moves = 40, difficulty = "medium" } = gameMetadata;

    if (moves <= OPTIMAL_MOVES * 0.8) return 1.4;
    if (moves <= OPTIMAL_MOVES) return 1.2;
    if (moves <= OPTIMAL_MOVES * 1.3) return 1.0;
    return 0.85;
  }

  _getDifficultyMultiplier(difficulty) {
    const multipliers = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.3,
    };
    return multipliers[difficulty] || 1.0;
  }
}

export default BinarySudokuScoreCalculator;
