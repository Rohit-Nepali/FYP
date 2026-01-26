import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  createPriorityController,
  getAllPrioritiesController,
  getPriorityByIdController,
  updatePriorityController,
  deletePriorityController,
} from "../controllers/priority.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  createPrioritySchema,
  updatePrioritySchema,
} from "../validator/priority.validator.js";

const priorityRouter = Router();

// All priority routes require authentication
priorityRouter.use(authenticateToken);

// Priority routes
priorityRouter.post("/projects/:projectId/priorities", validate(createPrioritySchema), createPriorityController);
priorityRouter.get("/projects/:projectId/priorities", getAllPrioritiesController);
priorityRouter.get("/projects/:projectId/priorities/:id", getPriorityByIdController);
priorityRouter.put("/projects/:projectId/priorities/:id", validate(updatePrioritySchema), updatePriorityController);
priorityRouter.delete("/projects/:projectId/priorities/:id", deletePriorityController);

export default priorityRouter;
