import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import router from "./routes/router.js";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add routes
app.use("/", router);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
