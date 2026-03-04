import authRoutes from "../auth/route.js";

export default function registerAllRoutes(app) {
  app.use("/auth", authRoutes);
}