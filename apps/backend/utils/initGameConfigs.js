/**
 * Initialize Game Configurations
 * Run this script once to set up game configs with default weightages
 * Usage: node utils/initGameConfigs.js
 */

import { prisma } from "../prisma/prisma.js";

const GAME_CONFIGS = [
  {
    gameType: "puzzle15",
    displayName: "15 Puzzle",
    weightage: 1.0,
    difficultyLevel: "medium",
    metadata: {
      description: "Classic 15-puzzle sliding game",
      minPlayers: 2,
      maxPlayers: 2,
    },
  },
  {
    gameType: "canon",
    displayName: "Canon",
    weightage: 1.0,
    difficultyLevel: "medium",
    metadata: {
      description: "Cannon shooting game with physics",
      minPlayers: 2,
      maxPlayers: 2,
    },
  },
  {
    gameType: "binarySudoku",
    displayName: "Binary Sudoku",
    weightage: 1.0,
    difficultyLevel: "medium",
    metadata: {
      description: "Binary Sudoku puzzle game",
      minPlayers: 2,
      maxPlayers: 2,
    },
  },
  {
    gameType: "mathtug",
    displayName: "Math Tug",
    weightage: 1.0,
    difficultyLevel: "medium",
    metadata: {
      description: "Mathematics problem solving game",
      minPlayers: 2,
      maxPlayers: 2,
    },
  },
  {
    gameType: "campusFighter",
    displayName: "Campus Fighter",
    weightage: 1.0,
    difficultyLevel: "medium",
    metadata: {
      description: "Fighting game on campus",
      minPlayers: 2,
      maxPlayers: 2,
    },
  },
];

async function initializeGameConfigs() {
  try {
    console.log("🎮 Initializing game configurations...");

    for (const config of GAME_CONFIGS) {
      const existing = await prisma.gameConfig.findUnique({
        where: { gameType: config.gameType },
      });

      if (existing) {
        console.log(`  ✓ ${config.displayName} already exists, skipping...`);
        continue;
      }

      await prisma.gameConfig.create({
        data: config,
      });

      console.log(
        `  ✓ Created ${config.displayName} with weightage ${config.weightage}`
      );
    }

    console.log("\n✅ Game configurations initialized successfully!");
    console.log("\nConfigured games:");
    GAME_CONFIGS.forEach((config) => {
      console.log(`  - ${config.displayName} (${config.gameType}): ${config.weightage}x`);
    });
  } catch (error) {
    console.error("❌ Error initializing game configs:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeGameConfigs();
}

export { initializeGameConfigs };
