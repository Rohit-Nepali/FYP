import { makeRequest } from "./apiClient";
import { ActivityResponse } from "../types/activity";

// ─── Public API Functions ────────────────────────────────────────────────────

export const getProjectActivities = async (
  projectId: string,
  page: number = 1,
  limit: number = 10
): Promise<ActivityResponse> => {
  return makeRequest<ActivityResponse>(`/projects/${projectId}/activities`, {
    method: "GET",
    params: { page, limit },
  });
};
