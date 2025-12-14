import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  createStatusController,
  getAllStatusesController,
  getStatusByIdController,
  updateStatusController,
  deleteStatusController,
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
statusRouter.post("/", validate(createStatusSchema), createStatusController);
statusRouter.get("/", getAllStatusesController);
statusRouter.get("/:id", getStatusByIdController);
statusRouter.put("/:id", validate(updateStatusSchema), updateStatusController);
statusRouter.delete("/:id", deleteStatusController);

export default statusRouter;
