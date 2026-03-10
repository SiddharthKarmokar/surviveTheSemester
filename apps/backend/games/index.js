import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { fighterGameRoom } from "./campusFighter/rooms/fighterRoom";

export default function registerGameServer(app, httpServer) {

  const gameServer = new Server({
    server: httpServer
  });

  gameServer.define("campusFighter", fighterGameRoom);
  app.use("/colyseus", monitor(gameServer));

  return gameServer;

}