# Rating System - Quick Start Guide

## What Was Implemented

A complete, modular scoring and ELO rating system with the following features:

✅ **ELO Rating System** - Standard ELO-based competitive ratings  
✅ **Game-Specific Scoring** - Each game has its own scoring formula  
✅ **Weighted Overall Rating** - Combine game ratings with configurable weightages  
✅ **Real-Time Updates** - Ratings update immediately when games end  
✅ **Comprehensive API** - Get stats, leaderboards, and game history  
✅ **Modular Design** - Easy to add new games and scoring strategies  

## Setup Instructions

### 1. Run Prisma Migration

```bash
cd apps/backend
npx prisma migrate dev --name add_rating_system
```

### 2. Initialize Game Configurations

```bash
node utils/initGameConfigs.js
```

Expected output:
```
🎮 Initializing game configurations...
  ✓ Created 15 Puzzle with weightage 1.0
  ✓ Created Canon with weightage 1.0
  ✓ Created Binary Sudoku with weightage 1.0
  ✓ Created Math Tug with weightage 1.0
  ✓ Created Campus Fighter with weightage 1.0

✅ Game configurations initialized successfully!
```

## How It Works

### When a Game Ends

1. Game server captures the result (winner, moves, time, etc.)
2. Calls rating service: `processGameResult(gameType, winnerId, loserId, metadata)`
3. System calculates:
   - **Score**: Based game-specific formula (moves for puzzle15, shots for canon, etc.)
   - **ELO Change**: Using standard ELO algorithm
   - **Performance Bonus**: Adjustment for efficiency
   - **New Overall Rating**: Weighted average of all game ratings
4. Broadcasts update to both players in real-time

### Example: Puzzle15 Game

**Scoring Formula:**
```
Score = 100 - (excess_moves × 1) + time_bonus
```

- Maximum 50 moves without penalty
- 1 point lost per extra move
- Bonus for finishing quickly (< 60 seconds)
- Loser gets 20% of base score

**Performance Multiplier:**
- Excellent (≤40 moves): 1.5x rating multiplier
- Very Good (≤50 moves): 1.2x rating multiplier
- Average (≤75 moves): 1.0x rating multiplier
- Below Average (>75 moves): 0.8x rating multiplier

### Example: Canon Game

**Scoring Formula:**
```
Score = 100 + efficiency_bonus - time_penalty
```

- Bonus for using fewer shots
- Penalty based on time taken
- Loser gets 15% of base score

## Test the System

### 1. Check User Stats

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/rating/stats
```

Response:
```json
{
  "overallRating": 1250,
  "gameStats": [
    {
      "gameType": "puzzle15",
      "rating": 1300,
      "wins": 5,
      "losses": 2,
      "totalGames": 7,
      "bestScore": 95
    }
  ],
  "totalGames": 7,
  "totalWins": 5
}
```

### 2. View Leaderboard

```bash
curl http://localhost:3000/api/rating/leaderboard/puzzle15?limit=10
```

### 3. Check Your Position

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/rating/leaderboard/puzzle15/position
```

Response:
```json
{
  "position": 5,
  "rating": 1300,
  "gameType": "puzzle15"
}
```

## Customize Weightages

Want puzzle15 to count more toward overall rating?

```bash
curl -X PATCH http://localhost:3000/api/rating/config/weightages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "puzzle15": 1.5,
    "canon": 1.0,
    "binarySudoku": 0.8,
    "mathtug": 1.0,
    "campusFighter": 1.0
  }'
```

Overall rating will automatically recalculate for all players.

## Add a New Game

### 1. Create Score Calculator

```javascript
// services/scoring/MyGameScoreCalculator.js
import BaseScoreCalculator from "../BaseScoreCalculator.js";

export class MyGameScoreCalculator extends BaseScoreCalculator {
  constructor() {
    super("myGame");
  }

  calculateWinnerScore(winner, loser, metadata = {}) {
    return 100;
  }

  calculateLoserScore(winner, loser, metadata = {}) {
    return 30;
  }

  getPerformanceMultiplier(winner, loser, metadata = {}) {
    return 1.0;
  }
}
```

### 2. Register in Registry

```javascript
// services/scoring/ScorerRegistry.js
import MyGameScoreCalculator from "./MyGameScoreCalculator.js";

const SCORE_CALCULATORS = new Map([
  // ... existing ...
  ["myGame", new MyGameScoreCalculator()],
]);
```

### 3. Hook Into Game Room

```javascript
// In your game room when game ends:
import { processGameResult } from "../../services/ratingUpdateService.js";

async _processGameEnd(winnerId, loserId, metadata) {
  const result = await processGameResult({
    gameType: "myGame",
    winnerId,
    loserId,
    gameMetadata: metadata,
  });

  this.broadcast("ratingUpdate", {
    winner: { ...result.winner },
    loser: { ...result.loser },
  });
}
```

