import { Router } from "express";
import {
    signUpController,
    signInController,
    refreshTokenController,
    logoutController,
    getProfileController
} from "../module/auth/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const authRouter = Router();

// Public routes
authRouter.post("/sign-up", signUpController);
authRouter.post("/sign-in", signInController);
authRouter.post("/refresh-token", refreshTokenController);

// Protected routes
authRouter.post("/logout", authenticateToken, logoutController);
authRouter.get("/profile", authenticateToken, getProfileController);

export default authRouter;
