import axios, { AxiosInstance, AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { config } from "../config/environment";

const API_BASE_URL = config.API_BASE_URL;

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

interface ApiError {
  success: false;
  error: {
    message: string;
    statusCode: number;
    details?: any;
  };
}

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    const tokens = await getStoredTokens();
    if (tokens.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Handle axios errors
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data;
      if (errorData && !errorData.success) {
        return Promise.reject(new Error(errorData.error?.message));
      }
      return Promise.reject(new Error(error.response.statusText));
    } else if (error.request) {
      console.log("Error in request", error.request);
      // Request made but no response received
      return Promise.reject(new Error("Network error occurred"));
    } else {
      // Something else happened
      return Promise.reject(new Error(error.message));
    }
  }
);

// Private helper function (not exported - only used internally)
async function makeRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    data?: any;
  } = {}
): Promise<T> {
  try {
    const { method = "GET", data } = options;

    const response = await axiosInstance.request<ApiResponse<T>>({
      url: endpoint,
      method,
      data,
    });
    if (!response) throw new Error("No response from server");

    if (response.data.success) {
      return response.data.data;
    }
    return response.data as unknown as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Unknown network error");
    }
  }
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