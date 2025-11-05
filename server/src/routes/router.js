import { Router } from "express";
import authRouter from "../module/auth/auth.router.js";

const router = Router();

router.get("/", (req, res) => {
  res.send("Hello World");
});

router.use("/auth", authRouter);

export default router;