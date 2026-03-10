import { GameAdapter } from "../../core/common/index";
import { FighterState } from "./state/FighterState"

export default class FighterAdapter extends GameAdapter {
    constructor() {
        super(),
        this.state = null;
    }

    init(options) {
        
        this.state = new FighterState(
            options.roomName,
            options.roomMap,
            options.roomMaxPlayers,
            options.mode
        );
    }

    onJoin(client){
        this.state.playerAdd(client.sessionId, options.playerName);
    };

    onLeave(client){
        this.state.playerRemove(client.sessionId);
    }

    onMessage(client, type, message){
        switch (type) {
            case "move":
            case "rotate":
            case "shoot":
            this.state.playerPushAction({
            playerId: client.sessionId,
            ...message
            });
            break;
        }
    }

    update() {
        this.state.update();
    }

    getState() {
        return this.state();
    }
}
