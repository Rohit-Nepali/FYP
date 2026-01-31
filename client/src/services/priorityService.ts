import axios from "axios";
import { config } from "../config/environment";
import { getStoredTokens } from "./authService";

const API_BASE_URL = config.API_BASE_URL;

export interface Priority {
  id: string;
  name: string;
  color?: string;
  order: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePriorityData {
  name: string;
  color?: string;
  order?: number;
}

export interface UpdatePriorityData {
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

export const createPriority = async (
  projectId: string,
  data: CreatePriorityData
): Promise<Priority> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/priorities/projects/${projectId}/priorities`, data, {
      headers,
    });
    return response.data.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        error.response.data?.message || "Failed to create priority"
      );
    }
    throw error;
  }
};

export const getAllPriorities = async (projectId?: string): Promise<Priority[]> => {
  try {
    const headers = await getAuthHeaders();
    let url: string;
    
    if (projectId) {
      url = `${API_BASE_URL}/priorities/projects/${projectId}/priorities`;
    } else {
      url = `${API_BASE_URL}/priorities`;
    }
    
    const response = await axios.get(url, {
      headers,
    });
    return response.data.data || [];
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        error.response.data?.message || "Failed to fetch priorities"
      );
    }
    throw error;
  }
};

export const getPriorityById = async (projectId: string, id: string): Promise<Priority> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/priorities/projects/${projectId}/priorities/${id}`, {
      headers,
    });
    return response.data.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        error.response.data?.message || "Failed to fetch priority"
      );
    }
    throw error;
  }
};

export const updatePriority = async (
  projectId: string,
  id: string,
  data: UpdatePriorityData
): Promise<Priority> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.put(`${API_BASE_URL}/priorities/projects/${projectId}/priorities/${id}`, data, {
      headers,
    });
    return response.data.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        error.response.data?.message || "Failed to update priority"
      );
    }
    throw error;
  }
};

export const deletePriority = async (projectId: string, id: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    await axios.delete(`${API_BASE_URL}/priorities/projects/${projectId}/priorities/${id}`, {
      headers,
    });
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        error.response.data?.message || "Failed to delete priority"
      );
    }
    throw error;
  }
};
