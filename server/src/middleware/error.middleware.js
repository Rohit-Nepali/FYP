import { ApiError } from '../utils/error.utils.js';
import logger from '../config/logger.js';

/**
 * Global error handling middleware
 * Handles both operational and programming errors
 */
export const errorMiddleware = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log the error
    logger.error(`Error: ${err.message}`, {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new ApiError(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new ApiError(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = new ApiError(message, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = new ApiError(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = new ApiError(message, 401);
    }

    // Prisma errors
    if (err.code === 'P2002') {
        const message = 'Duplicate field value entered';
        error = new ApiError(message, 400);
    }

    if (err.code === 'P2025') {
        const message = 'Record not found';
        error = new ApiError(message, 404);
    }

    // Joi validation error
    if (err.isJoi) {
        const message = 'Validation failed';
        const errors = err.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message.replace(/"/g, '')
        }));
        error = new ApiError(message, 400);
        error.errors = errors;
    }

    // Default to 500 server error
    if (!(error instanceof ApiError)) {
        error = new ApiError('Internal Server Error', 500, false);
    }

    // Send error response
    const errorDetails = process.env.NODE_ENV === 'development' ? { stack: err.stack } : null;

    return sendErrorResponse(
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