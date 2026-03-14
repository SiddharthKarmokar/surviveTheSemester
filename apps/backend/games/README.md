# Adding a New Game — Developer Guide

This folder holds every multiplayer game on the platform.  
Each game is a self-contained sub-folder. Follow the steps below so your game
integrates cleanly with the shared infrastructure.

---

## Folder Convention

```
apps/backend/games/
  campusFighter/          ← existing shooter game
  puzzle15/               ← 15-puzzle race game
  <yourGame>/             ← your new game goes here
    <yourGame>Room.js     ← Colyseus Room (REQUIRED)
    schema/
      <YourGame>State.js  ← Colyseus Schema (REQUIRED)
    README.md             ← describe your game's messages / state (recommended)
```

---

## Step 1 — Create the Colyseus Room

Create `apps/backend/games/<yourGame>/<yourGame>Room.js`:

```js
import { Room } from "@colyseus/core";
import { YourGameState } from "./schema/YourGameState.js";

export class YourGameRoom extends Room {
  onCreate(options) {
    this.maxClients = 2;            // change as needed
    this.setState(new YourGameState());
    this.setMetadata({ creatorName: options.playerName || "Player" });

    this.onMessage("someAction", (client, message) => {
      // handle client message
    });
  }

  onJoin(client, options) { /* add player to state */ }
  onLeave(client, consented) { /* clean up / award win */ }
}
```

### Schema Pattern

Use `@colyseus/schema` with the `defineTypes` helper (plain JS, no TypeScript decorators):

```js
import { Schema, MapSchema, ArraySchema, defineTypes } from "@colyseus/schema";

class YourPlayer extends Schema {
  constructor() {
    super();
    this.name   = "";
    this.score  = 0;
    this.done   = false;
  }
}
defineTypes(YourPlayer, { name: "string", score: "number", done: "boolean" });

class YourGameState extends Schema {
  constructor() {
    super();
    this.phase   = "waiting";    // waiting | countdown | game | ended
    this.players = new MapSchema();
    this.winner  = "";
    this.winnerName = "";
  }
}
defineTypes(YourGameState, {
  phase: "string",
  players: { map: YourPlayer },
  winner: "string",
  winnerName: "string",
});
export { YourGameState, YourPlayer };
```

---

## Step 2 — Register the Room

Open `apps/backend/games/index.js` and add your room:

```js
import { YourGameRoom } from "./<yourGame>/<yourGame>Room.js";

// inside registerGameServer():
gameServer.define("<yourGame>", YourGameRoom);
```

---

## Step 3 — Add a Frontend Page

Create `apps/Frontend/src/pages/Games/<YourGame>/<YourGame>Page.jsx`.

Connect to the room:

```js
import { Client } from "colyseus.js";

const BACKEND_URL = import.meta.env.VITE_TWO_PLAYER_GAME_URL || "http://localhost:3000";
const WS_URL      = BACKEND_URL.replace(/^http/, "ws");
const client      = new Client(WS_URL);

// Create a room (first player)
const room = await client.create("<yourGame>", { playerName });

// Join a specific room by invite link (?roomId=...)
const room = await client.joinById(roomId, { playerName });

// List rooms waiting for a second player
const rooms = await client.getAvailableRooms("<yourGame>");
```

### Standard Message Types (recommended — use these so the lobby HUD works)

| Direction | Type | Payload |
|-----------|------|---------|
| server→client | `playerJoined` | `{ name, count }` |
| server→client | `playerLeft` | `{ name }` |
| server→client | `countdown` | `{ endsAt }` (epoch ms) |
| server→client | `gameStart` | `{}` |
| server→client | `ended` | `{ winner, winnerName, reason }` |
| client→server | anything | your game-specific messages |

---

## Step 4 — Wire Up the Dashboard

1. **Add a game card** in `apps/Frontend/src/components/GameCardGrid/GameCardGrid.jsx`:

```js
{ id: 4, title: "Your Game", animationData: yourAnim, gameId: "yourGame" },
```

2. **Handle the click** in `apps/Frontend/src/pages/Dashboard/Dashboard.jsx`:

```js
if (gameId === "yourGame") {
  window.location.href = "/your-game";
}
```

3. **Add the route** in `apps/Frontend/src/App.jsx`:

```js
if (currentPath.startsWith("/your-game")) {
  return <YourGamePage />;
}
```

---

## Choosing the Right Approach

| Game type | Recommended |
|-----------|-------------|
| Real-time race / cooperation (like 15 Puzzle) | Colyseus Room |
| Turn-based (chess, tic-tac-toe) | Colyseus Room |
| Single-player / local only | Plain React page, no Colyseus |
| Live shared data (leaderboards, drawing) | Colyseus or Socket.IO |

---

## Development Tips

- Run the backend: `cd apps/backend && npm run dev`
- Run the frontend: `cd apps/Frontend && npm run dev`
- Colyseus monitor (see all rooms live): `http://localhost:3000/colyseus`
- The WS transport + HTTP share port 3000, so one server covers both
