import { verifyAccessToken } from './../utils/jwt.utils.js'
import { ApiResponse, HTTP_STATUS, ERROR_MESSAGES } from '../utils/response.utils.js';

/**
 * Middleware to authenticate JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return ApiResponse.sendErrorResponse(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        return ApiResponse.sendErrorResponse(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }
};

/**
 * Middleware to check if user has required role
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
export const authorizeRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return ApiResponse.sendErrorResponse(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        }

        if (!roles.includes(req.user.role)) {
            return ApiResponse.sendErrorResponse(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);
        }

        next();
    };
};