import { authRoutes } from "../auth/route.js";
import {connectRedis} from "../redis/index.js";

export default function registerAllRoutes(app) {
  connectRedis();
  app.use("/auth", authRoutes);
}