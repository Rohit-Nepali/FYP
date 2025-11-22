import axios, { AxiosError } from "axios";
import { config } from "../config/environment";
import { getStoredTokens } from "./authService";
import {
  Group,
  CreateGroupData,
  UpdateGroupData,
  AddMemberData,
} from "../types";

const API_BASE_URL = config.API_BASE_URL;

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
export async function createGroup(groupData: CreateGroupData): Promise<Group> {
  return makeRequest<Group>("/groups", {
    method: "POST",
    data: groupData,
  });
}

export async function getAllGroups(): Promise<Group[]> {
  return makeRequest<Group[]>("/groups", {
    method: "GET",
  });
}

export async function getGroupById(groupId: string): Promise<Group> {
  return makeRequest<Group>(`/groups/${groupId}`, {
    method: "GET",
  });
}

export async function updateGroup(
  groupId: string,
  updateData: UpdateGroupData
): Promise<Group> {
  return makeRequest<Group>(`/groups/${groupId}`, {
    method: "PUT",
    data: updateData,
  });
}

export async function deleteGroup(groupId: string): Promise<void> {
  return makeRequest<void>(`/groups/${groupId}`, {
    method: "DELETE",
  });
}

export async function addMember(
  groupId: string,
  memberData: AddMemberData
): Promise<Group> {
  return makeRequest<Group>(`/groups/${groupId}/members`, {
    method: "POST",
    data: memberData,
  });
}

export async function removeMember(
  groupId: string,
  memberId: string
): Promise<Group> {
  return makeRequest<Group>(`/groups/${groupId}/members/${memberId}`, {
    method: "DELETE",
  });
}
