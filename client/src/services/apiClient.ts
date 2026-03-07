import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { config } from "../config/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = config.API_BASE_URL;

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    details?: any;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: any;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Create axios instance with default config
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Helper to get tokens from storage
async function getStoredTokens(): Promise<{
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

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
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
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      const errorData = error.response.data;
      if (errorData && !errorData.success) {
        return Promise.reject(new Error(errorData.error?.message || "Server error"));
      }
      return Promise.reject(new Error(error.response.statusText));
    } else if (error.request) {
      return Promise.reject(new Error("Network error occurred: No response received"));
    } else {
      return Promise.reject(new Error(error.message));
    }
  }
);

// Generic helper function for making requests
export async function makeRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    data?: any;
    params?: any;
    isMultipart?: boolean;
  } = {}
): Promise<T> {
  try {
    const { method = "GET", data, params, isMultipart = false } = options;

    const headers: Record<string, string> = {};
    if (isMultipart) {
      headers["Content-Type"] = "multipart/form-data";
    }

    const response = await axiosInstance.request<ApiResponse<T>>({
      url: endpoint,
      method,
      data,
      params,
      headers,
    });

    if (!response) throw new Error("No response from server");

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error(response.data.error?.message || "Unknown API error");
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Unknown error occurred during API request");
    }
  }
}
