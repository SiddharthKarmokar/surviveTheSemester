# Cannon Duel

A polished browser artillery game with smooth Canvas rendering, single-player bot duels, and Socket.IO multiplayer rooms.

## Features

- Single player vs bot with Easy, Normal, and Hard difficulty
- Online multiplayer with room create/join and synced shots
- Physics-driven projectile arcs with gravity and wind
- Oscillating cannon aim, charge-to-fire controls, recoil, trails, explosions, and camera shake
- Responsive HUD and menu flow built for desktop and mobile browsers
- Web Audio API sound effects for shoot, hit, and explosion feedback

## Run

```bash
npm install
node server.js
```

Then open [http://localhost:3000](http://localhost:3000).

## Project Structure

```text
client/
  index.html
  style.css
  main.js
  game.js
  physics.js
  cannon.js
  projectile.js
  bot.js
  wind.js
  particles.js
  ui.js
  multiplayer.js
server/
  server.js
  socketHandlers.js
server.js
package.json
```

## Notes

- In online mode, one player creates a room and shares the 6-character room code.
- Both players press Ready to start the duel.
- The game ends when either side reaches 3 points.
