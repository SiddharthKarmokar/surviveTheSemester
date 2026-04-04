# Rating & Scoring System Documentation

## Overview

This is a modular, extensible rating and scoring system built with ELO-based rating mechanics. It supports multiple games with different scoring strategies and combines them into an overall user rating using weighted averages.

## Architecture

### Core Components

1. **ELO Rating System** (`services/eloRatingService.js`)
   - Implements standard ELO algorithm
   - Calculates expected scores and rating changes
   - Adjusts K-factor based on player rating (higher rated = lower K-factor)
   - Supports performance-based bonuses

2. **Score Calculators** (`services/scoring/`)
   - Base class: `BaseScoreCalculator.js`
   - Game-specific implementations:
     - `Puzzle15ScoreCalculator.js` - Based on moves and time
     - `CanonScoreCalculator.js` - Based on shots and efficiency
     - `BinarySudokuScoreCalculator.js` - Based on moves and difficulty
     - `MathTugScoreCalculator.js` - Based on correct answers
     - `CampusFighterScoreCalculator.js` - Based on health and combos
   - Registry: `ScorerRegistry.js` - Central management

3. **Rating Update Service** (`services/ratingUpdateService.js`)
   - Orchestrates the entire rating process
   - Manages database transactions
   - Calculates overall ratings using weighted averages
   - Provides leaderboard and statistics queries

4. **Game Hooks** (`games/puzzle15/puzzle15Room.js`)
   - Captures game-end events
   - Calls rating update service
   - Broadcasts results to clients

## Data Model

### Database Collections

#### `GameResult`
Records every completed game with scores and rating changes.

```javascript
{
  gameType: String,           // e.g., 'puzzle15'
  winnerId: String,           // User ID
  loserId: String,            // User ID
  winnerScore: Int,           // Points earned by winner
  loserScore: Int,            // Points earned by loser
  windScore: Int,             // Rating change for winner
  loserRating: Int,           // Rating change for loser
  metadata: Json,             // Game-specific data {moves, time, etc}
  createdAt: DateTime
}
```

#### `UserGameRating`
Per-game rating for each user.

```javascript
{
  userId: String,
  gameType: String,           // e.g., 'puzzle15'
  rating: Int,                // ELO rating (default 1200)
  wins: Int,                  // Number of victories
  losses: Int,                // Number of defeats
  totalGames: Int,            // Total games played
  bestScore: Int,             // Personal best score
  updatedAt: DateTime
}
```

#### `GameConfig`
Configuration for each game type (weightage, difficulty, etc).

```javascript
{
  gameType: String @unique,
  displayName: String,
  weightage: Float,           // Weightage in overall rating (default 1.0)
  enabled: Boolean,
  difficultyLevel: String,    // 'easy', 'medium', 'hard'
  metadata: Json,
  createdAt: DateTime
}
```

#### `users`
Updated to include rating relationships.

```javascript
{
  // ... existing fields ...
  rating: Int,                // Overall weighted rating
  gameWins: GameResult[],     // Games user won
  gameLosses: GameResult[],   // Games user lost
  gameRatings: UserGameRating[] // Per-game ratings
}
```

## How It Works

### Step-by-Step Flow

1. **Game Starts**
   - Two players join a room
   - Server stores their user IDs and session IDs
   - Tracks game start time

2. **Game Ends**
   - Room broadcasts "ended" event with winner
   - Calls `_processGameEnd()` with game metadata (moves, time, etc)

3. **Score Calculation**
   - Gets the score calculator for that game type
   - Calculates winner score: `BaseScore - Penalties + Bonuses`
   - Calculates loser score: Usually participation score
   - Gets performance multiplier based on efficiency

4. **Rating Calculation**
   - Retrieves current ratings from database
   - Calculates ELO rating changes using expected scores
   - Applies performance multiplier to winner's rating change
   - Updates game-specific ratings in database

