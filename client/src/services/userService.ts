import axios, { AxiosError } from "axios";
import { config } from "../config/environment";
import { getStoredTokens } from "./authService";

const API_BASE_URL = config.API_BASE_URL;

export interface UserLite {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

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

export async function searchUsers(query: string): Promise<UserLite[]> {
  try {
    const response = await axiosInstance.get<ApiSuccess<UserLite[]>>(
      `/users?search=${query}`
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

export async function addProjectMembers(
  projectId: string,
  userIds: string[]
): Promise<any> {
  try {
    console.log("Adding members to project:", projectId);

    for (const userId of userIds) {
      await axiosInstance.post(`/projects/${projectId}/members`, {
        memberId: userId,
        role: "member",
      });
    }

    return true;
  } catch (error) {
    throw error;
  }
}

export async function removeProjectMember(
  projectId: string,
  memberId: string
): Promise<any> {
  try {
    console.log("Removing member from project:", projectId);
    await axiosInstance.delete(`/projects/${projectId}/members/${memberId}`);
    return true;
  } catch (error) {
    throw error;
  }
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  profileImage?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  profileImage?: string;
  createdAt: string;
  googleId?: string;
}

export async function updateProfile(
  data: UpdateProfileData
): Promise<UserProfile> {
  try {
    const response = await axiosInstance.put<ApiSuccess<UserProfile>>(
      `/users/profile`,
      data
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

export async function uploadAvatar(file: {
  uri: string;
  name: string;
  type?: string;
}): Promise<UserProfile> {
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type || "image/jpeg",
  } as any);

  // Create a new axios call here so we can override the Content-Type
  const tokens = await getStoredTokens();

  const response = await axios.post<ApiSuccess<UserProfile>>(
    `${API_BASE_URL}/users/profile/avatar`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        ...(tokens.accessToken
          ? { Authorization: `Bearer ${tokens.accessToken}` }
          : {}),
      },
      timeout: 10000,
    }
  );

  return response.data.data;
}
