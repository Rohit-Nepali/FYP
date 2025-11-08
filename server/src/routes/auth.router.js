import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  signUpController, signInController, refreshTokenController,
  logoutController, getProfileController
} from "../controllers/auth.controller.js";

import { validate } from "../middleware/validation.middleware.js";
import {
  signUpSchema,
  signInSchema,
  refreshTokenSchema,
} from "../validator/auth.validator.js";

const authRouter = Router();

// Public routes
authRouter.post("/sign-up", validate(signUpSchema), signUpController);
authRouter.post("/sign-in", validate(signInSchema), signInController);
authRouter.post("/refresh-token", validate(refreshTokenSchema), refreshTokenController);

// Protected routes
authRouter.post("/logout", authenticateToken, logoutController);
authRouter.get("/profile", authenticateToken, getProfileController);

export default authRouter;
