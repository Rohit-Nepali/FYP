import { Router } from "express";
import authRouter from "./auth.router.js";

const router = Router();

router.get("/api/", (req, res) => {
  res.send("Hello World!!! Welcome");
});

router.use("/api/auth", authRouter);

export default router;