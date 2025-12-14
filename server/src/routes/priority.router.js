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
priorityRouter.post("/", validate(createPrioritySchema), createPriorityController);
priorityRouter.get("/", getAllPrioritiesController);
priorityRouter.get("/:id", getPriorityByIdController);
priorityRouter.put("/:id", validate(updatePrioritySchema), updatePriorityController);
priorityRouter.delete("/:id", deletePriorityController);

export default priorityRouter;
