import { io } from "socket.io-client";

const socket = io("https://localhost:3000");

socket.on("connect", () => {
    console.log(`you connect with id: ${socket.id}`);
})


socket.emit("custom-event", 10, 'Hi', {a: 'a'});