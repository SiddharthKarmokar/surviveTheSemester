import * as Colyseus from 'colyseus.js';

const GAME_SERVER = import.meta.env.VITE_GAME_SERVER_URL || 'ws://localhost:3000';
const BACKEND_URL = GAME_SERVER.replace(/^ws/, 'http');

async function requestSeatReservation(method, roomNameOrId, payload) {
  const response = await fetch(`${BACKEND_URL}/matchmake/${method}/${roomNameOrId}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 
      'Accept': 'application/json',
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify(payload)
  });
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

  // Normalize 0.16/0.17 reservation shape differences.
  if (data && !data.room && data.roomId) {
    data.room = {
      name: data.name || 'canon',
      roomId: data.roomId,
      processId: data.processId,
      publicAddress: data.publicAddress,
      createdAt: data.createdAt,
    };
  }

  if (!data?.room?.name) {
    data.room = {
      ...(data?.room || {}),
      name: 'canon',
      roomId: data?.room?.roomId || data?.roomId,
      processId: data?.room?.processId || data?.processId,
      publicAddress: data?.room?.publicAddress || data?.publicAddress,
      createdAt: data?.room?.createdAt || data?.createdAt,
    };
  }
  return data;
}

export class MultiplayerClient {
  constructor() {
    this.client = new Colyseus.Client(GAME_SERVER);
    this.room = null;
    this.handlers = {};
  }

  async connectRoom(options, joinAs) {
    try {
      let reservation;
      if (joinAs === "create") {
         reservation = await requestSeatReservation('create', 'canon', options);
      } else {
         reservation = await requestSeatReservation('joinById', options.roomId, options);
      }
      this.room = await this.client.consumeSeatReservation(reservation);
      this.bindRoomEvents();
      const roomId = this.room.id || reservation.roomId || reservation.room?.roomId;
      return { ok: true, room: this.room, roomId };
    } catch (e) {
      console.error(e);
      return { ok: false, error: e.message };
    }
  }

  bindRoomEvents() {
    this.room.onMessage("*", (type, message) => {
        if (this.handlers[type]) {
             this.handlers[type].forEach(h => h(message));
        }
    });
    this.room.onLeave(() => {
        if (this.handlers["opponent-left"]) {
            this.handlers["opponent-left"].forEach(h => h());
        }
    });
  }

  async createRoom(targetScore, theme) {
    const r = await this.connectRoom({ targetScore, theme }, "create");
    if (!r.ok) return { ok: false, message: r.error };
    return { ok: true, roomId: r.roomId, side: "left", state: {} };
  }

  async joinRoom(roomId) {
    const r = await this.connectRoom({ roomId }, "join");
    if (!r.ok) return { ok: false, message: r.error || "Room not found or full." };
    return { ok: true, roomId: r.roomId, side: "right", state: {} };
  }

  readyUp() {
    if (this.room) this.room.send("player-ready");
  }

  sendAction(payload) {
    if (this.room) this.room.send("player-action", payload);
  }

  sendShot(payload) {
    if (this.room) this.room.send("player-shot", payload);
  }

  sendScoreUpdate(payload) {
    if (this.room) this.room.send("score-update", payload);
  }

  sendRoundReset() {
    if (this.room) this.room.send("round-reset");
  }

  on(event, handler) {
    if (!this.handlers[event]) {
        this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }
}