5. **Overall Rating Update**
   - Fetches all user's game ratings
   - Gets game weightages from GameConfig
   - Calculates weighted average: `∑(gameRating × weightage) / ∑weightage`
   - Updates user's overall rating

6. **Broadcasting**
   - Server broadcasts rating update to clients
   - Includes new ratings, rating changes, and scores

## ELO Algorithm

### Formula

```
Expected Score = 1 / (1 + 10^((opponent_rating - player_rating) / 400))

Rating Change = K factor × (Actual Score - Expected Score)

New Rating = Current Rating + Rating Change
```

### K Factors

- Players below 1200: K = 48 (steeper rating changes)
- Players 1200-2400: K = 32 (standard)
- Players above 2400: K = 16 (slower rating changes, stabilized)

### Performance Bonus

Applied to winner's rating change based on efficiency:
- Excellent (near-optimal): 1.5x multiplier
- Very Good: 1.2x multiplier
- Average: 1.0x multiplier
- Below Average: 0.8x multiplier

## API Endpoints

### Rating Statistics

**Get User Overall & Per-Game Stats**
```
GET /api/rating/stats
Authorization: Bearer <token>

Response:
{
  overallRating: 1250,
  gameStats: [
    {
      gameType: "puzzle15",
      rating: 1300,
      wins: 5,
      losses: 2,
      totalGames: 7,
      bestScore: 95
    }
  ],
  totalGames: 20,
  totalWins: 14
}
```

**Get Game-Specific Stats**
```
GET /api/rating/stats/:gameType
Authorization: Bearer <token>
```

### Leaderboards

**Get Game Leaderboard**
```
GET /api/rating/leaderboard/:gameType?limit=50

Response:
{
  gameType: "puzzle15",
  count: 50,
  leaderboard: [
    {
      user: { id, name, avatar },
      rating: 1450,
      wins: 25,
      losses: 3,
      totalGames: 28,
      bestScore: 125
    }
  ]
}
```

**Get Overall Leaderboard**
```
GET /api/rating/leaderboard?limit=50
```

**Get User's Position**
```
GET /api/rating/leaderboard/:gameType/position
Authorization: Bearer <token>

Response:
{
  position: 5,
  rating: 1350,
  gameType: "puzzle15"
}
```

### Game History

**Get User's Game History**
```
GET /api/rating/history?limit=20&gameType=puzzle15
Authorization: Bearer <token>

Response:
{
  userId: "user123",
  count: 20,
  history: [
    {
      id: "result123",
      gameType: "puzzle15",
      winnerId: "winner123",
      loserId: "loser123",
      winner: { id, name },
      loser: { id, name },
      winnerScore: 95,
      loserScore: 20,
      windScore: 18,
      loserRating: -18,
      metadata: { moves: 45, timeTaken: 60000 },
      createdAt: "2024-01-01T12:00:00Z"
    }
  ]
}
```

### Configuration

**Get Game Configurations**
```
GET /api/rating/config

Response:
[
  {
    gameType: "puzzle15",
    displayName: "15 Puzzle",
    weightage: 1.0,
    enabled: true,
    difficultyLevel: "medium"
  }
]
```

**Update Weightages** (Admin)
```
PATCH /api/rating/config/weightages
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "puzzle15": 1.5,
  "canon": 1.0,
  "binarySudoku": 0.8
}

Response:
{
  message: "Game weightages updated successfully",
  weightages: { ... }
}
```

## Adding a New Game

### 1. Create Score Calculator

```javascript
// services/scoring/MyGameScoreCalculator.js

import BaseScoreCalculator from "../BaseScoreCalculator.js";

export class MyGameScoreCalculator extends BaseScoreCalculator {
  constructor() {
    super("myGame");
  }

  calculateWinnerScore(winner, loser, gameMetadata = {}) {
    // Your scoring logic
    return 100;
  }

  calculateLoserScore(winner, loser, gameMetadata = {}) {
    return 50; // Participation score
  }

  getPerformanceMultiplier(winner, loser, gameMetadata = {}) {
    // Adjust rating change multiplier based on performance
    return 1.0;
  }
}
```

