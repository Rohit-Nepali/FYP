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
      throw new ApiError(ERROR_MESSAGES.USER_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
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
      throw new ApiError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new ApiError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
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
    await prisma.userSession.deleteMany({
      where: { userId: user.id },
    });

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
      throw new ApiError(ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
    }

    // Verify token matches user
    if (session.userId !== decoded.id) {
      throw new ApiError(ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
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
};

