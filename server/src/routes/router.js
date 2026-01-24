import { Router } from "express";
import authRouter from "./auth.router.js";
import taskRouter from "./task.router.js";
import projectRouter from "./project.router.js";
import statusRouter from "./status.router.js";
import priorityRouter from "./priority.router.js";
import commentRouter from "./comment.router.js";
import userRouter from "./user.router.js";

const router = Router();

router.get("/api/", (req, res) => {
  res.send("Hello World!!! Welcome");
});

router.use("/api/auth", authRouter);
router.use("/api/tasks", taskRouter);
router.use("/api/projects", projectRouter);
router.use("/api/statuses", statusRouter);
router.use("/api/priorities", priorityRouter);
router.use("/api/comments", commentRouter);
router.use("/api/users", userRouter);

export default router;
