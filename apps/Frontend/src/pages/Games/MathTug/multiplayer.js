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
    this.awaitingFirstQuestion = true;
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
    this.awaitingFirstQuestion = true;

    this.room.onStateChange((state) => {
      this.trigger("state-change", state);

      if (state?.phase === 'playing' && this.awaitingFirstQuestion) {
        this.room.send('sync-question', {});
      }
    });

    this.room.onMessage("room-state", ({ side }) => {
      this.trigger("connected", { side });

      if (this.awaitingFirstQuestion) {
        this.room.send('sync-question', {});
      }
    });

    this.room.onMessage("pull-anim", ({ side, flagPos }) => {
      this.trigger("pull-anim", { side, flagPos });
    });

    this.room.onMessage("question-update", (payload) => {
      console.log(`[${new Date().toISOString()}] Client received question-update: done=${payload.done}, index=${payload.currentIndex}/${payload.totalQuestions}`);
      this.awaitingFirstQuestion = false;
      this.trigger("question-update", payload);
    });

    this.room.onMessage("answer-feedback", (payload) => {
      this.trigger("answer-feedback", payload);
    });

    this.room.onMessage("game-over", (payload) => {
      console.log(`[${new Date().toISOString()}] Client received game-over: ${payload.winnerName}`);
      this.trigger("game-over", payload);
    });

    this.room.onMessage("opponent-left", () => {
      this.trigger("opponent-left");
    });
    
    this.room.onLeave(() => {
      this.trigger("opponent-left");
    });
  }

  async createRoom(playerName, userId) {
    const r = await this.connectRoom({ playerName, userId }, "create");
    if (!r.ok) return { ok: false, message: r.error };
    return { ok: true, roomId: r.roomId };
  }

  async joinRoom(roomId, playerName, userId) {
    const r = await this.connectRoom({ roomId, playerName, userId }, "join");
    if (!r.ok) return { ok: false, message: r.error || "Room not found or full." };
    return { ok: true, roomId: r.roomId };
  }

  submitAnswer(val) {
    if (this.room) {
      this.room.send("submit-answer", { val });
    }
  }

  leave() {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
    this.awaitingFirstQuestion = true;
  }

  clearHandlers() {
    this.handlers = {};
  }

  get sessionId() {
    return this.room ? this.room.sessionId : null;
  }
}