### 2. Register Calculator

```javascript
// services/scoring/ScorerRegistry.js

import MyGameScoreCalculator from "./MyGameScoreCalculator.js";

const SCORE_CALCULATORS = new Map([
  // ... existing calculators ...
  ["myGame", new MyGameScoreCalculator()],
]);
```

### 3. Add Game-End Hook

```javascript
// In your game room (extends Room or GameRoom):

async handleGameEnd(winnerId, loserId, metadata) {
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

Run or update `utils/initGameConfigs.js`:

```javascript
{
  gameType: "myGame",
  displayName: "My Game",
  weightage: 1.0,
  difficultyLevel: "medium",
  metadata: { ... },
}
```

## Customization

### Adjusting Weightages

Update game configs via:
```bash
PATCH /api/rating/config/weightages
```

Or in database:
```javascript
GameConfig.update(
  { gameType: "puzzle15" },
  { weightage: 1.5 }
)
```

Overall rating will automatically recalculate for all users.

### Modifying Scoring Formulas

Edit the score calculator for that game:

```javascript
calculateWinnerScore(winner, loser, gameMetadata = {}) {
  const { moves } = gameMetadata;
  // Your custom formula
  let score = BASE_SCORE - (moves * 2) + BONUS;
  return Math.max(10, Math.round(score));
}
```

### Changing ELO Parameters

Edit `services/eloRatingService.js`:

```javascript
const DEFAULT_K_FACTOR = 32;          // Change here
const K_FACTOR_HIGH_RATING = 16;      // Or here
const K_FACTOR_LOW_RATING = 48;       // Or here
```

## Real-Time Updates

### Colyseus Broadcasting

When game ends, server broadcasts:

```javascript
this.broadcast("ratingUpdate", {
  winner: {
    sessionId: "...",
    name: "...",
    previousRating: 1250,
    newRating: 1268,
    ratingChange: 18,
    score: 95,
    wins: 6,
    totalGames: 8,
    bestScore: 100,
  },
  loser: { ... },
  gameResult: { ... }
});
```

### Client-Side Handling

```javascript
room.onMessage("ratingUpdate", (message) => {
  // Update UI with new ratings
  updateUserRating(message.winner.newRating);
  showRatingChangeAnimation(message.winner.ratingChange);
});
```

## Initialization

### First Time Setup

1. **Create Prisma Migration**
   ```bash
   npx prisma migrate dev --name add_rating_system
   ```

2. **Initialize Game Configs**
   ```bash
   node apps/backend/utils/initGameConfigs.js
   ```

3. **Verify Setup**
   ```bash
   # Check database collections
   db.GameConfig.find()
   db.GameResult.find()
   db.UserGameRating.find()
   ```

## Monitoring & Debugging

### Check User Ratings

```javascript
const stats = await getUserGameStats("userId");
console.log(stats);
```

### View Game History

```javascript
const history = await prisma.gameResult.findMany({
  where: { winnerId: "userId" },
  orderBy: { createdAt: "desc" },
  take: 10
});
```

### Verify Weightages

```javascript
const configs = await prisma.gameConfig.findMany();
configs.forEach(c => console.log(`${c.gameType}: ${c.weightage}x`));
```

## Performance Considerations

1. **Caching**: Consider caching leaderboards with Redis
2. **Batch Updates**: Rate limit concurrent rating updates
3. **Index optimization**: Ensure indexes on UserGameRating(gameType, rating)
4. **Query Optimization**: Use select() to fetch only needed fields

## Future Enhancements

- [ ] Seasonal rating resets
- [ ] Rating decay for inactive players
- [ ] Decay system for older games
- [ ] Skill divisions/tiers
- [ ] Win streaks tracking
- [ ] Head-to-head records
- [ ] Custom rating formula per game
- [ ] Provisional rating period for new players

---

For questions or issues, refer to the code comments or create an issue.
