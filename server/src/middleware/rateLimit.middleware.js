import rateLimit from "express-rate-limit";
import { ApiResponse } from "../utils/response.utils.js";

const buildRateLimitResponse = (res, message) =>
  ApiResponse.sendErrorResponse(res, 429, message);

export const signInRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) =>
    buildRateLimitResponse(
      res,
      "Too many failed sign-in attempts. Please try again in 15 minutes."
    ),
});

export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    buildRateLimitResponse(
      res,
      "Too many password reset requests. Please try again in 15 minutes."
    ),
});

export const verifyResetTokenRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    buildRateLimitResponse(
      res,
      "Too many reset token verification attempts. Please try again in 15 minutes."
    ),
});