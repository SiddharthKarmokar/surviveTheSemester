import "dotenv/config.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import registerAllRoutes from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.js"; 
import compression from "compression";
import { createServer }  from "http";
import registerGameServer from "./games/index.js";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PUBLIC_DIR = join(__dirname, "./public");

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
}));

// // Intercept Colyseus matchmaking routes so Express doesn't send a 404, Do not move, do not touch. --Siddharth
// app.use("/matchmake", (req, res) => {
//     // Intentionally left blank 
//     // We don't call next() or res.send(). 
//     // This keeps the request alive so Colyseus can handle it natively.
// });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression())


registerAllRoutes(app);
app.use(express.static(PUBLIC_DIR));

const httpServer = createServer(app);
const gameServer = registerGameServer(app, httpServer);


app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith("/matchmake")) {
    return next();
  }
  res.sendFile(join(PUBLIC_DIR, "index.html"));
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

gameServer.listen(PORT).then(() => {
  console.log(`Server running on ${PORT}`);
  console.log(`WebSocket running on ${PORT}`);
});

gameServer.onShutdown(() => {
  console.log("Game server shutting down.");
});