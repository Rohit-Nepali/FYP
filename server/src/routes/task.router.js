import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  createTaskController,
  getAllTasksController,
  getTaskByIdController,
  updateTaskController,
  deleteTaskController,
  getProjectTasksController,
} from "../controllers/task.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  createTaskSchema,
  updateTaskSchema,
} from "../validator/task.validator.js";
import {  uploadTaskAttachmentController } from "../controllers/attachment.controller.js";
import { uploadTaskAttachment } from "../middleware/upload.middleware.js";

const taskRouter = Router();

// All task routes require authentication
taskRouter.use(authenticateToken);

// Task routes
taskRouter.post("/", validate(createTaskSchema), createTaskController);
taskRouter.get("/", getAllTasksController);
// Project-scoped tasks should be matched before :id
taskRouter.get("/project/:projectId", getProjectTasksController);
taskRouter.get("/:id", getTaskByIdController);
taskRouter.put("/:id", validate(updateTaskSchema), updateTaskController);
taskRouter.delete("/:id", deleteTaskController);

taskRouter.post(
  "/tasks/:taskId/attachments",
  authenticateToken,
  uploadTaskAttachment.single("file"),
  uploadTaskAttachmentController
);

export default taskRouter;
