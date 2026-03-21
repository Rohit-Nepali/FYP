import axios, { AxiosInstance, AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { config } from "../config/environment";

// ─── Shared API Response Types ───────────────────────────────────────────────

export interface ApiError {
  success: false;
  error: {
    message: string;
    statusCode: number;
    details?: any;
  };
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: any;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Token Helpers ───────────────────────────────────────────────────────────

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

// ─── Single Axios Instance ──────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: config.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

type FailedQueueItem = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    if (token) {
      resolve(token);
      return;
    }

    reject(new Error("Failed to refresh session"));
  });

  failedQueue = [];
};

// ─── Request Interceptor — attach auth token ────────────────────────────────

apiClient.interceptors.request.use(
  async (cfg) => {
    const tokens = await getStoredTokens();
    if (tokens.accessToken) {
      cfg.headers = cfg.headers ?? {};
      (cfg.headers as any).Authorization = `Bearer ${tokens.accessToken}`;
    }
    return cfg;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Response Interceptor — normalize errors ────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest =
      (error.config as (typeof error.config & { _retry?: boolean })) || null;
    const statusCode = error.response?.status;
    const requestUrl = originalRequest?.url || "";
    const isRefreshRequest = requestUrl.includes("/auth/refresh-token");

    if (
      statusCode === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshRequest
    ) {
      const tokens = await getStoredTokens();
      if (!tokens.refreshToken) {
        await clearTokens();
        return Promise.reject(new Error("Session expired. Please sign in again."));
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newAccessToken) => {
            originalRequest.headers = originalRequest.headers ?? {};
            (originalRequest.headers as any).Authorization =
              `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          })
          .catch((queueError) => Promise.reject(queueError));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post<
          ApiResponse<{ accessToken: string; refreshToken: string }>
        >(
          `${config.API_BASE_URL}/auth/refresh-token`,
          { refreshToken: tokens.refreshToken },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
          }
        );

        if (!refreshResponse.data.success) {
          throw new Error(
            refreshResponse.data.error?.message || "Failed to refresh session"
          );
        }

        const { accessToken, refreshToken } = refreshResponse.data.data;
        await storeTokens(accessToken, refreshToken);
        processQueue(null, accessToken);

        originalRequest.headers = originalRequest.headers ?? {};
        (originalRequest.headers as any).Authorization = `Bearer ${accessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        await clearTokens();
        processQueue(refreshError, null);

        const errorMessage =
          refreshError instanceof Error
            ? refreshError.message
            : "Session expired. Please sign in again.";

        return Promise.reject(new Error(errorMessage));
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response) {
      const errorData = error.response.data;
      if (errorData && !errorData.success) {
        return Promise.reject(new Error(errorData.error?.message));
      }
      return Promise.reject(new Error(error.response.statusText));
    } else if (error.request) {
      return Promise.reject(new Error("Network error occurred"));
    }
    return Promise.reject(new Error(error.message));
  }
);

// ─── Centralized Request Helper ─────────────────────────────────────────────

export async function makeRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    data?: any;
    params?: any;
    isMultipart?: boolean;
  } = {}
): Promise<T> {
  const { method = "GET", data, params, isMultipart = false } = options;

  const headers: Record<string, string> = {};
  if (isMultipart) {
    headers["Content-Type"] = "multipart/form-data";
  }

  const response = await apiClient.request<ApiResponse<T>>({
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
}

// Backward compatibility: export as axiosInstance for any existing imports
export { apiClient as axiosInstance };
