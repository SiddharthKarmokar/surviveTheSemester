# 🎮 Game Rating & Scoring System - Backend

## 📚 Documentation Map

Start here based on your needs:

- **🚀 Just Want to Set It Up?**  
  → Read `RATING_SYSTEM_QUICKSTART.md`

- **✅ Step-by-Step Setup & Troubleshooting?**  
  → Read `../SETUP_AND_VERIFICATION.md`

- **📖 Complete Reference Documentation?**  
  → Read `RATING_SYSTEM_DOCS.md` 

- **🎨 See What Was Built?**  
  → Read `../RATING_SYSTEM_IMPLEMENTATION.md`

- **📊 Full Technical Details?**  
  → Read `../RATING_SYSTEM_COMPLETE.md`

---

## TL;DR - Quick Start

```bash
# 1. Run migration
npx prisma migrate dev --name add_rating_system

# 2. Initialize game configs
node utils/initGameConfigs.js

# 3. Done! Play a game and ratings update automatically
```

---

## ✨ What This System Does

When a game ends:

1. **Score is calculated** (different formula per game)
2. **ELO rating is computed** (standard algorithm with bonuses)
3. **Overall rating is updated** (weighted average of all games)
4. **Results are broadcast** (real-time via Colyseus)
5. **Leaderboards are generated** (via API)

---

## 🗂️ Main Components

### Services (`/services`)
- **`eloRatingService.js`** - ELO algorithm & calculations
- **`ratingUpdateService.js`** - Main orchestration & database updates
- **`scoring/`** - Game-specific score calculators (6 games)

### Routes (`/routes`)
- **`ratingRoutes.js`** - API endpoints for stats, leaderboards, etc.

### Database (`/prisma`)
- **3 new models**: GameResult, UserGameRating, GameConfig

### Games (`/games/puzzle15`)
- **Modified**: puzzle15Room.js - Integrated rating updates

---

## 🎯 Key Features

✅ **Modular** - Each game has its own calculator  
✅ **Fair** - Standard ELO with performance bonuses  
✅ **Flexible** - Adjustable weightages anytime  
✅ **Real-Time** - Broadcast via Colyseus  
✅ **Comprehensive** - Full stats & leaderboards  
✅ **Extensible** - Add new games in minutes  
✅ **Well-Documented** - 2000+ lines of code & docs  

---

## 📊 Scoring by Game

| Game | Score Formula | Key Metric |
|------|---------------|-----------|
| Puzzle15 | Base - Penalties + Bonuses | Moves & Time |
| Canon | Base + Efficiency - Penalty | Shots |
| Binary Sudoku | Base - Penalties + Bonus | Moves |
| Math Tug | Base + Answers × 10 | Correct Answers |
| Campus Fighter | Base + Health + Combos + Time | Health/Combos |

---

## 🔗 API Examples

### Get Your Stats
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/rating/stats
```

### View Leaderboard
```bash
curl http://localhost:3000/api/rating/leaderboard/puzzle15?limit=10
```

### Your Position
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/rating/leaderboard/puzzle15/position
```

---

## 📝 File Structure

```
backend/
├── services/
│   ├── eloRatingService.js          ⭐ ELO algorithm
│   ├── ratingUpdateService.js       ⭐ Main events
│   └── scoring/
│       ├── BaseScoreCalculator.js
│       ├── Puzzle15ScoreCalculator.js
│       ├── CanonScoreCalculator.js
│       ├── BinarySudokuScoreCalculator.js
│       ├── MathTugScoreCalculator.js
│       ├── CampusFighterScoreCalculator.js
│       └── ScorerRegistry.js
├── routes/
│   ├── ratingRoutes.js              ⭐ API endpoints
│   └── index.js                     (modified)
├── games/puzzle15/
│   └── puzzle15Room.js              (modified)
├── prisma/
│   └── schema.prisma                (modified)
├── utils/
│   └── initGameConfigs.js           ⭐ Setup
├── RATING_SYSTEM_QUICKSTART.md      📖 Quick start
└── RATING_SYSTEM_DOCS.md            📖 Full docs
```

---

## 🚀 Setup Required

### 1. Database Migration
```bash
npx prisma migrate dev --name add_rating_system
```

### 2. Initialize Configs
```bash
node utils/initGameConfigs.js
```

### 3. Verify
```bash
curl http://localhost:3000/api/rating/config
# Should return 5 games configured
```

---

## 🔄 How It Works (Flow)

