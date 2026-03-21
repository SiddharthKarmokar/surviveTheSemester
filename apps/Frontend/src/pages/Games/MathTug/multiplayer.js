import * as Colyseus from 'colyseus.js';

const BACKEND_URL = import.meta.env.VITE_GAME_SERVER_URL || 'http://localhost:3000';
const GAME_SERVER = BACKEND_URL.replace(/^http/, 'ws');

async function requestSeatReservation(method, roomIdOrName, payload) {
  const url = `${BACKEND_URL}/matchmake/${method}/${roomIdOrName}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
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

  if (data && !data.room && data.roomId) {
    data.room = {
      name: data.name || 'mathTug',
      roomId: data.roomId,
      processId: data.processId,
      publicAddress: data.publicAddress,
      createdAt: data.createdAt,
    };
  }

  if (!data?.room?.name) {
    data.room = {
      ...(data?.room || {}),
      name: 'mathTug',
      roomId: data?.room?.roomId || data?.roomId,
      processId: data?.room?.processId || data?.processId,
      publicAddress: data?.room?.publicAddress || data?.publicAddress,
      createdAt: data?.room?.createdAt || data?.createdAt,
    };
  }
  return data;
}

export class MathTugMultiplayer {
  constructor() {
    this.client = new Colyseus.Client(GAME_SERVER);
    this.room = null;
    this.handlers = {};
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

  async connectRoom(options, joinAs) {
    try {
      let reservation;
      if (joinAs === "create") {
         reservation = await requestSeatReservation('create', 'mathTug', options);
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
    this.room.onStateChange((state) => {
      this.trigger("state-change", state);
    });

    this.room.onMessage("room-state", ({ side }) => {
      this.trigger("connected", { side });
    });

    this.room.onMessage("pull-anim", ({ side, flagPos }) => {
      this.trigger("pull-anim", { side, flagPos });
    });

    this.room.onMessage("game-over", ({ winner }) => {
      this.trigger("game-over", { winner });
    });

    this.room.onMessage("opponent-left", () => {
      this.trigger("opponent-left");
    });
    
    this.room.onLeave(() => {
      this.trigger("opponent-left");
    });
  }

  async createRoom(playerName) {
    const r = await this.connectRoom({ playerName }, "create");
    if (!r.ok) return { ok: false, message: r.error };
    return { ok: true, roomId: r.roomId };
  }

  async joinRoom(roomId, playerName) {
    const r = await this.connectRoom({ roomId, playerName }, "join");
    if (!r.ok) return { ok: false, message: r.error || "Room not found or full." };
    return { ok: true, roomId: r.roomId };
  }

  submitAnswer(side, val) {
    if (this.room) {
      this.room.send("submit-answer", { side, val });
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
