import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  createTaskController,
  getAllTasksController,
  getTaskByIdController,
  updateTaskController,
  deleteTaskController,
  getGroupTasksController,
} from "../controllers/task.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  createTaskSchema,
  updateTaskSchema,
} from "../validator/task.validator.js";

const taskRouter = Router();

// All task routes require authentication
taskRouter.use(authenticateToken);

// Task routes
taskRouter.post("/", validate(createTaskSchema), createTaskController);
taskRouter.get("/", getAllTasksController);
taskRouter.get("/:id", getTaskByIdController);
taskRouter.put("/:id", validate(updateTaskSchema), updateTaskController);
taskRouter.delete("/:id", deleteTaskController);

// Group task routes
taskRouter.get("/group/:groupId", getGroupTasksController);

export default taskRouter;
