import {
  apiClient,
  makeRequest,
  storeTokens,
  getStoredTokens,
  clearTokens,
} from "./apiClient";

// Re-export token helpers so existing imports from authService still work
export { storeTokens, getStoredTokens, clearTokens };

// Re-export axiosInstance for backward compatibility
export { apiClient as axiosInstance };

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    profileImage?: string;
    createdAt: string;
    googleId?: string;
  };
  accessToken: string;
  refreshToken: string;
}

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
    createdAt: string;
    googleId?: string;
  };
  requiresEmailVerification: boolean;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ─── Public API Functions ────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  return makeRequest<LoginResponse>("/auth/sign-in", {
    method: "POST",
    data: { email, password },
  });
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<RegisterResponse> {
  return makeRequest<RegisterResponse>("/auth/sign-up", {
    method: "POST",
    data: { name, email, password },
  });
}

export async function verifyEmail(
  email: string,
  code: string
): Promise<{
  verified: boolean;
  alreadyVerified?: boolean;
  message: string;
}> {
  return makeRequest<{
    verified: boolean;
    alreadyVerified?: boolean;
    message: string;
  }>("/auth/verify-email", {
    method: "POST",
    data: { email, code },
  });
}

export async function resendVerification(email: string): Promise<{
  shouldSendEmail: boolean;
  alreadyVerified?: boolean;
  message: string;
}> {
  return makeRequest<{
    shouldSendEmail: boolean;
    alreadyVerified?: boolean;
    message: string;
  }>("/auth/resend-verification", {
    method: "POST",
    data: { email },
  });
}

export async function logout(): Promise<void> {
  return makeRequest<void>("/auth/logout", {
    method: "POST",
  });
}

export async function refreshToken(
  refreshTokenValue: string
): Promise<RefreshTokenResponse> {
  return makeRequest<RefreshTokenResponse>("/auth/refresh-token", {
    method: "POST",
    data: { refreshToken: refreshTokenValue },
  });
}

export async function getProfile(): Promise<LoginResponse["user"]> {
  return makeRequest<LoginResponse["user"]>("/auth/profile", {
    method: "GET",
  });
}

export async function getUserByEmail(
  email: string
): Promise<LoginResponse["user"]> {
  return makeRequest<LoginResponse["user"]>(
    `/auth/user/${encodeURIComponent(email)}`,
    {
      method: "GET",
    }
  );
}

export async function forgotPassword(email: string): Promise<{
  message: string;
  email: string;
}> {
  return makeRequest<{ message: string; email: string }>(
    "/auth/forgot-password",
    {
      method: "POST",
      data: { email },
    }
  );
}

export async function verifyResetToken(token: string): Promise<{
  valid: boolean;
  userId: string;
  email: string;
}> {
  return makeRequest<{
    valid: boolean;
    userId: string;
    email: string;
  }>("/auth/verify-reset-token", {
    method: "POST",
    data: { token },
  });
}

export async function resetPassword(
  token: string,
  password: string
): Promise<{
  message: string;
  user: LoginResponse["user"];
}> {
  return makeRequest<{
    message: string;
    user: LoginResponse["user"];
  }>("/auth/reset-password", {
    method: "POST",
    data: { token, password },
  });
}

// Export object-based API for convenience
export const authService = {
  login,
  register,
  verifyEmail,
  resendVerification,
  logout,
  refreshToken,
  getProfile,
  getUserByEmail,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  storeTokens,
  getStoredTokens,
  clearTokens,
};