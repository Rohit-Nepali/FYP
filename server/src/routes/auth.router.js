import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  signUpController,
  signInController,
  verifyEmailController,
  resendVerificationController,
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
  signInRateLimiter,
  forgotPasswordRateLimiter,
  verifyResetTokenRateLimiter,
} from "../middleware/rateLimit.middleware.js";
import {
  signUpSchema,
  signInSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  verifyResetTokenSchema,
  resetPasswordSchema,
} from "../validator/auth.validator.js";

const authRouter = Router();

// Public routes
authRouter.post("/sign-up", validate(signUpSchema), signUpController);
authRouter.post(
  "/sign-in",
  signInRateLimiter,
  validate(signInSchema),
  signInController
);
authRouter.post(
  "/verify-email",
  validate(verifyEmailSchema),
  verifyEmailController
);
authRouter.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  resendVerificationController
);
authRouter.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  refreshTokenController
);
authRouter.post(
  "/forgot-password",
  forgotPasswordRateLimiter,
  validate(forgotPasswordSchema),
  forgotPasswordController
);
authRouter.post(
  "/verify-reset-token",
  verifyResetTokenRateLimiter,
  validate(verifyResetTokenSchema),
  verifyResetTokenController
);
authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPasswordController
);

// Google Sign-Up route (public)
authRouter.post("/google-signup", googleSignUpController);

// Google Sign-In route (public) - for existing users
authRouter.post("/google-signin", googleSignInController);

// Protected routes
authRouter.post("/logout", authenticateToken, logoutController);
authRouter.get("/profile", authenticateToken, getProfileController);
authRouter.get("/user/:email", authenticateToken, getUserByEmailController);

export default authRouter;
