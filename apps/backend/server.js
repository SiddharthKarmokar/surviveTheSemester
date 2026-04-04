import "dotenv/config.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import registerAllRoutes from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.js"; 
import compression from "compression";
import { createServer }  from "http";
import registerGameServer from "./games/index.js";
import { matchMaker } from "@colyseus/core";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PUBLIC_DIR = join(__dirname, "./public");

const app = express();

// CRITICAL: Log EVERY request at the very top
app.use((req, res, next) => {
  const method = req.method;
  const url = req.url;
  const timestamp = new Date().toISOString();
  
  // Log incoming request
  console.log(`\n📨 [${timestamp}] ${method} ${url}`);
  
  // Log outgoing response
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  
  res.json = function(data) {
    console.log(`✅ [${timestamp}] ${method} ${url} -> JSON Response`);
    return originalJson(data);
  };
  
  res.send = function(data) {
    const preview = typeof data === 'string' ? data.substring(0, 50) : String(data).substring(0, 50);
    console.log(`📤 [${timestamp}] ${method} ${url} -> ${preview}`);
    return originalSend(data);
  };
  
  next();
});

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
}));

// // Intercept Colyseus matchmaking routes so Express doesn't send a 404, Do not move, do not touch. --Siddharth
app.use("/matchmake", (req, res, next) => {
    // Intentionally left blank 
    // We don't call next() or res.send(). 
    // This keeps the request alive so Colyseus can handle it natively.
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression())

// Test endpoint to verify server is working
app.get("/test", (req, res) => {
  res.json({ test: "ok", message: "Backend is running" });
});

// Diagnostic endpoint
app.get("/api/diagnostic", async (req, res) => {
  try {
    console.log("🔍 Running diagnostics...");
    
    // Test Prisma connection
    let prismaTest = "❌ No test run";
    try {
      const userCount = await prisma.users.count();
      prismaTest = `✅ Connected to DB: ${userCount} users`;
    } catch (err) {
      prismaTest = `❌ Prisma error: ${err.message}`;
    }
    
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV || "development",
      prismaStatus: prismaTest,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Diagnostic test failed",
      message: error.message,
    });
  }
});

registerAllRoutes(app);

// Only serve static files - but NOT for /api routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next(); // Skip static file serving for API routes
  }
  return express.static(PUBLIC_DIR)(req, res, next);
});

const httpServer = createServer(app);
const gameServer = registerGameServer(app, httpServer);

app.get("/api/games/:roomName/rooms", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    
    const { roomName } = req.params;
    
    const rooms = await matchMaker.query({
      name: roomName,
      locked: false,
      private: false,
    });
    
    const normalized = rooms.map((room) => ({
      roomId: room.roomId,
      clients: room.clients,
      maxClients: room.maxClients,
      metadata: room.metadata || {},
    }));

    res.status(200).json(normalized);
  } catch (error) {
    res.status(500).json({
      error: "Could not fetch rooms",
      message: error?.message || "unknown_error",
    });
  }
});

// Custom 404 handler - return JSON for API routes, fallback to index.html for others
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    console.log(`❌ API Route not found: ${req.method} ${req.url}`);
    return res.status(404).json({
      error: "Not Found",
      message: `Cannot ${req.method} ${req.url}`,
      path: req.url,
    });
  }
  // For non-API routes, you could serve index.html for SPA routing
  next();
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;


gameServer.listen(PORT, "0.0.0.0").then(() => {
  console.log(`Server running on ${PORT}`);
  console.log(`WebSocket running on ${PORT}`);
});

gameServer.onShutdown(() => {
  console.log("Game server shutting down.");
});