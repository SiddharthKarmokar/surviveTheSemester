/**
 * Puzzle15 Score Calculator
 * Scoring based on:
 * - Moves taken (fewer moves = higher score)
 * - Time taken (faster = bonus points)
 * - Difficulty multiplier
 */

import BaseScoreCalculator from "./BaseScoreCalculator.js";

const BASE_SCORE = 100;
const MAX_OPTIMAL_MOVES = 50;  // Optimal, well-played game
const MAX_OPTIMAL_TIME = 60000; // 60 seconds optimal time
const MOVE_PENALTY = 1;         // Points lost per extra move
const TIME_BONUS_FACTOR = 0.2;  // Extra bonus for fast completion

export class Puzzle15ScoreCalculator extends BaseScoreCalculator {
  constructor() {
    super("puzzle15");
  }

  /**
   * Calculate score for winner based on moves and time
   * Formula: BASE_SCORE - (excess_moves * MOVE_PENALTY) + timeBounusBonus
   */
  calculateWinnerScore(winner, loser, gameMetadata = {}) {
    const { moves = 50, timeTaken = 60000 } = gameMetadata;

    // Base score calculation
    let score = BASE_SCORE;

    // Penalize excessive moves
    const excessMoves = Math.max(0, moves - MAX_OPTIMAL_MOVES);
    score -= excessMoves * MOVE_PENALTY;

    // Bonus for speed
    const timeBonus = Math.max(
      0,
      (MAX_OPTIMAL_TIME - timeTaken) * TIME_BONUS_FACTOR
    ) / 1000; // Convert to seconds
    score += timeBonus;

    // Ensure minimum score
    return Math.max(10, Math.round(score));
  }

  /**
   * Loser gets participation score (small percentage of base score)
   */
  calculateLoserScore(winner, loser, gameMetadata = {}) {
    return Math.round(BASE_SCORE * 0.2); // 20% of base score
  }

  /**
   * Performance multiplier based on how efficiently the puzzle was solved
   * Excellent: solved in near-optimal moves
   * Average: solved in reasonable moves
   * Poor: took many extra moves
   */
  getPerformanceMultiplier(winner, loser, gameMetadata = {}) {
    const { moves = 50 } = gameMetadata;

    if (moves <= MAX_OPTIMAL_MOVES * 0.8) {
      return 1.5; // Excellent
    } else if (moves <= MAX_OPTIMAL_MOVES) {
      return 1.2; // Very good
    } else if (moves <= MAX_OPTIMAL_MOVES * 1.5) {
      return 1.0; // Average
    } else {
      return 0.8; // Below average
    }
  }
}

export default Puzzle15ScoreCalculator;