### 4. Add Game Config

Update `utils/initGameConfigs.js` and re-run it.

## File Structure

```
backend/
├── services/
│   ├── eloRatingService.js          # ELO calculations
│   ├── ratingUpdateService.js       # Main orchestration
│   └── scoring/
│       ├── BaseScoreCalculator.js   # Abstract base
│       ├── Puzzle15ScoreCalculator.js
│       ├── CanonScoreCalculator.js
│       ├── BinarySudokuScoreCalculator.js
│       ├── MathTugScoreCalculator.js
│       ├── CampusFighterScoreCalculator.js
│       └── ScorerRegistry.js        # Scorer management
├── routes/
│   └── ratingRoutes.js              # API endpoints
├── games/
│   ├── puzzle15/
│   │   └── puzzle15Room.js          # MODIFIED - Rating integration
│   ├── canon/
│   ├── binarySudoku/
│   ├── mathtug/
│   └── campusFighter/
├── utils/
│   └── initGameConfigs.js           # Setup script
├── prisma/
│   └── schema.prisma                # MODIFIED - New models
└── RATING_SYSTEM_DOCS.md           # Full documentation
```

## Database Models

### GameResult
Records of every game played with scores and rating changes.

### UserGameRating
Per-game rating for each player (like Blitz, Bullet ratings in chess).

### GameConfig
Configuration for games (weightage, difficulty, enabled status).

## Key Features

### 1. Fair Rating System
- Uses standard ELO algorithm
- Adjusts K-factor based on rating
- Performance bonuses for efficiency
- Prevents rating farming

### 2. Flexible Scoring
- Each game has its own scoring formula
- Can be customized per game
- Considers game-specific metrics (moves, time, efficiency)

### 3. Overall Rating
- Weighted average of all game ratings
- All games can have equal weight or custom weights
- Automatically recalculates

### 4. Real-Time Updates
- Ratings update immediately
- Broadcast to players via Colyseus
- No refresh needed

### 5. Rich APIs
- Leaderboards (global and per-game)
- User statistics
- Game history
- Configuration management

## Example: Puzzle15 Game Flow

1. **Game Starts**
   - Player A and Player B join room
   - Server stores their user IDs
   - Game starts after 3-second countdown

2. **Game Progresses**
   - Players make moves
   - Server validates moves
   - Tracks move count and time

3. **Game Ends (Player A wins in 45 moves)**
   - Game broadcasts: `ended` event
   - Room calls: `_processGameEnd('sessionA', 'sessionB', {moves: 45, timeTaken: 65000})`
   
4. **Rating Calculation**
   - Gets Puzzle15ScoreCalculator
   - Calculates winner score: 
     - Base: 100
     - Penalty: -(45-50) × 1 = 0 (no penalty)
     - Time bonus: (60000-65000) × 0.2 / 1000 ≈ -1 = 99 points
   - Calculates loser score: 99 × 0.2 = 20 points
   - Gets performance multiplier: 1.2x (very good)
   - Calculates ELO change:
     - Expected score (if ratings equal): 0.5
     - Rating change: 32 × (1.0 - 0.5) × 1.2 = ≈ 19.2 ≈ 19 points
   
5. **Database Updates**
   - Player A: rating +19, wins +1
   - Player B: rating -19, losses +1
   - Creates GameResult record
   - Recalculates overall ratings

6. **Broadcast**
   - Sends rating update to both players:
     ```json
     {
       "winner": {
         "name": "Player A",
         "previousRating": 1250,
         "newRating": 1269,
         "ratingChange": 19,
         "score": 99,
         "wins": 6,
         "totalGames": 14
       },
       "loser": { ... }
     }
     ```

## Troubleshooting

### Schema Migration Failed
```bash
# Reset Prisma (⚠️ Clears database)
npx prisma migrate reset
npx prisma migrate dev --name add_rating_system
```

### Game Configs Not Found
```bash
# Re-run initialization
node utils/initGameConfigs.js
```

### Rating Not Updating
- Check user IDs are passed to game room in options
- Verify game is calling `_processGameEnd()`
- Check console for errors
- Ensure Prisma is connected

## Next Steps

1. ✅ Integrate rating updates with frontend
2. ✅ Show rating changes in game UI
3. ✅ Create rating badges/tiers
4. ✅ Add seasonal rating resets
5. ✅ Implement skill divisions
6. ✅ Create rating decay for inactive players

---

**For detailed implementation details, see [RATING_SYSTEM_DOCS.md](./RATING_SYSTEM_DOCS.md)**
