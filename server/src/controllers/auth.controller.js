import {
  ApiResponse,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "../utils/response.utils.js";
import { authService } from "../services/auth.service.js";

export const signUpController = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const deviceInfo = req.get("User-Agent");

    const result = await authService.signUp(
      { name, email, password },
      ipAddress,
      deviceInfo
    );

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.CREATED,
      "User registered successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

export const signInController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const deviceInfo = req.get("User-Agent");

    const result = await authService.signIn(
      { email, password },
      ipAddress,
      deviceInfo
    );

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.LOGIN_SUCCESS,
      result
    );
  } catch (error) {
    next(error);
  }
};

export const refreshTokenController = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      "Tokens refreshed successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

export const logoutController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await authService.logout(userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.LOGOUT_SUCCESS
    );
  } catch (error) {
    next(error);
  }
};

export const getProfileController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await authService.getProfile(userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.RETRIEVED,
      user
    );
  } catch (error) {
    next(error);
  }
};

export const getUserByEmailController = async (req, res, next) => {
  try {
    const { email } = req.params;

    const user = await authService.getUserByEmail(email);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.RETRIEVED,
      user
    );
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordController = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    // Send password reset email
    const { emailService } = await import("../services/email.service.js");
    await emailService.sendPasswordResetEmail(email, result.resetToken, req);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.PASSWORD_RESET,
      {
        message: "Password reset email has been sent to your email address",
        email: email,
      }
    );
  } catch (error) {
    next(error);
  }
};

export const verifyResetTokenController = async (req, res, next) => {
  try {
    const { token } = req.body;

    const result = await authService.verifyResetToken(token);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      "Reset token is valid",
      result
    );
  } catch (error) {
    next(error);
  }
};

export const resetPasswordController = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const result = await authService.resetPassword(token, password);

    // Send password reset confirmation email
    const { emailService } = await import("../services/email.service.js");
    await emailService.sendPasswordResetConfirmationEmail(result.user.email);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.PASSWORD_RESET,
      {
        message: "Password has been reset successfully",
        user: result.user,
      }
    );
  } catch (error) {
    next(error);
  }
};
