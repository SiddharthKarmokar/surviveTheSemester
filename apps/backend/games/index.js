import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { fighterGameRoom } from "./campusFighter/rooms/fighterRoom.js";

export default function registerGameServer(app, httpServer) {

  const gameServer = new Server({
    server: httpServer
  });
  console.log("Registering room: campusFighter");
  gameServer.define("campusFighter", fighterGameRoom);
  app.use("/colyseus", monitor(gameServer));

  return gameServer;

}