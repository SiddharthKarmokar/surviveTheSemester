import { Schema, defineTypes } from "@colyseus/schema";

export class Game extends Schema {

  constructor(attributes) {
    super();

    this.state = "lobby";
    this.roomName = attributes.roomName;
    this.mapName = attributes.mapName;
    this.maxPlayers = attributes.maxPlayers;
    this.mode = attributes.mode;

    this.onWaitingStart = attributes.onWaitingStart;
    this.onLobbyStart = attributes.onLobbyStart;
    this.onGameStart = attributes.onGameStart;
    this.onGameEnd = attributes.onGameEnd;
  }
  update(players) {
    const now = Date.now();
    
    if(this.state === "lobby") {
      if(this.lobbyEndsAt && now >= this.lobbyEndsAt){
        this.state = "game";

        if(this.onGameStart)this.onGameStart();
      }
    }else if(this.state === "game") {
      if(this.gameEndsAt && now >= this.gameEndsAt){
        this.state = "end";

        if(this.onGameEnd) this.onGameEnd({
          type: "timeout",
          from: "server",
          ts: now,
          params: { reason: "time_up" }
        })
      }
    }

  }
}

defineTypes(Game, {
  state: "string",
  roomName: "string",
  mapName: "string",
  lobbyEndsAt: "number",
  gameEndsAt: "number",
  maxPlayers: "number",
  mode: "string"
});