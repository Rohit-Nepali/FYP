import axios from "axios";
import { config } from "../config/environment";
import { getStoredTokens } from "./authService";
import { ActivityResponse } from "../types/activity";

const API_BASE_URL = config.API_BASE_URL;

const getAuthHeaders = async () => {
  const tokens = await getStoredTokens();
  if (!tokens?.accessToken) {
    throw new Error("No access token available");
  }
  return {
    Authorization: `Bearer ${tokens.accessToken}`,
  };
};

export const getProjectActivities = async (
  projectId: string,
  page: number = 1,
  limit: number = 10
): Promise<ActivityResponse> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${API_BASE_URL}/projects/${projectId}/activities`,
      {
        headers,
        params: { page, limit },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        error.response.data?.message || "Failed to fetch activities"
      );
    }
    throw error;
  }
};
