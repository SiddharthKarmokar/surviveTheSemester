import { describeWind } from "./wind.js";

export class UIController {
  constructor() {
    this.el = {
      hud: document.getElementById("hud"),
      menu: document.getElementById("menuScreen"),
      howTo: document.getElementById("howToScreen"),
      difficulty: document.getElementById("difficultyScreen"),
      friend: document.getElementById("friendScreen"),
      overlay: document.getElementById("overlayScreen"),
      overlayTitle: document.getElementById("overlayTitle"),
      overlayBody: document.getElementById("overlayBody"),
      overlayBtn: document.getElementById("overlayBtn"),
      scoreLeft: document.getElementById("scoreLeft"),
      scoreRight: document.getElementById("scoreRight"),
      target: document.getElementById("targetScore"),
      wind: document.getElementById("windIndicator"),
      roomStatus: document.getElementById("roomStatus"),
      readyBtn: document.getElementById("readyBtn"),
      roomCodeInput: document.getElementById("roomCodeInput"),
      difficultySlider: document.getElementById("difficultySlider"),
      difficultyLabel: document.getElementById("difficultyLabel"),
      botTargetSelect: document.getElementById("botTargetSelect"),
      friendTargetSelect: document.getElementById("friendTargetSelect"),
      botThemeSelect: document.getElementById("botThemeSelect"),
      friendThemeSelect: document.getElementById("friendThemeSelect")
    };
  }

  bind(actionMap) {
    document.getElementById("howToBtn").onclick = actionMap.showHowTo;
    document.getElementById("playBotBtn").onclick = actionMap.showDifficulty;
    document.getElementById("playFriendBtn").onclick = actionMap.showFriend;
    document.querySelectorAll("[data-back-menu]").forEach((button) => {
      button.onclick = actionMap.backToMenu;
    });
    document.getElementById("startBotBtn").onclick = actionMap.startBot;
    document.getElementById("createRoomBtn").onclick = actionMap.createRoom;
    document.getElementById("joinRoomBtn").onclick = actionMap.joinRoom;
    document.getElementById("readyBtn").onclick = actionMap.readyUp;
    document.getElementById("exitBtn").onclick = actionMap.exitGame;
    this.el.overlayBtn.onclick = actionMap.backToMenu;
    this.el.difficultySlider.oninput = () => {
      const labels = ["Easy", "Normal", "Hard"];
      this.el.difficultyLabel.textContent = labels[Number(this.el.difficultySlider.value)];
    };
  }

  showScreen(name) {
    for (const screen of [this.el.menu, this.el.howTo, this.el.difficulty, this.el.friend, this.el.overlay]) {
      screen.classList.add("hidden");
    }
    if (name && this.el[name]) {
      this.el[name].classList.remove("hidden");
    }
  }

  showHud(show) {
    this.el.hud.classList.toggle("hidden", !show);
  }

  setScores(left, right, target, labels = { left: "Player", right: "Opponent" }) {
    this.el.scoreLeft.textContent = `${labels.left}: ${left}`;
    this.el.scoreRight.textContent = `${labels.right}: ${right}`;
    this.el.target.textContent = `Target: ${target}`;
  }

  setPower(_value) {}

  setTurn(_text) {}

  setWind(wind) {
    this.el.wind.textContent = describeWind(wind);
  }

  setRoomStatus(text, showReady = false) {
    this.el.roomStatus.textContent = text;
    this.el.readyBtn.classList.toggle("hidden", !showReady);
  }

  getRoomCode() {
    return this.el.roomCodeInput.value.trim().toUpperCase();
  }

  getDifficulty() {
    return ["easy", "normal", "hard"][Number(this.el.difficultySlider.value)];
  }

  getBotTargetScore() {
    return Number(this.el.botTargetSelect.value);
  }

  getFriendTargetScore() {
    return Number(this.el.friendTargetSelect.value);
  }

  setFriendTargetScore(value) {
    this.el.friendTargetSelect.value = String(value);
  }

  getBotTheme() {
    return this.el.botThemeSelect.value;
  }

  getFriendTheme() {
    return this.el.friendThemeSelect.value;
  }

  setFriendTheme(value) {
    this.el.friendThemeSelect.value = value;
  }

  showOverlay(title, body) {
    this.el.overlayTitle.textContent = title;
    this.el.overlayBody.textContent = body;
    this.showScreen("overlay");
  }
}
