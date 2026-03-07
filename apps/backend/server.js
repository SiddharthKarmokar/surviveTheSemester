import "dotenv/config.js";
import express from "express";
import registerAllRoutes from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.js"; 

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

registerAllRoutes(app);

app.use(errorMiddleware);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});