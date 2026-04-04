import { Room } from "@colyseus/core";
import { GameState } from "../state/FighterState.js";
import { Constants, Maths } from "../src/index.js";
import { recordGameCompletionActivity } from "../../../services/ratingUpdateService.js";

export class fighterGameRoom extends Room {
    onCreate(options) {
        try {
            console.log("fighterGameRoom created:", options);
            this.playerSessions = new Map();
            this.completionRecorded = false;
            
            // 2. CHANGE gameConstants TO Constants
            this.maxClients = Maths.clamp(
                options.roomMaxPlayers || 0,
                Constants.ROOM_PLAYERS_MIN,
                Constants.ROOM_PLAYERS_MAX
            );

            const playerName = options.playerName.slice(0, Constants.PLAYER_NAME_MAX);
            const roomName = options.roomName.slice(0, Constants.ROOM_NAME_MAX);

            this.setMetadata({
                playerName,
                roomName,
                roomMap: options.roomMap,
                roomMaxPlayers: this.maxClients,
                mode: options.mode,
            });

            // Init State
            this.setState(new GameState(
                roomName,
                options.roomMap,
                this.maxClients,
                options.mode,
                this.handleMessage
            ));

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
        this.playerSessions.set(client.sessionId, {
            userId: options.userId || null,
            name: options.playerName || "Player",
        });
        this.broadcast("playersStatus", {
            count: this.state.players.size,
            maxCount: this.maxClients,
        });
        console.log(
            `${new Date().toISOString()} [Join] id=${client.sessionId} player=${options.playerName}`
        );
    }

    onLeave(client) {
        this.state.playerRemove(client.sessionId);
        this.playerSessions.delete(client.sessionId);
        this.broadcast("playersStatus", {
            count: this.state.players.size,
            maxCount: this.maxClients,
        });
        console.log(
            `${new Date().toISOString()} [Leave] id=${client.sessionId}`
        );
    }

    handleTick = () => {
        this.state.update();
    };

    handleMessage = (message) => {
        if (message?.type === "start") {
            this.completionRecorded = false;
        }

        if (message?.type === "won" && !this.completionRecorded) {
            this.completionRecorded = true;
            const userIds = [...new Set(
                Array.from(this.playerSessions.values())
                    .map((player) => player.userId)
                    .filter(Boolean)
            )];

            if (userIds.length > 0) {
                void recordGameCompletionActivity(userIds, new Date(message.ts || Date.now())).catch((error) => {
                    console.error("[CampusFighter] Failed to record streak activity:", error);
                });
            }
        }

        this.broadcast(message.type, message);
    };
}