import { apiClient, ApiResponse, ApiSuccess } from "./apiClient";
import { ActivityResponse } from "../types/activity";

// ─── Public API Functions ────────────────────────────────────────────────────

export const getProjectActivities = async (
  projectId: string,
  page: number = 1,
  limit: number = 10
): Promise<ActivityResponse> => {
  const response = await apiClient.get<ApiResponse<any>>(
    `/projects/${projectId}/activities`,
    {
      params: { page, limit },
    }
  );

  if (!response.data.success) {
    throw new Error("Failed to fetch project activities");
  }

  const successResponse = response.data as ApiSuccess<any>;
  const activities = Array.isArray(successResponse.data) ? successResponse.data : [];
  const pagination = successResponse.meta || {};

  return {
    data: activities,
    pagination: {
      page: pagination.page ?? page,
      limit: pagination.limit ?? limit,
      total: pagination.total ?? activities.length,
      hasMore: pagination.hasMore ?? false,
    },
  };
};
