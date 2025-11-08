export const ApiResponse = {
  /**
   * Send a successful response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Success message
   * @param {Object} data - Response data
   * @param {Object} meta - Additional metadata (pagination, etc.)
   */
  sendSuccessResponse: (
    res,
    statusCode = 200,
    message = "Success",
    data = null,
    meta = null
  ) => {
    const response = {
      success: true,
      message,
    };

    if (data !== null) {
      response.data = data;
    }

    if (meta !== null) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  },

  /**
   * Send an error response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Object} errors - Validation errors or additional error details
   */
  sendErrorResponse: (
    res,
    statusCode = 500,
    message = "Internal Server Error",
    errors = null
  ) => {
    const response = {
      success: false,
      error: {
        message,
        statusCode,
      },
    };

    if (errors !== null) {
      response.error.details = errors;
    }

    return res.status(statusCode).json(response);
  },

  /**
   * Send a paginated response
   * @param {Object} res - Express response object
   * @param {Array} data - Array of data items
   * @param {number} page - Current page number
   * @param {number} limit - Items per page
   * @param {number} total - Total number of items
   * @param {string} message - Success message
   */
  sendPaginatedResponse: (
    res,
    data,
    page,
    limit,
    total,
    message = "Data retrieved successfully"
  ) => {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const meta = {
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    };

    return sendSuccessResponse(res, 200, message, data, meta);
  },
};

/**
 * Common HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * Common success messages
 */
export const SUCCESS_MESSAGES = {
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",
  RETRIEVED: "Data retrieved successfully",
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  PASSWORD_RESET: "Password reset email sent",
  EMAIL_VERIFIED: "Email verified successfully",
};

/**
 * Common error messages
 */
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Access denied",
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Validation failed",
  DUPLICATE_ENTRY: "Resource already exists",
  USER_ALREADY_EXISTS: "User with this email already exists",
  INTERNAL_ERROR: "Internal server error",
  INVALID_TOKEN: "Invalid or expired token",
  EMAIL_NOT_VERIFIED: "Please verify your email address",
};
