/**
 * MathTug Score Calculator
 * Scoring based on:
 * - Correct answers
 * - Time per answer
 * - Difficulty level
 */

import BaseScoreCalculator from "./BaseScoreCalculator.js";

const BASE_SCORE = 100;
const POINTS_PER_CORRECT = 12;

export class MathTugScoreCalculator extends BaseScoreCalculator {
  constructor() {
    super("mathtug");
  }

  calculateWinnerScore(winner, loser, gameMetadata = {}) {
    const solved = Number(gameMetadata.winnerSolved ?? gameMetadata.correctAnswers ?? 0);
    const totalTimeMs = Number(gameMetadata.winnerTotalTimeMs ?? gameMetadata.timeTaken ?? 0);
    const tieBreakMethod = String(gameMetadata.tieBreakMethod || "solved_count");
    const difficulty = String(gameMetadata.difficulty || "medium");

    let score = BASE_SCORE;

    // Reward question volume first.
    score += solved * POINTS_PER_CORRECT;

    // Reward speed only for solved work.
    if (solved > 0 && totalTimeMs > 0) {
      const avgSeconds = totalTimeMs / solved / 1000;
      if (avgSeconds <= 4) score += 40;
      else if (avgSeconds <= 7) score += 25;
      else if (avgSeconds <= 10) score += 10;
    }

    // Slight bonus for stronger tie-break wins.
    if (tieBreakMethod.startsWith("per_question_speed")) {
      score += 10;
    } else if (tieBreakMethod === "total_solve_time") {
      score += 6;
    }

    // Apply difficulty multiplier
    const difficultyMultiplier = this._getDifficultyMultiplier(difficulty);
    score *= difficultyMultiplier;

    return Math.max(10, Math.round(score));
  }

  calculateLoserScore(winner, loser, gameMetadata = {}) {
    const solved = Number(gameMetadata.loserSolved ?? 0);
    const totalTimeMs = Number(gameMetadata.loserTotalTimeMs ?? 0);

    let score = BASE_SCORE * 0.2 + solved * 8;
    if (solved > 0 && totalTimeMs > 0) {
      const avgSeconds = totalTimeMs / solved / 1000;
      if (avgSeconds <= 7) score += 8;
      else if (avgSeconds <= 10) score += 4;
    }

    return Math.max(5, Math.round(score));
  }

  getPerformanceMultiplier(winner, loser, gameMetadata = {}) {
    const winnerSolved = Number(gameMetadata.winnerSolved ?? gameMetadata.correctAnswers ?? 0);
    const loserSolved = Number(gameMetadata.loserSolved ?? 0);
    const winnerTotalTimeMs = Number(gameMetadata.winnerTotalTimeMs ?? gameMetadata.timeTaken ?? 0);
    const loserTotalTimeMs = Number(gameMetadata.loserTotalTimeMs ?? 0);

    // Main factor: question lead.
    const solvedGap = winnerSolved - loserSolved;
    if (solvedGap >= 4) return 1.5;
    if (solvedGap >= 2) return 1.3;

    // If solved ties, reward higher speed edge modestly.
    if (winnerSolved === loserSolved && winnerSolved > 0 && winnerTotalTimeMs > 0 && loserTotalTimeMs > 0) {
      const winnerAvg = winnerTotalTimeMs / winnerSolved;
      const loserAvg = loserTotalTimeMs / loserSolved;
      if (winnerAvg <= loserAvg * 0.75) return 1.25;
      if (winnerAvg < loserAvg) return 1.15;
      return 1.0;
    }

    if (solvedGap === 1) return 1.15;
    return 1.0;
  }

  _getDifficultyMultiplier(difficulty) {
    const multipliers = {
      easy: 0.7,
      medium: 1.0,
      hard: 1.4,
    };
    return multipliers[difficulty] || 1.0;
  }
}

export default MathTugScoreCalculator;
