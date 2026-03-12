import { Server } from "@colyseus/core";
import { monitor } from "@colyseus/monitor";
import { fighterGameRoom } from "./campusFighter/rooms/fighterRoom.js";
import { WebSocketTransport } from "@colyseus/ws-transport";

export default function registerGameServer(app, httpServer) {

  const gameServer = new Server({
    transport: new WebSocketTransport({
      server: httpServer
    })
  });
  gameServer.define("campusFighter", fighterGameRoom);
  app.use("/colyseus", monitor(gameServer));
  
  return gameServer;

}