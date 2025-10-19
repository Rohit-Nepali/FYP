import express from 'express';
import {
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    BadRequestError
} from '../utils/error.utils.js';
import {
    sendSuccessResponse,
    sendErrorResponse,
    HTTP_STATUS,
    SUCCESS_MESSAGES
} from '../utils/response.utils.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       $ref: '#/components/schemas/Error'
 *     SuccessResponse:
 *       $ref: '#/components/schemas/Success'
 *   parameters:
 *     ErrorType:
 *       in: query
 *       name: errorType
 *       required: false
 *       schema:
 *         type: string
 *         enum: [auth, forbidden, notfound, badrequest, server, validation]
 *       description: Type of error to test
 */

/**
 * @swagger
 * /examples/test-errors:
 *   get:
 *     summary: Test Error Handling
 *     description: Demonstrates different types of error handling in the API
 *     tags: [Examples]
 *     parameters:
 *       - $ref: '#/components/parameters/ErrorType'
 *     responses:
 *       200:
 *         description: Success response when no error type is specified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad Request Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication or Authorization Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Not Found Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/test-errors', (req, res, next) => {
    const { errorType } = req.query;

    switch (errorType) {
        case 'auth':
            throw new AuthenticationError('Invalid credentials');

        case 'forbidden':
            throw new AuthorizationError('You do not have permission to access this resource');

        case 'notfound':
            throw new NotFoundError('User not found');

        case 'badrequest':
            throw new BadRequestError('Invalid request parameters');

        case 'server':
            // This will be caught by the error middleware and converted to a 500 error
            throw new Error('Something went wrong on the server');

        case 'validation':
            // Simulate validation error
            const validationError = new Error('Validation failed');
            validationError.name = 'ValidationError';
            validationError.errors = {
                email: { message: 'Email is required' },
                password: { message: 'Password must be at least 8 characters' }
            };
            throw validationError;

        default:
            return sendSuccessResponse(
                res,
                HTTP_STATUS.OK,
                'No error triggered. Try adding ?errorType=auth|forbidden|notfound|badrequest|server|validation'
            );
    }
});

/**
 * @swagger
 * /examples/test-success:
 *   get:
 *     summary: Test Success Response
 *     description: Demonstrates a successful API response with data
 *     tags: [Examples]
 *     responses:
 *       200:
 *         description: Successful response with sample data
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: "This is a successful response"
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T14:30:25.000Z"
 *                         user:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 1
 *                             name:
 *                               type: string
 *                               example: "John Doe"
 *                             email:
 *                               type: string
 *                               example: "john@example.com"
 */
router.get('/test-success', (req, res) => {
    const data = {
        message: 'This is a successful response',
        timestamp: new Date().toISOString(),
        user: {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com'
        }
    };

    return sendSuccessResponse(
        res,
        HTTP_STATUS.OK,
        SUCCESS_MESSAGES.RETRIEVED,
        data
    );
});

/**
 * @swagger
 * /examples/test-async-error:
 *   get:
 *     summary: Test Async Error Handling
 *     description: Demonstrates how async errors are handled in the API
 *     tags: [Examples]
 *     responses:
 *       404:
 *         description: Not Found Error (simulated async error)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/test-async-error', async (req, res, next) => {
    try {
        // Simulate an async operation that might fail
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(new NotFoundError('Async operation failed'));
            }, 100);
        });
    } catch (error) {
        next(error); // Pass error to error middleware
    }
});

export default router;
