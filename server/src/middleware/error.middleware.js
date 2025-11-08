import { ApiError } from "../utils/error.utils.js";
import logger from "../config/logger.js";
import { ApiResponse } from "#utils/response.utils.js";

export const errorMiddleware = (err, req, res, next) => {
  let error = err;
  // Log the error
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // ------ JWT errors ------
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = new ApiError(message, 401);
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = new ApiError(message, 401);
  }

  // ------ Prisma errors ------
  if (err.code === "P2002") {
    const message = "Duplicate field value entered";
    error = new ApiError(message, 400);
  }

  if (err.code === "P2025") {
    const message = "Record not found";
    error = new ApiError(message, 404);
  }

  // ----- Joi validation errors -----
  if (err.name === "ValidationError" && err.isJoi) {
    const validationErrors = err.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message.replace(/"/g, ""), // Remove quotes from messages
    }));
    error = new ApiError("Validation Error", 400, validationErrors);
  }

  // Default to 500 server error
  if (!(error instanceof ApiError)) {
    error = new ApiError("Internal Server Error", 500, false);
  }

  // Send error response
  const errorDetails =
    process.env.NODE_ENV === "development" ? { stack: err.stack } : null;

  return ApiResponse.sendErrorResponse(
    res,
    error.statusCode,
    error.message,
    error.errors || errorDetails
  );
};

/**
 * Handle 404 errors for undefined routes
 */
export const notFoundMiddleware = (req, res, next) => {
  const error = new ApiError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};
