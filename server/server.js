import app from "./src/app.js";
import dotenv from "dotenv";
import logger from "./src/config/logger.js";
import { connectDB } from "./src/config/db.js";
dotenv.config();

const PORT = process.env.PORT;

app.listen(PORT, () => {
  logger.info(`Server is running on port http://localhost:${PORT}`);
  connectDB();
});