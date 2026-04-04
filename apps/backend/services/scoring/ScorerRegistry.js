/**
 * Score Calculator Registry
 * Central registry for all game score calculators
 */

import Puzzle15ScoreCalculator from "./Puzzle15ScoreCalculator.js";
import CanonScoreCalculator from "./CanonScoreCalculator.js";
import BinarySudokuScoreCalculator from "./BinarySudokuScoreCalculator.js";
import MathTugScoreCalculator from "./MathTugScoreCalculator.js";
import CampusFighterScoreCalculator from "./CampusFighterScoreCalculator.js";

const SCORE_CALCULATORS = new Map([
  ["puzzle15", new Puzzle15ScoreCalculator()],
  ["canon", new CanonScoreCalculator()],
  ["binarySudoku", new BinarySudokuScoreCalculator()],
  ["mathtug", new MathTugScoreCalculator()],
  ["mathTug", new MathTugScoreCalculator()], // Handle both cases
  ["campusFighter", new CampusFighterScoreCalculator()],
]);

/**
 * Get score calculator for a game type
 * @param {string} gameType - Game type identifier
 * @returns {BaseScoreCalculator} Score calculator instance
 */
export function getScoreCalculator(gameType) {
  const calculator = SCORE_CALCULATORS.get(gameType);
  if (!calculator) {
    throw new Error(
      `No score calculator found for game type: ${gameType}. Available: ${Array.from(SCORE_CALCULATORS.keys()).join(", ")}`
    );
  }
  return calculator;
}

/**
 * Register a new score calculator
 * @param {string} gameType - Game type identifier
 * @param {BaseScoreCalculator} calculator - Calculator instance
 */
export function registerScoreCalculator(gameType, calculator) {
  SCORE_CALCULATORS.set(gameType, calculator);
}

/**
 * Get all registered calculators
 * @returns {Array} Array of [gameType, calculator] pairs
 */
export function getAllCalculators() {
  return Array.from(SCORE_CALCULATORS.entries());
}

/**
 * Check if calculator exists
 * @param {string} gameType - Game type identifier
 * @returns {boolean}
 */
export function hasCalculator(gameType) {
  return SCORE_CALCULATORS.has(gameType);
}

export default {
  getScoreCalculator,
  registerScoreCalculator,
  getAllCalculators,
  hasCalculator,
};
