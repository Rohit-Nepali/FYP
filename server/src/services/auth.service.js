import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.utils.js";
import { ApiError } from "../utils/error.utils.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../utils/response.utils.js";

export const authService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User's name
   * @param {string} userData.email - User's email
   * @param {string} userData.password - User's password
   * @param {string} ipAddress - IP address of the request
   * @param {string} deviceInfo - Device information from User-Agent header
   * @returns {Promise<Object>} User data with tokens
   */
  signUp: async (userData, ipAddress, deviceInfo) => {
    const { name, email, password } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ApiError(
        ERROR_MESSAGES.USER_ALREADY_EXISTS,
        HTTP_STATUS.CONFLICT
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileImage: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create session
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        ipAddress,
        deviceInfo,
        expiresAt,
      },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  },

  /**
   * Sign in an existing user
   * @param {Object} credentials - User credentials
   * @param {string} credentials.email - User's email
   * @param {string} credentials.password - User's password
   * @param {string} ipAddress - IP address of the request
   * @param {string} deviceInfo - Device information from User-Agent header
   * @returns {Promise<Object>} User data with tokens
   */
  signIn: async (credentials, ipAddress, deviceInfo) => {
    const { email, password } = credentials;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError(
        ERROR_MESSAGES.USER_DOES_NOT_EXIST,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(
        ERROR_MESSAGES.INVALID_CREDENTIALS,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Delete old sessions for this user (optional: keep last N sessions)
    // For now, we'll delete all and create a new one
    // await prisma.userSession.deleteMany({
    //   where: { userId: user.id },
    // });

    // Create new session
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        ipAddress,
        deviceInfo,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  },

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New access and refresh tokens
   */
  refreshToken: async (refreshToken) => {
    if (!refreshToken) {
      throw new ApiError("Refresh token is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if session exists and is valid
    const session = await prisma.userSession.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      // Delete expired session
      if (session) {
        await prisma.userSession.delete({
          where: { id: session.id },
        });
      }
      throw new ApiError(
        ERROR_MESSAGES.INVALID_TOKEN,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Verify token matches user
    if (session.userId !== decoded.id) {
      throw new ApiError(
        ERROR_MESSAGES.INVALID_TOKEN,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    const newRefreshToken = generateRefreshToken({
      id: session.user.id,
      email: session.user.email,
    });

    // Update session with new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  /**
   * Logout user and invalidate all sessions
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  logout: async (userId) => {
    // Delete all sessions for the user
    await prisma.userSession.deleteMany({
      where: { userId },
    });
  },

  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile data
   */
  getProfile: async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileImage: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    return user;
  },

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User data
   */
  getUserByEmail: async (email) => {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileImage: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    return user;
  },

  /**
   * Initiate forgot password process
   * @param {string} email - User email
   * @returns {Promise<Object>} Reset token (only for testing, not sent in production)
   */
  forgotPassword: async (email) => {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError(
        ERROR_MESSAGES.USER_DOES_NOT_EXIST,
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Generate numeric OTP (6 digits)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Calculate expiration time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Save password reset record
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    return {
      resetToken,
      email: user.email,
      message: "Password reset email has been sent",
    };
  },

  /**
   * Verify reset token
   * @param {string} token - Reset token
   * @returns {Promise<Object>} Token validity information
   */
  verifyResetToken: async (token) => {
    // Find password reset record
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new ApiError(
        "Invalid or expired reset token",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Check if token has expired
    if (resetRecord.expiresAt < new Date()) {
      // Delete expired token
      await prisma.passwordReset.delete({
        where: { id: resetRecord.id },
      });
      throw new ApiError(
        "Password reset token has expired",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    return {
      valid: true,
      userId: resetRecord.userId,
      email: resetRecord.user.email,
    };
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success message
   */
  resetPassword: async (token, newPassword) => {
    // Verify token first
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new ApiError(
        "Invalid or expired reset token",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Check if token has expired
    if (resetRecord.expiresAt < new Date()) {
      // Delete expired token
      await prisma.passwordReset.delete({
        where: { id: resetRecord.id },
      });
      throw new ApiError(
        "Password reset token has expired",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    const user = await prisma.user.update({
      where: { id: resetRecord.userId },
      data: {
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Delete the password reset record
    await prisma.passwordReset.delete({
      where: { id: resetRecord.id },
    });

    // Delete all user sessions (force re-login)
    await prisma.userSession.deleteMany({
      where: { userId: user.id },
    });

    return {
      success: true,
      message: "Password has been reset successfully",
      user,
    };
  },

  /**
   * Sign up with Google
   * @param {Object} googleData - Google user data
   * @param {string} googleData.googleId - Google user ID
   * @param {string} googleData.email - User's email from Google
   * @param {string} googleData.name - User's name from Google
   * @param {string} googleData.profileImage - User's profile image from Google
   * @param {string} googleData.accessToken - Google access token
   * @param {string} googleData.refreshToken - Google refresh token
   * @param {string} ipAddress - IP address of the request
   * @param {string} deviceInfo - Device information from User-Agent header
   * @returns {Promise<Object>} User data with tokens
   */
  signUpWithGoogle: async (googleData, ipAddress, deviceInfo) => {
    const { googleId, email, name, profileImage, accessToken, refreshToken } = googleData;

    // Check if user already exists by email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // If user exists, check if they signed up with Google
    if (user) {
      if (!user.googleId) {
        // User exists but didn't sign up with Google - link the account
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            profileImage: profileImage || user.profileImage,
            googleRefreshToken: refreshToken,
          },
        });
      }
      // If user already has googleId, just return them (they can sign in)
    } else {
      // Create new user with Google
      user = await prisma.user.create({
        data: {
          name,
          email,
          googleId,
          profileImage,
          googleRefreshToken: refreshToken,
          // No password needed for Google users
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          profileImage: true,
          createdAt: true,
        },
      });
    }

    // Generate tokens
    const accessTokenJWT = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshTokenJWT = generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create session
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken: refreshTokenJWT,
        ipAddress,
        deviceInfo,
        expiresAt,
      },
    });

    return {
      user,
      accessToken: accessTokenJWT,
      refreshToken: refreshTokenJWT,
    };
  },

  /**
   * Sign in with Google (for existing Google users only)
   * @param {Object} googleData - Google user data
   * @param {string} googleData.googleId - Google user ID
   * @param {string} googleData.email - User's email from Google
   * @param {string} googleData.accessToken - Google access token
   * @param {string} googleData.refreshToken - Google refresh token
   * @param {string} ipAddress - IP address of the request
   * @param {string} deviceInfo - Device information from User-Agent header
   * @returns {Promise<Object>} User data with tokens
   */
  signInWithGoogle: async (googleData, ipAddress, deviceInfo) => {
    const { googleId, email, accessToken, refreshToken } = googleData;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, throw error (user should sign up first)
    if (!user) {
      throw new ApiError(
        "No account found with this Google email. Please sign up first.",
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Check if user has Google ID linked
    if (!user.googleId) {
      throw new ApiError(
        "This email is already registered. Please sign in with email and password, or use a different Google account.",
        HTTP_STATUS.CONFLICT
      );
    }

    // Verify the Google ID matches
    if (user.googleId !== googleId) {
      throw new ApiError(
        "Google account mismatch. Please try again.",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Update refresh token if provided
    if (refreshToken) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          googleRefreshToken: refreshToken,
        },
      });
    }

    // Generate tokens
    const accessTokenJWT = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshTokenJWT = generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create session
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken: refreshTokenJWT,
        ipAddress,
        deviceInfo,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
      accessToken: accessTokenJWT,
      refreshToken: refreshTokenJWT,
    };
  },
};
