import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import  { Server } from "socket.io";
import * as http from "http"
import cors from "cors"
const passport = require('passport');

const app = express();
const port = 3000;
const corsOptions = {
    origin: ['http://localhost:3000'],
    credentials: true,
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan("tiny"));
app.use(cors(corsOptions))
app.use(passport.initialize());
app.use(passport.session());

const server = http.createServer(app);
const io = new Server(server);

io.on("connection", socket =>{
    console.log(socket.id);
})

server.listen(port);