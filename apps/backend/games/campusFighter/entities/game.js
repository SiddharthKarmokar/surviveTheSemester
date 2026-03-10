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