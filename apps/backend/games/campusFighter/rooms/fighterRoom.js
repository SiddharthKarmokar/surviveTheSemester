import { Room } from "@colyseus/core"
import { GameState } from "../state/FighterState.js";
import { gameConstants, Maths } from "../src/index.js";

export class fighterGameRoom extends Room {
    onCreate(options) {
        try {
            console.log("fighterGameRoom created:", options);
            this.maxClients = Maths.clamp(
                options.roomMaxPlayers || 0,
                gameConstants.ROOM_PLAYERS_MIN,
                gameConstants.ROOM_PLAYERS_MAX
            );

            const playerName = options.playerName.slice(0, gameConstants.PLAYER_NAME_MAX);
            const roomName = options.roomName.slice(0, gameConstants.ROOM_NAME_MAX);

            this.setMetadata({
                playerName,
                roomName,
                roomMap: options.roomMap,
                roomMaxPlayers: this.maxClients,
                mode: options.mode,
            });

            // Init State
            this.state = new GameState(
                    roomName,
                    options.roomMap,
                    this.maxClients,
                    options.mode,
                    this.handleMessage
            );

            this.setSimulationInterval(() => this.handleTick());

            console.log(
                `${new Date().toISOString()} [Create] player=${playerName} room=${roomName} map=${options.roomMap} max=${this.maxClients} mode=${options.mode}`
            );

            // Listen to messages from clients
            this.onMessage('*', (client, type, message) => {

                const playerId = client.sessionId;

                switch (type) {
                    case 'move':
                    case 'rotate':
                    case 'shoot':
                        this.state.playerPushAction({
                            playerId,
                            ...message,
                        });
                        break;

                    default:
                        break;
                }
            });
        } catch(err){
            console.error("ROOM CREATION ERROR:", err);
            throw err;
        }
    }

    onJoin(client, options) {

        this.state.playerAdd(client.sessionId, options.playerName);
        console.log(
            `${new Date().toISOString()} [Join] id=${client.sessionId} player=${options.playerName}`
        );
    }

    onLeave(client) {

        this.state.playerRemove(client.sessionId);
        console.log(
            `${new Date().toISOString()} [Leave] id=${client.sessionId}`
        );
    }

    handleTick = () => {
        this.state.update();
    };

    handleMessage = (message) => {
        this.broadcast(message.type, message);
    };
}