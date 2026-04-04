/**
 * Rating Update Service
 * Orchestrates the entire rating and score update process
 * Handles ELO calculations, database updates, and real-time notifications
 */

import { prisma } from "../prisma/prisma.js";
import {
  calculateBothPlayersRatingChange,
  applyPerformanceBonus,
} from "./eloRatingService.js";
import { getScoreCalculator } from "./scoring/ScorerRegistry.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcDayKey(dateLike) {
  const d = new Date(dateLike);
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, "0"),
    String(d.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function toUtcMs(dayKey) {
  return Date.parse(`${dayKey}T00:00:00.000Z`);
}

function normalizeDayKeys(dayKeys) {
  return [...new Set((dayKeys || []).filter(Boolean))].sort((left, right) => {
    return toUtcMs(left) - toUtcMs(right);
  });
}

function buildRuns(dayKeys) {
  const ordered = normalizeDayKeys(dayKeys);
  if (ordered.length === 0) {
    return [];
  }

  const runs = [];
  let currentRun = [ordered[0]];

  for (let index = 1; index < ordered.length; index += 1) {
    const previousKey = ordered[index - 1];
    const currentKey = ordered[index];
    if (toUtcMs(currentKey) - toUtcMs(previousKey) === DAY_MS) {
      currentRun.push(currentKey);
    } else {
      runs.push(currentRun);
      currentRun = [currentKey];
    }
  }

  runs.push(currentRun);
  return runs;
}

export function buildStreakSnapshot(dayKeys, now = new Date()) {
  const normalizedDayKeys = normalizeDayKeys(dayKeys);
  const runs = buildRuns(normalizedDayKeys);
  const todayKey = toUtcDayKey(now);
  const todayMs = toUtcMs(todayKey);

  const currentRun = runs.find((run) => run[run.length - 1] === todayKey) || [];
  const bestRun = runs.reduce((best, run) => {
    if (run.length > best.length) return run;
    if (run.length === best.length && run.length > 0) {
      return toUtcMs(run[run.length - 1]) > toUtcMs(best[best.length - 1]) ? run : best;
    }
    return best;
  }, []);

  const currentStreakDays = currentRun.length > 0 ? currentRun : [];
  const currentStreak = currentStreakDays.length;
  const maxStreakDays = bestRun;
  const maxStreak = maxStreakDays.length;

  const activeDays = normalizedDayKeys.filter((dayKey) => toUtcMs(dayKey) <= todayMs);

  return {
    activityDays: normalizedDayKeys,
    currentStreak,
    maxStreak,
    currentStreakDays,
    bestStreakDays: maxStreakDays,
    activeDays,
    todayKey,
  };
}

async function loadUserActivityDayKeys(userId) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      streakActivityDays: true,
    },
  });

  const storedDays = Array.isArray(user?.streakActivityDays) ? user.streakActivityDays : [];
  if (storedDays.length > 0) {
    return storedDays;
  }

  const fallbackResults = await prisma.gameResult.findMany({
    where: {
      OR: [{ winnerId: userId }, { loserId: userId }],
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return fallbackResults.map((entry) => toUtcDayKey(entry.createdAt));
}

export async function syncUserStreakProfile(userId, extraDayKeys = []) {
  const existingDays = await loadUserActivityDayKeys(userId);
  const mergedDays = normalizeDayKeys([...existingDays, ...extraDayKeys]);
  const snapshot = buildStreakSnapshot(mergedDays);

  await prisma.users.update({
    where: { id: userId },
    data: {
      streak: snapshot.currentStreak,
      maxStreak: snapshot.maxStreak,
      streakActivityDays: snapshot.activityDays,
      currentStreakDays: snapshot.currentStreakDays,
      bestStreakDays: snapshot.bestStreakDays,
    },
  });

  return snapshot;
}

export async function recordGameCompletionActivity(userIds, completedAt = new Date()) {
  const dayKey = toUtcDayKey(completedAt);
  const uniqueUserIds = [...new Set((userIds || []).filter(Boolean))];

  if (uniqueUserIds.length === 0) {
    return [];
  }

  return Promise.all(uniqueUserIds.map((userId) => syncUserStreakProfile(userId, [dayKey])));
}

async function recomputeAndPersistStreak(userId) {
  const snapshot = await syncUserStreakProfile(userId);
  return {
    streak: snapshot.currentStreak,
    maxStreak: snapshot.maxStreak,
  };
}

export async function updateStreaksForUsers(userIds) {
  const uniqueIds = [...new Set((userIds || []).filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  return Promise.all(uniqueIds.map((id) => recomputeAndPersistStreak(id)));
}

export async function recordUnratedGameResult({
  gameType,
  winnerId,
  loserId,
  winnerScore = 0,
  loserScore = 0,
  gameMetadata = {},
}) {
  if (!winnerId || !loserId) {
    throw new Error("winnerId and loserId are required to record game completion");
  }

  const gameResult = await prisma.gameResult.create({
    data: {
      gameType,
      winnerId,
      loserId,
      winnerScore,
      loserScore,
      windScore: 0,
      loserRating: 0,
      metadata: gameMetadata,
    },
  });

  await recordGameCompletionActivity([winnerId, loserId], gameResult.createdAt);
  return gameResult;
}

/**
 * Process game result and update ratings
 * @param {object} params - Parameters
 * @param {string} params.gameType - Game type (e.g., 'puzzle15')
 * @param {string} params.winnerId - Winner user ID
 * @param {string} params.loserId - Loser user ID
 * @param {object} params.gameMetadata - Game-specific metadata (moves, time, etc.)
 * @returns {object} Updated ratings for both players
 */
export async function processGameResult({
  gameType,
  winnerId,
  loserId,
  gameMetadata = {},
}) {
  try {
    // Get or create game ratings
    let [winnerGameRating, loserGameRating] = await Promise.all([
      prisma.userGameRating.upsert({
        where: {
          userId_gameType: {
            userId: winnerId,
            gameType,
          },
        },
        update: {},
        create: {
          userId: winnerId,
          gameType,
          rating: 1200,
          wins: 0,
          losses: 0,
          totalGames: 0,
          bestScore: 0,
        },
      }),
      prisma.userGameRating.upsert({
        where: {
          userId_gameType: {
            userId: loserId,
            gameType,
          },
        },
        update: {},
        create: {
          userId: loserId,
          gameType,
          rating: 1200,
          wins: 0,
          losses: 0,
          totalGames: 0,
          bestScore: 0,
        },
      }),
    ]);

    // Get score calculator
    const scoreCalculator = getScoreCalculator(gameType);

    // Get full user objects for score calculation
    const [winner, loser] = await Promise.all([
      prisma.users.findUnique({ where: { id: winnerId } }),
      prisma.users.findUnique({ where: { id: loserId } }),
    ]);

    // Calculate scores
    const winnerScore = scoreCalculator.calculateWinnerScore(
      winner,
      loser,
      gameMetadata
    );
    const loserScore = scoreCalculator.calculateLoserScore(
      winner,
      loser,
      gameMetadata
    );

    // Calculate rating changes
    const ratingChanges = calculateBothPlayersRatingChange({
      winnerRating: winnerGameRating.rating,
      loserRating: loserGameRating.rating,
    });

    // Apply performance bonus to winner
    const perfMultiplier = scoreCalculator.getPerformanceMultiplier(
      winner,
      loser,
      gameMetadata
    );
    const adjustedWinnerRatingChange = applyPerformanceBonus(
      ratingChanges.winner.ratingChange,
      perfMultiplier
    );

    const newWinnerRating =
      winnerGameRating.rating + adjustedWinnerRatingChange;
    const newLoserRating = loserGameRating.rating + ratingChanges.loser.ratingChange;

    // Update game ratings
    [winnerGameRating, loserGameRating] = await Promise.all([
      prisma.userGameRating.update({
        where: {
          userId_gameType: {
            userId: winnerId,
            gameType,
          },
        },
        data: {
          rating: Math.max(0, newWinnerRating),
          wins: { increment: 1 },
          totalGames: { increment: 1 },
          bestScore: {
            set: Math.max(winnerGameRating.bestScore, winnerScore),
          },
          updatedAt: new Date(),
        },
      }),
      prisma.userGameRating.update({
        where: {
          userId_gameType: {
            userId: loserId,
            gameType,
          },
        },
        data: {
          rating: Math.max(0, newLoserRating),
          losses: { increment: 1 },
          totalGames: { increment: 1 },
          bestScore: {
            set: Math.max(loserGameRating.bestScore, loserScore),
          },
          updatedAt: new Date(),
        },
      }),
    ]);

    // Create game result record
    const gameResult = await prisma.gameResult.create({
      data: {
        gameType,
        winnerId,
        loserId,
        winnerScore,
        loserScore,
        windScore: adjustedWinnerRatingChange,
        loserRating: ratingChanges.loser.ratingChange,
        metadata: gameMetadata,
      },
    });

    // Update overall user rating (weighted average of all games)
    const [updatedWinnerOverallRating, updatedLoserOverallRating] =
      await Promise.all([
        calculateOverallRating(winnerId),
        calculateOverallRating(loserId),
      ]);

    // Update users' overall rating
    await Promise.all([
      prisma.users.update({
        where: { id: winnerId },
        data: { rating: updatedWinnerOverallRating },
      }),
      prisma.users.update({
        where: { id: loserId },
        data: { rating: updatedLoserOverallRating },
      }),
    ]);

    await recordGameCompletionActivity([winnerId, loserId], gameResult.createdAt);

    return {
      winner: {
        gameType,
        previousRating: winnerGameRating.rating,
        newRating: winnerGameRating.rating + adjustedWinnerRatingChange,
        ratingChange: adjustedWinnerRatingChange,
        score: winnerScore,
        wins: winnerGameRating.wins + 1,
        totalGames: winnerGameRating.totalGames + 1,
        bestScore: Math.max(winnerGameRating.bestScore, winnerScore),
      },
      loser: {
        gameType,
        previousRating: loserGameRating.rating,
        newRating: loserGameRating.rating + ratingChanges.loser.ratingChange,
        ratingChange: ratingChanges.loser.ratingChange,
        score: loserScore,
        losses: loserGameRating.losses + 1,
        totalGames: loserGameRating.totalGames + 1,
        bestScore: Math.max(loserGameRating.bestScore, loserScore),
      },
      gameResult,
    };
  } catch (error) {
    console.error("Error processing game result:", error);
    throw error;
  }
}

/**
 * Calculate overall user rating based on weighted average of all game ratings
 * @param {string} userId - User ID
 * @returns {number} Overall rating
 */
export async function calculateOverallRating(userId) {
  const gameRatings = await prisma.userGameRating.findMany({
    where: { userId },
  });

  if (gameRatings.length === 0) {
    return 1200; // Default rating
  }

  // Get game configs with weightages
  const gameConfigs = await prisma.gameConfig.findMany();
  const weightageMap = new Map(
    gameConfigs.map((config) => [config.gameType, config.weightage])
  );

  let totalWeightedRating = 0;
  let totalWeight = 0;

  for (const gameRating of gameRatings) {
    const weightage = weightageMap.get(gameRating.gameType) || 1.0;
    totalWeightedRating += gameRating.rating * weightage;
    totalWeight += weightage;
  }

  if (totalWeight === 0) {
    return 1200;
  }

  return Math.round(totalWeightedRating / totalWeight);
}

/**
 * Update game weightages
 * @param {object} weightages - Map of gameType to weightage value
 */
export async function updateGameWeightages(weightages) {
  const updates = [];
  for (const [gameType, weightage] of Object.entries(weightages)) {
    updates.push(
      prisma.gameConfig.upsert({
        where: { gameType },
        update: { weightage },
        create: {
          gameType,
          displayName: gameType,
          weightage,
        },
      })
    );
  }

  await Promise.all(updates);

  console.log("Game weightages updated:", weightages);
}

/**
 * Get all user game statistics
 * @param {string} userId - User ID
 * @returns {object} User's game statistics
 */
export async function getUserGameStats(userId) {
  const gameRatings = await prisma.userGameRating.findMany({
    where: { userId },
    orderBy: { rating: "desc" },
  });

  const overallRating = await calculateOverallRating(userId);

  return {
    overallRating,
    gameStats: gameRatings,
    totalGames: gameRatings.reduce((sum, g) => sum + g.totalGames, 0),
    totalWins: gameRatings.reduce((sum, g) => sum + g.wins, 0),
  };
}

/**
 * Get user leaderboard position in a game
 * @param {string} userId - User ID
 * @param {string} gameType - Game type
 * @returns {object} Leaderboard position info
 */
export async function getUserGameLeaderboardPosition(userId, gameType) {
  const userRating = await prisma.userGameRating.findUnique({
    where: {
      userId_gameType: {
        userId,
        gameType,
      },
    },
  });

  if (!userRating) {
    return null;
  }

  const betterRatings = await prisma.userGameRating.count({
    where: {
      gameType,
      rating: {
        gt: userRating.rating,
      },
    },
  });

  return {
    position: betterRatings + 1,
    rating: userRating.rating,
    gameType,
  };
}

export default {
  processGameResult,
  calculateOverallRating,
  updateGameWeightages,
  getUserGameStats,
  getUserGameLeaderboardPosition,
  recordUnratedGameResult,
  updateStreaksForUsers,
  recordGameCompletionActivity,
  syncUserStreakProfile,
  buildStreakSnapshot,
};
