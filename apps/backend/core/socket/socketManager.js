import http from "http";
import WebSocket from "ws";
import { Connection } from "./connection";
import { generateSocketId } from "../../utils/socket.helper";
import { Server } from "colyseus";

import { RedisPresence } from "@colyseus/redis-presence";
import { RedisDriver } from "@colyseus/redis-driver";


export class socketManager {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });

        this.connections = new Map();
        
        this.messageHandlers = [];

        this.init();
    }

    init() {
        this.wss.on("connection", (socket, req) => {
            this.handleConnection(socket, req);
        });
    }

    handleConnection(socket, req) {
        const id = generateSocketId();
        const connection = new Connection(id, socket);
        this.connections.set(id, connection);

        socket.on("message", (data) => {
            this.handleMessage(connection, data);
        });

        socket.on("close", () => {
            this.handleDisconnect(connection);
        });

        socket.on("error", (err) => {
            this.handleError(connection);
        });

        connection.send({
            type: "connected",
            id
        })
    }

    handleMessage(connection, raw) {
        let message;
        try {
            message = JSON.parse(raw);
        } catch(err){
            console.error(err);
            return;
        }

        for(const handler of this.messageHandlers){
            handler(connection, message);
        }
    }

    // handleDisconnect(connection) {
    //     if(!this.)
    // }

}