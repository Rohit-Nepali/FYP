import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  createStatusController,
  getAllStatusesController,
  getStatusByIdController,
  updateStatusController,
  deleteStatusController,
  // getGlobalStatusesController,
} from "../controllers/status.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  createStatusSchema,
  updateStatusSchema,
} from "../validator/status.validator.js";

const statusRouter = Router();

// All status routes require authentication
statusRouter.use(authenticateToken);

// Status routes
statusRouter.post("/projects/:projectId/statuses", validate(createStatusSchema), createStatusController);
statusRouter.get("/projects/:projectId/statuses", getAllStatusesController);
statusRouter.get("/projects/:projectId/statuses/:id", getStatusByIdController);
statusRouter.put("/projects/:projectId/statuses/:id", validate(updateStatusSchema), updateStatusController);
statusRouter.delete("/projects/:projectId/statuses/:id", deleteStatusController);

// Global status routes (for project-less statuses)
// statusRouter.get("/global/statuses", getGlobalStatusesController);

export default statusRouter;
