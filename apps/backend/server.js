import "dotenv/config.js";
import express from "express";
import registerAllRoutes from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.js"; 
import cookieParser from "cookie-parser";
import compression from "compression";
import { createServer }  from "http";
import registerGameServer from "./games/index.js";
import { join } from "path";

const PUBLIC_DIR = join(__dirname, "./public");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression())


registerAllRoutes(app);
app.use(express.static(PUBLIC_DIR));

const httpServer = createServer(app);
const gameServer = registerGameServer(app, httpServer);

app.get("*", (req, res)=>{
  res.sendFile(join(PUBLIC_DIR, "index.html"));
})

app.use(errorMiddleware);

const PORT = 3000;

httpServer.listen(PORT, ()=>{
  console.log(`Server running on ${PORT}`);
  console.log(`WebSocket running on ${PORT}`);
});

gameServer.onShutdown(() => {
  console.log("Game server shutting down.");
});