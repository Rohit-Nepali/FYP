import { Router } from "express";
import authRouter from "./auth.router.js";
import taskRouter from "./task.router.js";
import groupRouter from "./group.router.js";

const router = Router();

router.get("/api/", (req, res) => {
  res.send("Hello World!!! Welcome");
});

router.use("/api/auth", authRouter);
router.use("/api/tasks", taskRouter);
router.use("/api/groups", groupRouter);

export default router;
