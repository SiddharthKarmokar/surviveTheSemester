# Local Multiplayer Testing

## 1. Install dependencies

Run once from the repository root:

```powershell
npm install --prefix apps/backend
npm install --prefix apps/Frontend
npm install --prefix apps/twoFighter
```

## 2. Start services

Use three terminals:

Terminal 1 (backend + websocket):

```powershell
npm run dev:backend
```

Terminal 2 (twoFighter build watcher to backend public assets):

```powershell
npm run dev:twofighter
```

Terminal 3 (dashboard frontend):

```powershell
npm run dev:frontend
```

## 3. Open apps

- Dashboard app: http://localhost:5173/dashboard
- Full-page two-player game target: http://localhost:3000

When you click the `Two Player Arena (TOSIOS)` card in Dashboard, the browser navigates to the backend-hosted TOSIOS frontend in the same tab.

## 4. Verify in two browsers

1. Open browser A at http://localhost:3000 and create a room.
2. Copy the room URL from the in-game menu.
3. Open browser B (or incognito) with the room URL.
4. Move/shoot in both windows and confirm state sync.

## Notes

- Backend registers both room names: `campusFighter` and `game`.
- The twoFighter source still uses old import paths, so `apps/twoFighter/scripts/build.mjs` aliases `@tosios/common` to a local shim for this repository.
