import { makeRequest } from "./apiClient";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Status {
  id: string;
  name: string;
  color?: string;
  order: number;
  projectId: string;
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

// ─── Public API Functions ────────────────────────────────────────────────────

export const createStatus = async (projectId: string, data: CreateStatusData): Promise<Status> => {
  return makeRequest<Status>(`/status/projects/${projectId}/statuses`, {
    method: "POST",
    data,
  });
};

export const getAllStatuses = async (projectId?: string): Promise<Status[]> => {
  const url = projectId
    ? `/status/projects/${projectId}/statuses`
    : `/status`;

  return makeRequest<Status[]>(url, { method: "GET" });
};

export const getStatusById = async (projectId: string, id: string): Promise<Status> => {
  return makeRequest<Status>(`/status/projects/${projectId}/statuses/${id}`, {
    method: "GET",
  });
};

export const updateStatus = async (
  projectId: string,
  id: string,
  data: UpdateStatusData
): Promise<Status> => {
  return makeRequest<Status>(`/status/projects/${projectId}/statuses/${id}`, {
    method: "PUT",
    data,
  });
};

export const deleteStatus = async (projectId: string, id: string): Promise<void> => {
  return makeRequest<void>(`/status/projects/${projectId}/statuses/${id}`, {
    method: "DELETE",
  });
};
