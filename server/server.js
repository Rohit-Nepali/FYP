import dotenv from "dotenv";
dotenv.config();
import app from "./src/app.js";
import logger from "./src/config/logger.js";
import { connectDB } from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT,'0.0.0.0', () => {
  logger.info(`Server is running on port http://localhost:${PORT}`);
  connectDB();
});
