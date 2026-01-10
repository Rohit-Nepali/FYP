import axios from "axios";
import { config } from "../config/environment";
import { getStoredTokens } from "./authService";

const API_BASE_URL = config.API_BASE_URL;

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    profileImage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentData {
  taskId: string;
  content: string;
}

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
  (error) => {
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

    const response = await axiosInstance.request<{
      success: boolean;
      message: string;
      data: T;
      error?: { message: string };
    }>({
      url: endpoint,
      method,
      data,
      params,
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
      throw new Error("Unknown network error");
    }
  }
}

// Public API functions
export async function createComment(commentData: CreateCommentData): Promise<Comment> {
  return makeRequest<Comment>("/comments", {
    method: "POST",
    data: commentData,
  });
}

export async function getCommentsByTask(taskId: string): Promise<Comment[]> {
  return makeRequest<Comment[]>(`/comments/task/${taskId}`, {
    method: "GET",
  });
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<Comment> {
  return makeRequest<Comment>(`/comments/${commentId}`, {
    method: "PUT",
    data: { content },
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  return makeRequest<void>(`/comments/${commentId}`, {
    method: "DELETE",
  });
}