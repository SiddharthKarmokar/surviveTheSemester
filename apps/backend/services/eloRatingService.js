/**
 * ELO Rating System Service
 * Calculates rating changes based on ELO algorithm
 * Used for calculating rating changes in competitive games
 */

const DEFAULT_K_FACTOR = 32;          // Standard K-factor for rating change magnitude
const K_FACTOR_HIGH_RATING = 16;      // Reduced K-factor for players above 2400 rating
const K_FACTOR_LOW_RATING = 48;       // Increased K-factor for players below 1200 rating
const HIGH_RATING_THRESHOLD = 2400;
const LOW_RATING_THRESHOLD = 1200;

/**
 * Calculate expected score based on ELO ratings
 * @param {number} playerRating - Current player rating
 * @param {number} opponentRating - Opponent rating
 * @returns {number} Expected score (0-1)
 */
export function calculateExpectedScore(playerRating, opponentRating) {
  const ratingDiff = opponentRating - playerRating;
  return 1 / (1 + Math.pow(10, ratingDiff / 400));
}

/**
 * Get K-factor based on player rating
 * Higher rated players have lower K-factors to stabilize their ratings
 * @param {number} rating - Player rating
 * @returns {number} K-factor
 */
function getKFactor(rating) {
  if (rating >= HIGH_RATING_THRESHOLD) return K_FACTOR_HIGH_RATING;
  if (rating < LOW_RATING_THRESHOLD) return K_FACTOR_LOW_RATING;
  return DEFAULT_K_FACTOR;
}

/**
 * Calculate ELO rating change for a game result
 * @param {object} params - Parameters
 * @param {number} params.playerRating - Player's current rating
 * @param {number} params.opponentRating - Opponent's current rating
 * @param {number} params.playerScore - Actual player score (0=loss, 0.5=draw, 1=win)
 * @returns {object} {ratingChange, newRating, expected, actual}
 */
export function calculateRatingChange({
  playerRating,
  opponentRating,
  playerScore,
}) {
  const expectedScore = calculateExpectedScore(playerRating, opponentRating);
  const kFactor = getKFactor(playerRating);
  const ratingChange = kFactor * (playerScore - expectedScore);
  const newRating = Math.max(0, Math.round(playerRating + ratingChange));

  return {
    ratingChange: Math.round(ratingChange),
    newRating,
    expectedScore: parseFloat(expectedScore.toFixed(3)),
    actualScore: playerScore,
  };
}

/**
 * Calculate rating changes for both players after a game
 * @param {object} params - Parameters
 * @param {number} params.winnerRating - Winner's current rating
 * @param {number} params.loserRating - Loser's current rating
 * @returns {object} {winner: {ratingChange, newRating}, loser: {ratingChange, newRating}}
 */
export function calculateBothPlayersRatingChange({
  winnerRating,
  loserRating,
}) {
  const winner = calculateRatingChange({
    playerRating: winnerRating,
    opponentRating: loserRating,
    playerScore: 1, // Win
  });

  const loser = calculateRatingChange({
    playerRating: loserRating,
    opponentRating: winnerRating,
    playerScore: 0, // Loss
  });

  return { winner, loser };
}

/**
 * Calculate rating with performance bonus
 * Bonus is applied based on how well player performed relative to their rating
 * @param {object} params - Parameters
 * @param {number} params.ratingChange - Base rating change from ELO
 * @param {number} params.performanceMultiplier - Performance factor (0.5 = poor, 1 = expected, 1.5 = excellent)
 * @returns {number} Adjusted rating change
 */
export function applyPerformanceBonus(ratingChange, performanceMultiplier) {
  return Math.round(ratingChange * performanceMultiplier);
}

export default {
  calculateExpectedScore,
  calculateRatingChange,
  calculateBothPlayersRatingChange,
  applyPerformanceBonus,
};
