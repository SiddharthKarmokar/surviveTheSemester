import express from "express";
import { authRoutes } from "../auth/route.js";
import userRoutes from "./userRoutes.js";
import connectionRoutes from "./connectionRoutes.js";
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
  app.use("/healthz", healthRouter)
  app.use("/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/connections", connectionRoutes);
}