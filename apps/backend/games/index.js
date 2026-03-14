import { Server } from "@colyseus/core";
import { monitor } from "@colyseus/monitor";
import { fighterGameRoom } from "./campusFighter/rooms/fighterRoom.js";
import { Puzzle15Room } from "./puzzle15/puzzle15Room.js";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { CanonRoom } from './canon/CanonRoom.js';
import { MathTugRoom } from './mathtug/MathTugRoom.js';
import { BinarySudokuRoom } from './binarysudoku/BinarySudokuRoom.js';

export default function registerGameServer(app, httpServer) {

  const gameServer = new Server({
    transport: new WebSocketTransport({
      server: httpServer,
      pingInterval: 5000, 
      pingMaxRetries: 3, 
    })
  });
  gameServer.define("campusFighter", fighterGameRoom);
  gameServer.define("fighterGameRoom", fighterGameRoom); // fallback
  gameServer.define("puzzle15", Puzzle15Room);
  gameServer.define("canonGameRoom", CanonRoom);
  gameServer.define("mathTugRoom", MathTugRoom);
  gameServer.define("binarySudokuRoom", BinarySudokuRoom);
  app.use("/colyseus", monitor(gameServer));
  
  return gameServer;

}