import { UIController } from "./ui.js";
import { MultiplayerClient } from "./multiplayer.js";
import { CannonDuelGame } from "./game.js";

const ui = new UIController();
const multiplayer = new MultiplayerClient();
const canvas = document.getElementById("gameCanvas");
const game = new CannonDuelGame(canvas, ui, multiplayer);

function backToMenu() {
  game.exitToMenu();
}

ui.bind({
  showHowTo: () => ui.showScreen("howTo"),
  showDifficulty: () => ui.showScreen("difficulty"),
  showFriend: () => ui.showScreen("friend"),
  backToMenu,
  startBot: () => {
    game.localSide = "left";
    game.start("bot", {
      difficulty: ui.getDifficulty(),
      targetScore: ui.getBotTargetScore(),
      theme: ui.getBotTheme()
    });
  },
  createRoom: async () => {
    const result = await multiplayer.createRoom(ui.getFriendTargetScore(), ui.getFriendTheme());
    if (!result.ok) {
      ui.setRoomStatus(result.message || "Unable to create room.");
      return;
    }
    game.roomId = result.roomId;
    game.localSide = result.side;
    game.targetScore = result.state.targetScore;
    game.setTheme(result.state.theme);
    ui.setFriendTargetScore(result.state.targetScore);
    ui.setFriendTheme(result.state.theme);
    ui.setRoomStatus(`Room ${result.roomId} created. Theme is ${result.state.theme}. Press Ready.`, true);
  },
  joinRoom: async () => {
    const roomId = ui.getRoomCode();
    if (!roomId) {
      ui.setRoomStatus("Enter a room code first.");
      return;
    }
    const result = await multiplayer.joinRoom(roomId);
    if (!result.ok) {
      ui.setRoomStatus(result.message || "Could not join room.");
      return;
    }
    game.roomId = result.roomId;
    game.localSide = result.side;
    game.targetScore = result.state.targetScore;
    game.setTheme(result.state.theme);
    ui.setFriendTargetScore(result.state.targetScore);
    ui.setFriendTheme(result.state.theme);
    ui.setRoomStatus(`Joined room ${result.roomId}. Theme is ${result.state.theme}. Press Ready.`, true);
  },
  readyUp: () => {
    if (!game.roomId) {
      ui.setRoomStatus("Create or join a room first.");
      return;
    }
    multiplayer.readyUp();
    game.start("online", {
      targetScore: game.targetScore || ui.getFriendTargetScore(),
      theme: ui.getFriendTheme()
    });
    ui.setRoomStatus(`Room ${game.roomId} ready. Waiting for the other player if needed.`, true);
  },
  exitGame: backToMenu
});

ui.showHud(false);
ui.showScreen("menu");
requestAnimationFrame(game.loop);
