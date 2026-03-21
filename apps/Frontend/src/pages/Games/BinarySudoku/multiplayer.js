import * as Colyseus from 'colyseus.js';

const BACKEND_URL = import.meta.env.VITE_GAME_SERVER_URL || 'http://localhost:3000';
const GAME_SERVER = BACKEND_URL.replace(/^http/, 'ws');

async function requestSeatReservation(method, roomIdOrName, payload, config = {}) {
  const url = `${BACKEND_URL}/matchmake/${method}/${roomIdOrName}`;
  const timeoutMs = config.timeoutMs ?? 12000;
  const MAX_ATTEMPTS = config.maxAttempts ?? 3;
  let response;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      break;
    } catch (error) {
      clearTimeout(timeoutId);
      const isTimeout = error?.name === 'AbortError';
      const isNetwork = error instanceof TypeError;
      const shouldRetry = attempt < MAX_ATTEMPTS && (isTimeout || isNetwork);

      if (shouldRetry) {
        await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
        continue;
      }

      if (isTimeout) {
        throw new Error('Matchmake request timed out. Backend is not responding.');
      }

      throw new Error('Unable to reach game server. Check backend and VITE_GAME_SERVER_URL.');
    }
  }

  if (!response) {
    throw new Error('Unable to reach game server. Check backend and VITE_GAME_SERVER_URL.');
  }
  
  if (!response.ok) {
    let errText = `Status: ${response.status}`;
    try {
      const errJson = await response.json();
      errText = errJson.error || errText;
    } catch {
      errText = response.statusText;
    }
    throw new Error(`Matchmake request failed: ${errText}`);
  }
  const data = await response.json();

  if (data && !data.room && data.roomId) {
    data.room = {
      name: data.name || 'binarySudoku',
      roomId: data.roomId,
      processId: data.processId,
      publicAddress: data.publicAddress,
      createdAt: data.createdAt,
    };
  }

  if (!data?.room?.name) {
    data.room = {
      ...(data?.room || {}),
      name: 'binarySudoku',
      roomId: data?.room?.roomId || data?.roomId,
      processId: data?.room?.processId || data?.processId,
      publicAddress: data?.room?.publicAddress || data?.publicAddress,
      createdAt: data?.room?.createdAt || data?.createdAt,
    };
  }
  return data;
}

export class BinarySudokuMultiplayer {
  constructor() {
    this.client = new Colyseus.Client(GAME_SERVER);
    this.room = null;
    this.handlers = {};
    this.clientId = this.getOrCreateClientId();
    this.joinInFlight = null;
  }

  getOrCreateClientId() {
    // Use per-tab id so shared-link joins in another tab don't collide.
    const key = 'binarySudokuClientId';
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  }

  on(event, handler) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
  }

  trigger(event, payload) {
    if (this.handlers[event]) {
      this.handlers[event].forEach(h => h(payload));
    }
  }

  async consumeWithTimeout(reservation, timeoutMs) {
    // Use a "settled" flag so that if our timeout fires first yet the WebSocket
    // later connects anyway (ghost connection), we immediately leave that room
    // instead of leaving it open on the server and blocking future joins.
    let settled = false;

    return new Promise((resolve, reject) => {
      const tid = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('Room connection timed out. Please retry.'));
        }
      }, timeoutMs);

      this.client.consumeSeatReservation(reservation)
        .then(room => {
          clearTimeout(tid);
          if (settled) {
            // Timeout already fired — ghost connection arrived late; close it.
            try { room.leave(); } catch { /* no-op */ }
            return;
          }
          settled = true;
          resolve(room);
        })
        .catch(err => {
          clearTimeout(tid);
          if (!settled) {
            settled = true;
            reject(err);
          }
        });
    });
  }

  async connectRoom(options, joinAs) {
    try {
      if (this.room) {
        this.room.leave();
        this.room = null;
      }

      const reservation = joinAs === "create"
        ? await requestSeatReservation('create', 'binarySudoku', options, {
            timeoutMs: 12000,
            maxAttempts: 3,
          })
        : await requestSeatReservation('joinById', options.roomId, options, {
            timeoutMs: 12000,
            maxAttempts: 3,
          });

      this.room = await this.consumeWithTimeout(
        reservation,
        joinAs === "create" ? 15000 : 20000,
      );

      this.bindRoomEvents();
      return { ok: true, room: this.room, roomId: this.room?.roomId || this.room?.id };
    } catch (e) {
      console.error(e);
      return { ok: false, error: e.message };
    }
  }

  bindRoomEvents() {
    this.room.onStateChange((state) => {
      this.trigger("state-change", state);
    });

    this.room.onMessage("opponent-board-update", ({ sessionId, boardData }) => {
      this.trigger("opponent-board-update", { sessionId, boardData });
    });

    this.room.onMessage("player-finished", ({ sessionId, message }) => {
      this.trigger("player-finished", { sessionId, message });
    });

    this.room.onMessage("game-over", () => {
      this.trigger("game-over");
    });

    this.room.onMessage("opponent-left", ({ name }) => {
      this.trigger("opponent-left", { name });
    });
    
    this.room.onLeave(() => {
      this.trigger("opponent-left", { name: "Opponent" });
    });
  }

  async createRoom(playerName, size, difficulty) {
    const r = await this.connectRoom({ playerName, size, difficulty, clientId: this.clientId }, "create");
    if (!r.ok) return { ok: false, message: r.error };
    return { ok: true, roomId: r.roomId };
  }

  async joinRoom(roomId, playerName) {
    if (this.joinInFlight) {
      return this.joinInFlight;
    }

    this.joinInFlight = this.performJoinRoom(roomId, playerName);
    try {
      return await this.joinInFlight;
    } finally {
      this.joinInFlight = null;
    }
  }

  async performJoinRoom(roomId, playerName) {
    const MAX_JOIN_ATTEMPTS = 5;
    for (let attempt = 1; attempt <= MAX_JOIN_ATTEMPTS; attempt++) {
      const r = await this.connectRoom({ roomId, playerName, clientId: this.clientId }, "join");
      if (r.ok) return { ok: true, roomId: r.roomId };

      const message = String(r.error || "").toLowerCase();
      const locked = message.includes('is locked') || message.includes('is_locked');
      const timeout = message.includes('timed out') || message.includes('not responding') || message.includes('unable to reach');
      const transient = locked || timeout;

      if (transient && attempt < MAX_JOIN_ATTEMPTS) {
        // On a "locked" error a seat reservation is still pending on the server
        // (seatReservationTime = 5 s).  Wait at least 7 s so the reservation
        // expires before we retry, otherwise every retry also gets "locked".
        const delay = locked ? 7000 : 800 * attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (locked) {
        return { ok: false, message: "Room is temporarily locked while another seat is being reserved. Please retry in a moment." };
      }

      if (timeout) {
        return { ok: false, message: "Could not reach room host yet. Please retry in a few seconds." };
      }

      return { ok: false, message: r.error || "Room not found or full." };
    }

    return { ok: false, message: "Room is temporarily locked. Please retry." };
  }

  sendBoardSolved() {
    if (this.room) {
      this.room.send("board-solved");
    }
  }

  sendBoardUpdate(boardData) {
    if (this.room) {
      this.room.send("opponent-board-update", { boardData });
    }
  }

  leave() {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
  }

  clearHandlers() {
    this.handlers = {};
  }

  get sessionId() {
     return this.room ? this.room.sessionId : null;
  }
}
