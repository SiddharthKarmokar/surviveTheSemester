import "dotenv/config.js";
import express from "express";
import registerAllRoutes from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.js"; 
import cookieParser from "cookie-parser";
import compression from "compression";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression())


registerAllRoutes(app);

app.use(errorMiddleware);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});