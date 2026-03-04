require("dotenv").config();
import express from "express";
import registerAllRoutes from "./routes/index";

const app = express();

app.use(express.json());

registerAllRoutes(app);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});