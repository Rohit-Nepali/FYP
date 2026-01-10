import { Router } from "express";
import {
  createComment,
  getCommentsByTask,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  createCommentSchema,
  updateCommentSchema,
} from "../validator/comment.validator.js";

const commentRouter = Router();

// All comment routes require authentication
commentRouter.use(authenticateToken);

// Create comment
commentRouter.post("/", validate(createCommentSchema), createComment);

// Get comments for a task
commentRouter.get("/task/:taskId", getCommentsByTask);

// Update comment
commentRouter.put("/:id", validate(updateCommentSchema), updateComment);

// Delete comment
commentRouter.delete("/:id", deleteComment);

export default commentRouter;