/**
 * User-friendly error message formatter
 * Converts error codes and messages into helpful guidance
 */

export interface FormattedError {
  title: string;
  message: string;
  suggestion?: string;
}

export function formatErrorMessage(error: unknown): FormattedError {
  const message = error instanceof Error ? error.message : String(error);

  // Network errors
  if (message.includes("Network error") || message.includes("timeout")) {
    return {
      title: "Network Error",
      message: "Could not connect to the server. Please check your internet connection.",
      suggestion: "Try again in a few moments.",
    };
  }

  // File validation errors
  if (message.includes("file") && message.includes("size")) {
    return {
      title: "File Too Large",
      message: "The file exceeds the maximum allowed size.",
      suggestion: "Please select a smaller file and try again.",
    };
  }

  if (message.includes("file") && message.includes("type")) {
    return {
      title: "Invalid File Type",
      message: "This file type is not supported.",
      suggestion: "Please select a different file format.",
    };
  }

  if (message.includes("file") || message.includes("attachment")) {
    return {
      title: "File Error",
      message: message,
      suggestion: "Please try selecting a different file.",
    };
  }

  // Authentication errors
  if (message.includes("401") || message.includes("Unauthorized")) {
    return {
      title: "Session Expired",
      message: "Your session has expired. Please sign in again.",
      suggestion: "Go to profile settings or restart the app.",
    };
  }

  if (message.includes("403") || message.includes("Forbidden")) {
    return {
      title: "Access Denied",
      message: "You don't have permission to perform this action.",
      suggestion: "Contact your project administrator if you need access.",
    };
  }

  // Server errors
  if (message.includes("500") || message.includes("Internal Server Error")) {
    return {
      title: "Server Error",
      message: "Something went wrong on the server. Please try again later.",
      suggestion: "If the problem persists, contact support.",
    };
  }

  if (message.includes("502") || message.includes("Bad Gateway")) {
    return {
      title: "Server Unavailable",
      message: "The server is temporarily unavailable.",
      suggestion: "Please try again in a few moments.",
    };
  }

  if (message.includes("503") || message.includes("Service Unavailable")) {
    return {
      title: "Server Maintenance",
      message: "The server is under maintenance.",
      suggestion: "Please try again later.",
    };
  }

  // Not found errors
  if (message.includes("404") || message.includes("Not Found")) {
    return {
      title: "Not Found",
      message: "The requested resource could not be found.",
      suggestion: "Please refresh and try again.",
    };
  }

  // Validation errors
  if (message.includes("validation") || message.includes("invalid")) {
    return {
      title: "Invalid Input",
      message: message,
      suggestion: "Please check your input and try again.",
    };
  }

  // Default error
  return {
    title: "Error",
    message: message || "An unexpected error occurred",
    suggestion: "Please try again or contact support if the problem persists.",
  };
}

/**
 * Get error details suitable for logging
 */
export function getErrorDetails(error: unknown): {
  code?: string;
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}
