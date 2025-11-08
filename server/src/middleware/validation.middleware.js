import { ApiError } from "../utils/error.utils.js";

/**
 * Middleware to validate request data using Joi schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
export const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const validationError = new Error("Validation Error");
            validationError.name = "ValidationError";
            validationError.isJoi = true;
            validationError.details = error.details;
            return next(validationError);
        }

        // Replace req.body with validated and sanitized value
        req.body = value;
        next();
    };
};

