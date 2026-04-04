import express from "express";
import { authRoutes } from "../auth/route.js";
import userRoutes from "./userRoutes.js";
import connectionRoutes from "./connectionRoutes.js";
import ratingRoutes from "./ratingRoutes.js";
import {connectRedis} from "../redis/index.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import { SWAGGER_UI_OPTIONS } from "../utils/index.js"

const healthRouter = express.Router();
const specs = swaggerJSDoc(SWAGGER_UI_OPTIONS);

healthRouter.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "auth-service",
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

export default function registerAllRoutes(app) {
  connectRedis();
  // if(process.env.NODE_ENV !== "production")
  app.use("/docs", swaggerUI.serve, swaggerUI.setup(specs));
  
  console.log("🔗 Registering routes...");
  app.use("/healthz", healthRouter)
  console.log("  ✅ /healthz");
  
  app.use("/auth", authRoutes);
  console.log("  ✅ /auth");
  
  app.use("/api/users", userRoutes);
  console.log("  ✅ /api/users");
  
  app.use("/api/connections", connectionRoutes);
  console.log("  ✅ /api/connections");
  
  app.use("/api/rating", ratingRoutes);
  console.log("  ✅ /api/rating");
  console.log("🎯 All routes registered successfully!");
}