const { randomUUID } = require("crypto");

const DEFAULT_TARGET_SCORE = 3;
const ALLOWED_TARGETS = new Set([3, 5, 10, 15, 20]);
const ALLOWED_THEMES = new Set(["space", "jungle", "desert"]);

function randomWind() {
  return Number(((Math.random() * 0.6) - 0.3).toFixed(3));
}

function normalizeTargetScore(value) {
  const parsed = Number(value);
  return ALLOWED_TARGETS.has(parsed) ? parsed : DEFAULT_TARGET_SCORE;
}

function normalizeTheme(value) {
  return ALLOWED_THEMES.has(value) ? value : "space";
}

function createRoomState(roomId, hostId, targetScore, theme) {
  return {
    id: roomId,
    hostId,
    players: [hostId],
    scores: { left: 0, right: 0 },
    ready: new Set(),
    wind: randomWind(),
    shotId: 0,
    targetScore: normalizeTargetScore(targetScore),
    theme: normalizeTheme(theme)
  };
}

function serializeRoom(room) {
  return {
    id: room.id,
    players: room.players,
    scores: room.scores,
    wind: room.wind,
    targetScore: room.targetScore,
    theme: room.theme
  };
}

function registerSocketHandlers(io) {
  const rooms = new Map();

  function emitRoomState(room) {
    io.to(room.id).emit("room-state", serializeRoom(room));
  }

  io.on("connection", (socket) => {
    socket.on("create-room", ({ targetScore, theme } = {}, cb) => {
      const roomId = randomUUID().slice(0, 6).toUpperCase();
      const room = createRoomState(roomId, socket.id, targetScore, theme);
      rooms.set(roomId, room);
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.side = "left";
      cb?.({ ok: true, roomId, side: "left", state: serializeRoom(room) });
      emitRoomState(room);
    });

    socket.on("join-room", ({ roomId }, cb) => {
      const room = rooms.get((roomId || "").toUpperCase());
      if (!room) {
        cb?.({ ok: false, message: "Room not found." });
        return;
      }
      if (room.players.length >= 2) {
        cb?.({ ok: false, message: "Room is full." });
        return;
      }
      room.players.push(socket.id);
      socket.join(room.id);
      socket.data.roomId = room.id;
      socket.data.side = "right";
      cb?.({ ok: true, roomId: room.id, side: "right", state: serializeRoom(room) });
      emitRoomState(room);
      io.to(room.id).emit("player-joined", { roomId: room.id });
    });

    socket.on("player-ready", () => {
      const room = rooms.get(socket.data.roomId);
      if (!room) {
        return;
      }
      room.ready.add(socket.id);
      io.to(room.id).emit("player-ready", { side: socket.data.side, readyCount: room.ready.size });
      if (room.ready.size === 2) {
        room.wind = randomWind();
        emitRoomState(room);
        io.to(room.id).emit("round-reset", { wind: room.wind, scores: room.scores, targetScore: room.targetScore, theme: room.theme });
      }
    });

    socket.on("player-shot", ({ angle, power }) => {
      const room = rooms.get(socket.data.roomId);
      if (!room) {
        return;
      }
      room.shotId += 1;
      io.to(room.id).emit("player-shot", {
        side: socket.data.side,
        angle,
        power,
        wind: room.wind,
        shotId: room.shotId
      });
    });

    socket.on("projectile-update", (payload) => {
      const room = rooms.get(socket.data.roomId);
      if (!room) {
        return;
      }
      socket.to(room.id).emit("projectile-update", payload);
    });

    socket.on("score-update", ({ scorer }) => {
      const room = rooms.get(socket.data.roomId);
      if (!room || (scorer !== "left" && scorer !== "right")) {
        return;
      }
      room.scores[scorer] += 1;
      const winner = room.scores[scorer] >= room.targetScore ? scorer : null;
      io.to(room.id).emit("score-update", {
        scores: room.scores,
        scorer,
        winner,
        targetScore: room.targetScore
      });
      if (winner) {
        io.to(room.id).emit("game-over", { winner, scores: room.scores, targetScore: room.targetScore });
      } else {
        room.wind = randomWind();
        io.to(room.id).emit("round-reset", { wind: room.wind, scores: room.scores, targetScore: room.targetScore, theme: room.theme });
      }
    });

    socket.on("round-reset", () => {
      const room = rooms.get(socket.data.roomId);
      if (!room) {
        return;
      }
      room.wind = randomWind();
      io.to(room.id).emit("round-reset", { wind: room.wind, scores: room.scores, targetScore: room.targetScore, theme: room.theme });
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      if (!roomId) {
        return;
      }
      const room = rooms.get(roomId);
      if (!room) {
        return;
      }
      room.players = room.players.filter((id) => id !== socket.id);
      room.ready.delete(socket.id);
      io.to(room.id).emit("opponent-left");
      if (room.players.length === 0) {
        rooms.delete(room.id);
      } else {
        emitRoomState(room);
      }
    });
  });
}

module.exports = { registerSocketHandlers };
