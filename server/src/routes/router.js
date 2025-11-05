import { Router } from "express";
import authRouter from "./auth.router.js";

const router = Router();

router.get("/", (req, res) => {
  res.send("Hello World!!! Welcome");
});

router.use("/auth", authRouter);

export default router;