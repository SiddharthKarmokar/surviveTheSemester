/**
 * Rating Management Routes
 * Endpoints for getting user stats, leaderboards, and managing weightages
 */

import express from "express";
import { isAuthenticated } from "../middleware/auth.js";
import {
  getUserGameStats,
  updateGameWeightages,
  getUserGameLeaderboardPosition,
  syncUserStreakProfile,
} from "../services/ratingUpdateService.js";
import { prisma } from "../prisma/prisma.js";

const router = express.Router();

console.log("✅ ratingRoutes.js loaded - router initialized");
console.log("📊 Available routes will be registered");

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcDayStart(dateLike) {
  const d = new Date(dateLike);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function computeStreaksFromDates(dateValues) {
  if (!Array.isArray(dateValues) || dateValues.length === 0) {
    return { currentStreak: 0, maxStreak: 0, dayStarts: [] };
  }

  const uniqueDayStarts = [...new Set(dateValues.map(toUtcDayStart))].sort((a, b) => a - b);
  const daySet = new Set(uniqueDayStarts);

  let maxStreak = 1;
  let run = 1;
  for (let i = 1; i < uniqueDayStarts.length; i += 1) {
    if (uniqueDayStarts[i] - uniqueDayStarts[i - 1] === DAY_MS) {
      run += 1;
      if (run > maxStreak) maxStreak = run;
    } else {
      run = 1;
    }
  }

  const todayStart = toUtcDayStart(new Date());
  let currentStreak = 0;
  let cursor = todayStart;
  while (daySet.has(cursor)) {
    currentStreak += 1;
    cursor -= DAY_MS;
  }

  return {
    currentStreak,
    maxStreak,
    dayStarts: uniqueDayStarts,
  };
}

/**
 * Get overall leaderboard (by overall rating)
 * GET /api/rating?limit=50
 */
router.get("/", async (req, res) => {
  const startTime = Date.now();
  try {
    console.log("\n=== GET /api/rating START ===");
    console.log(`📊 Fetching overall leaderboard`);
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    console.log(`  → Query limit: ${limit}`);

    console.log(`  → About to call prisma.users.findMany()...`);
    const leaderboard = await prisma.users.findMany({
      orderBy: { rating: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        rating: true,
        createdAt: true,
      },
    });
    console.log(`  ✅ Query successful: found ${leaderboard.length} users`);

    const responseData = {
      type: "overall",
      count: leaderboard.length,
      leaderboard,
    };
    
    console.log(`  → Setting status to 200 and sending JSON...`);
    res.status(200);
    res.json(responseData);
    
    const duration = Date.now() - startTime;
    console.log(`✅ GET /api/rating COMPLETED in ${duration}ms`);
    console.log("=== GET /api/rating END ===\n");
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("\n❌ GET /api/rating FAILED");
    console.error(`  Error: ${error.message}`);
    console.error(`  Stack: ${error.stack}`);
    console.error(`  Duration: ${duration}ms`);
    console.error("=== GET /api/rating ERROR END ===\n");
    
    res.status(500).json({
      error: "Failed to fetch overall leaderboard",
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  }
});

/**
 * Get friends leaderboard
 * GET /api/rating/friends?limit=50
 */
router.get("/friends", isAuthenticated, async (req, res) => {
  try {
    console.log("👥 GET /api/rating/friends - Fetching friends leaderboard");
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    // Get current user's friendlist
    const currentUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { friendlist: true },
    });

    if (!currentUser) {
      console.log("❌ User not found:", userId);
      return res.status(404).json({
        error: "User not found",
      });
    }

    const friendIds = Array.isArray(currentUser.friendlist) ? currentUser.friendlist : [];
    const leaderboardIds = [...new Set([userId, ...friendIds])];
    console.log(`👫 User has ${friendIds.length} friends`);

    // Keep the logged-in user in the friends leaderboard even with no friends.
    if (false && friendIds.length === 0) {
      console.log("ℹ️ User has no friends");
      return res.json({
        type: "friends",
        count: 0,
        leaderboard: [],
      });
    }

    // Get friends' ratings plus the logged-in user's rating.
    const friendsLeaderboard = await prisma.users.findMany({
      where: {
        id: {
          in: leaderboardIds,
        },
      },
      orderBy: { rating: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        rating: true,
        createdAt: true,
      },
    });

    console.log(`✅ Friends leaderboard fetched: ${friendsLeaderboard.length} friends`);
    res.json({
      type: "friends",
      count: friendsLeaderboard.length,
      leaderboard: friendsLeaderboard,
    });
  } catch (error) {
    console.error("❌ Error fetching friends leaderboard:", error);
    res.status(500).json({
      error: "Failed to fetch friends leaderboard",
      message: error.message,
    });
  }
});

/**
 * Get dashboard summary
 * GET /api/rating/summary
 */
router.get("/summary", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const freshUser = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        rating: true,
        friendlist: true,
        streak: true,
        maxStreak: true,
        streakActivityDays: true,
        currentStreakDays: true,
        bestStreakDays: true,
      },
    });

    const syncedStreak = await syncUserStreakProfile(userId);
    const friendsCount = new Set(freshUser?.friendlist || []).size;

    res.json({
      user: {
        ...freshUser,
        streak: syncedStreak.currentStreak,
        maxStreak: syncedStreak.maxStreak,
        streakActivityDays: syncedStreak.activityDays,
        currentStreakDays: syncedStreak.currentStreakDays,
        bestStreakDays: syncedStreak.bestStreakDays,
      },
      rating: freshUser?.rating ?? 0,
      friendsCount,
      currentStreak: syncedStreak.currentStreak,
      maxStreak: syncedStreak.maxStreak,
      currentStreakDays: syncedStreak.currentStreakDays,
      bestStreakDays: syncedStreak.bestStreakDays,
      activityDays: syncedStreak.activityDays,
      gamesPlayed: syncedStreak.activityDays.length,
    });
  } catch (error) {
    console.error("Error fetching rating summary:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard summary",
      message: error.message,
    });
  }
});

