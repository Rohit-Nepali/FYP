import axios from "axios";
import { config } from "../config/environment";
import { getStoredTokens } from "./authService";

const API_BASE_URL = config.API_BASE_URL;

export interface Status {
  id: string;
  name: string;
  color?: string;
  order: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStatusData {
  name: string;
  color?: string;
  order?: number;
}

export interface UpdateStatusData {
  name?: string;
  color?: string;
  order?: number;
}

const getAuthHeaders = async () => {
  const tokens = await getStoredTokens();
  if (!tokens?.accessToken) {
    throw new Error("No access token available");
  }
  return {
    Authorization: `Bearer ${tokens.accessToken}`,
  };
};

export const createStatus = async (data: CreateStatusData): Promise<Status> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/statuses`, data, {
      headers,
    });
    return response.data.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        error.response.data?.message || "Failed to create status"
      );
    }
    throw error;
  }
};

export const getAllStatuses = async (): Promise<Status[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/statuses`, {
      headers,
    });
    return response.data.data || [];
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        error.response.data?.message || "Failed to fetch statuses"
      );
    }
    throw error;
  }
};

export const getStatusById = async (id: string): Promise<Status> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/statuses/${id}`, {
      headers,
    });
    return response.data.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.message || "Failed to fetch status");
    }
    throw error;
  }
};

export const updateStatus = async (
  id: string,
  data: UpdateStatusData
): Promise<Status> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.put(`${API_BASE_URL}/statuses/${id}`, data, {
      headers,
    });
    return response.data.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        error.response.data?.message || "Failed to update status"
      );
    }
    throw error;
  }
};

export const deleteStatus = async (id: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    await axios.delete(`${API_BASE_URL}/statuses/${id}`, {
      headers,
    });
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        error.response.data?.message || "Failed to delete status"
      );
    }
    throw error;
  }
};
