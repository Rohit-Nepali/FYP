import axios, { AxiosError } from "axios";
import { config } from "../config/environment";
import { getStoredTokens } from "./authService";

const API_BASE_URL = config.API_BASE_URL;

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string | null;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
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
  meta?: any;
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
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
    if (error.response) {
      const errorData = error.response.data;
      if (errorData && !errorData.success) {
        return Promise.reject(new Error(errorData.error?.message));
      }
      return Promise.reject(new Error(error.response.statusText));
    } else if (error.request) {
      return Promise.reject(new Error("Network error occurred"));
    } else {
      return Promise.reject(new Error(error.message));
    }
  }
);

// Private helper function
async function makeRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    data?: any;
    params?: any;
  } = {}
): Promise<T> {
  try {
    const { method = "GET", data, params } = options;

    const response = await axiosInstance.request<ApiResponse<T>>({
      url: endpoint,
      method,
      data,
      params,
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
export async function createTask(taskData: CreateTaskData): Promise<Task> {
  return makeRequest<Task>("/tasks", {
    method: "POST",
    data: taskData,
  });
}

export async function getAllTasks(filters?: TaskFilters): Promise<{
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const response = await axiosInstance.get<ApiResponse<Task[]>>("/tasks", {
    params: filters,
  });

  if (response.data.success) {
    return {
      tasks: response.data.data as Task[],
      pagination: response.data.meta?.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    };
  }
  throw new Error("Failed to fetch tasks");
}

export async function getTaskById(taskId: string): Promise<Task> {
  return makeRequest<Task>(`/tasks/${taskId}`, {
    method: "GET",
  });
}

export async function updateTask(
  taskId: string,
  updateData: UpdateTaskData
): Promise<Task> {
  return makeRequest<Task>(`/tasks/${taskId}`, {
    method: "PUT",
    data: updateData,
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  return makeRequest<void>(`/tasks/${taskId}`, {
    method: "DELETE",
  });
}
