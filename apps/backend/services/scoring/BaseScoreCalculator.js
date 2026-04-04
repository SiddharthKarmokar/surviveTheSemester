/**
 * Base Score Calculator Class
 * Each game extends this to implement their own scoring logic
 */

export class BaseScoreCalculator {
  constructor(gameType) {
    this.gameType = gameType;
  }

  /**
   * Calculate score for winner
   * Must be overridden by subclasses
   * @param {object} winner - Winner player data
   * @param {object} loser - Loser player data
   * @param {object} gameMetadata - Game-specific metadata
   * @returns {number} Score earned by winner
   */
  calculateWinnerScore(winner, loser, gameMetadata) {
    throw new Error(
      `calculateWinnerScore must be implemented in ${this.gameType} scorer`
    );
  }

  /**
   * Calculate score for loser
   * Can return 0 or a participation score
   * @param {object} winner - Winner player data
   * @param {object} loser - Loser player data
   * @param {object} gameMetadata - Game-specific metadata
   * @returns {number} Score earned by loser
   */
  calculateLoserScore(winner, loser, gameMetadata) {
    return 0; // Default: no score for loser
  }

  /**
   * Get performance multiplier based on game metrics
   * Used to adjust rating changes
   * @param {object} winner - Winner player data
   * @param {object} loser - Loser player data
   * @param {object} gameMetadata - Game-specific metadata
   * @returns {number} Multiplier (0.5 = poor, 1 = average, 1.5+ = excellent)
   */
  getPerformanceMultiplier(winner, loser, gameMetadata) {
    return 1.0; // Default: neutral performance
  }
}

export default BaseScoreCalculator;
