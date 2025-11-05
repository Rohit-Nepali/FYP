export class ApiError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message)
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class AuthenticationError extends ApiError {
    constructor(message = 'Unauthorized', statusCode = 401) {
        super(message, statusCode);
    }
}

export class AuthorizationError extends ApiError {
    constructor(message = 'Access Denied', statusCode = 401) {
        super(message, statusCode);
    }
}

export class NotFoundError extends ApiError {
    constructor(message = 'Not Found', statusCode = 404) {
        super(message, statusCode);
    }
}

export class BadRequestError extends ApiError {
    constructor(message = 'Bad Request', statusCode = 400) {
        super(message, statusCode);
    }
}