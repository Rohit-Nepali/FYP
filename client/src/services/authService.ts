import AsyncStorage from "@react-native-async-storage/async-storage";
import { config } from "../config/environment";

const API_BASE_URL = config.API_BASE_URL;

interface LoginResponse {
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

class AuthService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authorization header if we have a token
    const tokens = await this.getStoredTokens();
    if (tokens.accessToken) {
      defaultHeaders["Authorization"] = `Bearer ${tokens.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        const errorData = data as ApiError;
        throw new Error(errorData.error?.message || "Request failed");
      }

      if (!data.success) {
        const errorData = data as ApiError;
        throw new Error(errorData.error?.message || "Request failed");
      }

      return data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error occurred");
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    return this.makeRequest<LoginResponse>("/auth/sign-in", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(
    name: string,
    email: string,
    password: string
  ): Promise<RegisterResponse> {
    return this.makeRequest<RegisterResponse>("/auth/sign-up", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  }

  async logout(): Promise<void> {
    return this.makeRequest<void>("/auth/logout", {
      method: "POST",
    });
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return this.makeRequest<RefreshTokenResponse>("/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getProfile(): Promise<LoginResponse["user"]> {
    return this.makeRequest<LoginResponse["user"]>("/auth/profile", {
      method: "GET",
    });
  }

  async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
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

  async getStoredTokens(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
  }> {
    try {
      const tokens = await AsyncStorage.multiGet([
        "accessToken",
        "refreshToken",
      ]);
      return {
        accessToken: tokens[0][1],
        refreshToken: tokens[1][1],
      };
    } catch (error) {
      console.error("Error retrieving tokens:", error);
      return { accessToken: null, refreshToken: null };
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
    } catch (error) {
      console.error("Error clearing tokens:", error);
    }
  }
}

export const authService = new AuthService();
