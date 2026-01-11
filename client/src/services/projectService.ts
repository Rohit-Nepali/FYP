import axios, { AxiosError } from "axios";
import { config } from "../config/environment";
import { getStoredTokens } from "./authService";

const API_BASE_URL = config.API_BASE_URL;

export interface Project {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  createdAt: string;
  members?: any[];
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

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const tokens = await getStoredTokens();
    if (tokens.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
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

export async function getAllProjects(): Promise<Project[]> {
  const response = await axiosInstance.get<ApiResponse<Project[]>>("/projects");
  if (response.data && (response.data as ApiSuccess<Project[]>).success) {
    return (response.data as ApiSuccess<Project[]>).data;
  }
  throw new Error("Failed to fetch projects");
}

export async function getProjectById(projectId: string): Promise<Project & { tasks?: any[] }> {
  const response = await axiosInstance.get<ApiResponse<any>>(`/projects/${projectId}`);
  if (response.data && (response.data as ApiSuccess<any>).success) {
    return (response.data as ApiSuccess<any>).data;
  }
  throw new Error("Failed to fetch project");
}

export async function createProject(payload: { title: string; description?: string; }): Promise<Project> {
  const response = await axiosInstance.post<ApiResponse<Project>>("/projects", payload);
  if (response.data && (response.data as ApiSuccess<Project>).success) {
    return (response.data as ApiSuccess<Project>).data;
  }
  throw new Error("Failed to create project");
}

export async function inviteProjectMember(projectId: string, email: string, role: string = "member"): Promise<any> {
  const response = await axiosInstance.post<ApiResponse<any>>(`/projects/${projectId}/invites`, { email, role });
  if (response.data && (response.data as ApiSuccess<any>).success) {
    return (response.data as ApiSuccess<any>).data;
  }
  throw new Error("Failed to invite member");
}

export async function removeProjectMember(projectId: string, memberId: string): Promise<Project> {
  const response = await axiosInstance.delete<ApiResponse<Project>>(`/projects/${projectId}/members/${memberId}`);
  if (response.data && (response.data as ApiSuccess<Project>).success) {
    return (response.data as ApiSuccess<Project>).data;
  }
  throw new Error("Failed to remove member");
}