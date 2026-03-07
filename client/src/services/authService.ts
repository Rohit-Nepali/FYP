import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeRequest } from "./apiClient";

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    profileImage?: string;
    createdAt: string;
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
    createdAt: string;
  };
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Public API functions
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

export async function logout(): Promise<void> {
  return makeRequest<void>("/auth/logout", {
    method: "POST",
  });
}

export async function refreshToken(
  refreshToken: string
): Promise<RefreshTokenResponse> {
  return makeRequest<RefreshTokenResponse>("/auth/refresh-token", {
    method: "POST",
    data: { refreshToken },
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

export async function storeTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      ["accessToken", accessToken],
      ["refreshToken", refreshToken],
    ]);
  } catch (error) {
    console.error("Error storing tokens:", error);
    throw new Error("Failed to store authentication tokens");
  }
}

export async function getStoredTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  try {
    const tokens = await AsyncStorage.multiGet(["accessToken", "refreshToken"]);
    return {
      accessToken: tokens[0][1],
      refreshToken: tokens[1][1],
    };
  } catch (error) {
    console.error("Error retrieving tokens:", error);
    return { accessToken: null, refreshToken: null };
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
  } catch (error) {
    console.error("Error clearing tokens:", error);
  }
}

// Export object-based API for convenience
export const authService = {
  login,
  register,
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
