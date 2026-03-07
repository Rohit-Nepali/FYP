import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  signUpController,
  signInController,
  refreshTokenController,
  logoutController,
  getProfileController,
  getUserByEmailController,
  forgotPasswordController,
  verifyResetTokenController,
  resetPasswordController,
  googleSignUpController,
  googleSignInController,
} from "../controllers/auth.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  signUpSchema,
  signInSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  verifyResetTokenSchema,
  resetPasswordSchema,
  googleSignUpSchema,
  googleSignInSchema,
} from "../validator/auth.validator.js";

const authRouter = Router();

// Public routes
authRouter.post("/sign-up", validate(signUpSchema), signUpController);
authRouter.post("/sign-in", validate(signInSchema), signInController);
authRouter.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  refreshTokenController
);
authRouter.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPasswordController
);
authRouter.post(
  "/verify-reset-token",
  validate(verifyResetTokenSchema),
  verifyResetTokenController
);
authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPasswordController
);

// Google Sign-Up route (public)
authRouter.post(
  "/google-signup",
  validate(googleSignUpSchema),
  googleSignUpController
);

// Google Sign-In route (public) - for existing users
authRouter.post(
  "/google-signin",
  validate(googleSignInSchema),
  googleSignInController
);

// Protected routes
authRouter.post("/logout", authenticateToken, logoutController);
authRouter.get("/profile", authenticateToken, getProfileController);
authRouter.get("/user/:email", authenticateToken, getUserByEmailController);

export default authRouter;
