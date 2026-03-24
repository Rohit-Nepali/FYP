export type AuthErrorType =
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_VERIFIED"
  | "NETWORK_ERROR"
  | "EMAIL_ERROR"
  | "UNKNOWN_ERROR";

export const handleAuthError = (error: unknown): AuthErrorType => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("user not found") ||
      message.includes("invalid credentials")
    ) {
      return "INVALID_CREDENTIALS";
    } else if (
      message.includes("verify your email") ||
      message.includes("email not verified")
    ) {
      return "EMAIL_NOT_VERIFIED";
    } else if (
      message.includes("network") ||
      message.includes("internet") ||
      message.includes("connection")
    ) {
      return "NETWORK_ERROR";
    } else if (message.includes("email") || message.includes("user")) {
      return "EMAIL_ERROR";
    }
  }

  return "UNKNOWN_ERROR";
};

export const getAuthErrorMessage = (
  errorType: AuthErrorType
): { title: string; message: string } => {
  const errors = {
    INVALID_CREDENTIALS: {
      title: "Login Failed",
      message:
        "Invalid email or password. Please check your credentials and try again.",
    },
    EMAIL_NOT_VERIFIED: {
      title: "Email Not Verified",
      message:
        "Please verify your email first. Check your inbox for the verification code.",
    },
    NETWORK_ERROR: {
      title: "Connection Error",
      message:
        "Unable to connect to the server. Please check your internet connection.",
    },
    EMAIL_ERROR: {
      title: "Email Error",
      message: "There was a problem with your email address. Please try again.",
    },
    UNKNOWN_ERROR: {
      title: "Login Failed",
      message: "An unexpected error occurred. Please try again later.",
    },
  };

  return errors[errorType];
};

// Add to existing errorHandler.ts
export type SignupErrorType =
  | "EMAIL_TAKEN"
  | "EMAIL_SERVICE_UNAVAILABLE"
  | "NETWORK_ERROR"
  | "INVALID_EMAIL"
  | "WEAK_PASSWORD"
  | "UNKNOWN_ERROR";

export const handleSignupError = (error: unknown): SignupErrorType => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("email") &&
      (message.includes("taken") || message.includes("already"))
    ) {
      return "EMAIL_TAKEN";
    } else if (
      message.includes("email verification service") ||
      message.includes("smtp") ||
      message.includes("service unavailable")
    ) {
      return "EMAIL_SERVICE_UNAVAILABLE";
    } else if (
      message.includes("network") ||
      message.includes("internet") ||
      message.includes("connection")
    ) {
      return "NETWORK_ERROR";
    } else if (message.includes("email") || message.includes("invalid")) {
      return "INVALID_EMAIL";
    } else if (message.includes("password") || message.includes("weak")) {
      return "WEAK_PASSWORD";
    }
  }

  return "UNKNOWN_ERROR";
};

export const getSignupErrorMessage = (
  errorType: SignupErrorType
): { title: string; message: string } => {
  const errors = {
    EMAIL_TAKEN: {
      title: "Email Already Registered",
      message:
        "This email is already registered. Please use a different email or sign in.",
    },
    EMAIL_SERVICE_UNAVAILABLE: {
      title: "Email Service Unavailable",
      message:
        "We couldn't send the verification email right now. Please try again later.",
    },
    NETWORK_ERROR: {
      title: "Connection Error",
      message:
        "Unable to connect to the server. Please check your internet connection.",
    },
    INVALID_EMAIL: {
      title: "Invalid Email",
      message: "Please enter a valid email address.",
    },
    WEAK_PASSWORD: {
      title: "Weak Password",
      message: "Your password does not meet the security requirements.",
    },
    UNKNOWN_ERROR: {
      title: "Signup Failed",
      message: "An unexpected error occurred. Please try again later.",
    },
  };

  return errors[errorType];
};