/**
 * Get streak calendar data for a month
 * GET /api/rating/streak-calendar?monthOffset=0
 */
router.get("/streak-calendar", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const monthOffset = Number.parseInt(req.query.monthOffset, 10) || 0;
    const syncedStreak = await syncUserStreakProfile(userId);
    const activeDayStarts = syncedStreak.activityDays;

    const base = new Date();
    const displayDate = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + monthOffset, 1));
    const displayYear = displayDate.getUTCFullYear();
    const displayMonth = displayDate.getUTCMonth();

    const activeDays = activeDayStarts
      .map((start) => new Date(start))
      .filter((d) => d.getUTCFullYear() === displayYear && d.getUTCMonth() === displayMonth)
      .map((d) => d.getUTCDate())
      .sort((a, b) => a - b);

    res.json({
      monthOffset,
      year: displayYear,
      month: displayMonth,
      activeDays,
      currentStreak: syncedStreak.currentStreak,
      maxStreak: syncedStreak.maxStreak,
      currentStreakDays: syncedStreak.currentStreakDays,
      bestStreakDays: syncedStreak.bestStreakDays,
      activityDays: syncedStreak.activityDays,
    });
  } catch (error) {
    console.error("Error fetching streak calendar:", error);
    res.status(500).json({
      error: "Failed to fetch streak calendar",
      message: error.message,
    });
  }
});

/**
 * Get user's overall and per-game statistics
 * GET /api/rating/stats
 */
router.get("/stats", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await getUserGameStats(userId);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({
      error: "Failed to fetch user statistics",
      message: error.message,
    });
  }
});

/**
 * Get user's game-specific statistics
 * GET /api/rating/stats/:gameType
 */
router.get("/stats/:gameType", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameType } = req.params;

    const gameRating = await prisma.userGameRating.findUnique({
      where: {
        userId_gameType: {
          userId,
          gameType,
        },
      },
    });

    if (!gameRating) {
      return res.status(404).json({
        error: "Game rating not found",
        message: `User has not played ${gameType}`,
      });
    }

    res.json(gameRating);
  } catch (error) {
    console.error("Error fetching game stats:", error);
    res.status(500).json({
      error: "Failed to fetch game statistics",
      message: error.message,
    });
  }
});

/**
 * Get leaderboard for a specific game
 * GET /api/rating/leaderboard/:gameType?limit=50
 */
router.get("/leaderboard/:gameType", async (req, res) => {
  try {
    const { gameType } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const leaderboard = await prisma.userGameRating.findMany({
      where: { gameType },
      orderBy: { rating: "desc" },
      take: limit,
      select: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        rating: true,
        wins: true,
        losses: true,
        totalGames: true,
        bestScore: true,
      },
    });

    res.json({
      gameType,
      count: leaderboard.length,
      leaderboard,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      error: "Failed to fetch leaderboard",
      message: error.message,
    });
  }
});

/**
 * Get user's leaderboard position for a game
 * GET /api/rating/leaderboard/:gameType/position
 */
router.get("/leaderboard/:gameType/position", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameType } = req.params;

    const position = await getUserGameLeaderboardPosition(userId, gameType);

    if (!position) {
      return res.status(404).json({
        error: "User not on leaderboard",
        message: `User has not played ${gameType}`,
      });
    }

    res.json(position);
  } catch (error) {
    console.error("Error fetching leaderboard position:", error);
    res.status(500).json({
      error: "Failed to fetch leaderboard position",
      message: error.message,
    });
  }
});

/**
 * Get leaderboard for a specific game
 * GET /api/rating/leaderboard/:gameType?limit=50
 */
router.get("/config", async (req, res) => {
  try {
    const configs = await prisma.gameConfig.findMany();
    res.json(configs);
  } catch (error) {
    console.error("Error fetching game configs:", error);
    res.status(500).json({
      error: "Failed to fetch game configurations",
      message: error.message,
    });
  }
});

/**
 * Update game weightages (admin only)
 * PATCH /api/rating/config/weightages
 * Body: { gameType: weightage, ... }
 */
router.patch("/config/weightages", isAuthenticated, async (req, res) => {
  try {
    // Check if user is admin (you might want to add proper admin middleware)
    // For now, this is a placeholder

    const weightages = req.body;

    // Validate weightages
    for (const [gameType, weightage] of Object.entries(weightages)) {
      if (typeof weightage !== "number" || weightage < 0) {
        return res.status(400).json({
          error: "Invalid weightage",
          message: `Weightage for ${gameType} must be a positive number`,
        });
      }
    }

    await updateGameWeightages(weightages);

    res.json({
      message: "Game weightages updated successfully",
      weightages,
    });
  } catch (error) {
    console.error("Error updating weightages:", error);
    res.status(500).json({
      error: "Failed to update weightages",
      message: error.message,
    });
  }
});

/**
 * Get game results history
 * GET /api/rating/history?limit=20&gameType=puzzle15
 */
router.get("/history", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const { gameType } = req.query;

    const where = {
      OR: [{ winnerId: userId }, { loserId: userId }],
    };

    if (gameType) {
      where.gameType = gameType;
    }

    const history = await prisma.gameResult.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        winner: {
          select: { id: true, name: true },
        },
        loser: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({
      userId,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("Error fetching game history:", error);
    res.status(500).json({
      error: "Failed to fetch game history",
      message: error.message,
    });
  }
});

export default router;