```
Game Starts
    ↓
[Store user IDs & time]
    ↓
Players Make Moves
    ↓
[Track metadata: moves, time, etc]
    ↓
Game Ends
    ↓
[Call _processGameEnd()]
    ↓
[Calculate winner score]
    ↓
[Calculate loser score]
    ↓
[Get performance multiplier]
    ↓
[Calculate ELO changes]
    ↓
[Update database]
    ↓
[Recalculate overall rating]
    ↓
[Broadcast to players]
    ↓
Ratings Update in Real-Time ✅
```

---

## 🎮 Add a New Game in 4 Steps

1. **Create score calculator**
   ```javascript
   // services/scoring/MyGameScoreCalculator.js
   export class MyGameScoreCalculator extends BaseScoreCalculator {
     calculateWinnerScore(winner, loser, metadata = {}) { return 100; }
     calculateLoserScore(winner, loser, metadata = {}) { return 30; }
   }
   ```

2. **Register it**
   ```javascript
   // services/scoring/ScorerRegistry.js
   ["myGame", new MyGameScoreCalculator()]
   ```

3. **Hook into game room**
   ```javascript
   // In your game room:
   this._processGameEnd(winnerId, loserId, metadata);
   ```

4. **Add config**
   ```javascript
   // utils/initGameConfigs.js - Add entry and re-run
   ```

---

## 📈 Real-Time Broadcast

Server broadcasts when game ends:
```javascript
{
  winner: {
    name: "Player A",
    previousRating: 1250,
    newRating: 1269,
    ratingChange: 19,
    score: 99
  },
  loser: { ... }
}
```

Client receives:
```javascript
room.onMessage("ratingUpdate", (msg) => {
  updateUI(msg.winner.newRating);
  showAnimation(msg.winner.ratingChange);
});
```

---

## 🔧 Customization

### Change Puzzle15 Formula
Edit `services/scoring/Puzzle15ScoreCalculator.js`

### Adjust Weightages
```bash
PATCH /api/rating/config/weightages
```

### Modify ELO K-Factor
Edit `services/eloRatingService.js`

---

## ⚠️ Troubleshooting

### "Table GameResult not found"
→ Run migration: `npx prisma migrate dev`

### "No score calculator found"
→ Run init: `node utils/initGameConfigs.js`

### Ratings not updating
→ Check console logs & verify `_processGameEnd()` is called

See `../SETUP_AND_VERIFICATION.md` for more.

---

## 📚 Learn More

| Document | Purpose |
|----------|---------|
| `RATING_SYSTEM_QUICKSTART.md` | Get running in 5 minutes |
| `RATING_SYSTEM_DOCS.md` | Complete reference (2000+ lines) |
| `../RATING_SYSTEM_IMPLEMENTATION.md` | Implementation details |
| `../RATING_SYSTEM_COMPLETE.md` | Architecture & examples |
| `../SETUP_AND_VERIFICATION.md` | Setup & troubleshooting |

---

## 🎯 Available Endpoints

```
GET  /api/rating/stats                          - User stats
GET  /api/rating/stats/:gameType                - Per-game stats
GET  /api/rating/leaderboard/:gameType          - Game leaderboard
GET  /api/rating/leaderboard                    - Overall leaderboard
GET  /api/rating/leaderboard/:gameType/position - Your position
GET  /api/rating/history                        - Your game history
GET  /api/rating/config                         - Game configs
PATCH /api/rating/config/weightages             - Update weights
```

All require `Authorization: Bearer TOKEN` except leaderboards.

---

## 📊 Database Schema

### GameResult
Records every completed game with scores & rating changes.

### UserGameRating  
Per-game rating + statistics for each player.

### GameConfig
Configuration for games (weights, difficulty, enabled status).

---

## ✅ What's Ready

- ✅ ELO Rating System
- ✅ Score Calculators (5 games)
- ✅ Database Models
- ✅ API Endpoints
- ✅ Real-Time Broadcasting
- ✅ Full Documentation
- ✅ Setup Script

---

## 🎁 Bonus Features

- 📈 Performance multipliers
- 🏆 Leaderboards (global & per-game)
- 📜 Full game history
- ⚙️ Configurable weightages
- 📊 Comprehensive statistics
- 🔄 Auto-recalculation

---

## 🚀 Next: Frontend Integration

Once backend is working, frontend should:

1. Display rating changes in game UI
2. Show leaderboards
3. Display user profile stats
4. Show badges/tiers (optional)

See frontend files for integration examples.

---

## 📞 Support

Everything is documented. Check:
1. Inline code comments
2. Documentation files
3. Troubleshooting section
4. Example code in services

---

**Built with ❤️ for competitive fairness**
