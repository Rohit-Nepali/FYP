import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { getUserBehaviorInsightsController } from "../controllers/insights.controller.js";

const insightsRouter = Router();

insightsRouter.use(authenticateToken);
insightsRouter.get("/user-behavior", getUserBehaviorInsightsController);

export default insightsRouter;
