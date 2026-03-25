import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { predictTaskRiskSchema } from "../validator/prediction.validator.js";
import { predictTaskRiskController } from "../controllers/prediction.controller.js";

const predictionRouter = Router();

predictionRouter.use(authenticateToken);
predictionRouter.post("/task-risk", validate(predictTaskRiskSchema), predictTaskRiskController);

export default predictionRouter;
