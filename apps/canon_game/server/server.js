const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { registerSocketHandlers } = require("./socketHandlers");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "..", "client")));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "index.html"));
});

registerSocketHandlers(io);

server.listen(port, () => {
  console.log(`Cannon Duel server running on http://localhost:${port}`);
});
