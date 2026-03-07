import { makeRequest } from "./apiClient";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Public API Functions ────────────────────────────────────────────────────

export const createPriority = async (
  projectId: string,
  data: CreatePriorityData
): Promise<Priority> => {
  return makeRequest<Priority>(`/priorities/projects/${projectId}/priorities`, {
    method: "POST",
    data,
  });
};

export const getAllPriorities = async (projectId?: string): Promise<Priority[]> => {
  const url = projectId
    ? `/priorities/projects/${projectId}/priorities`
    : `/priorities`;

  return makeRequest<Priority[]>(url, { method: "GET" });
};

export const getPriorityById = async (projectId: string, id: string): Promise<Priority> => {
  return makeRequest<Priority>(`/priorities/projects/${projectId}/priorities/${id}`, {
    method: "GET",
  });
};

export const updatePriority = async (
  projectId: string,
  id: string,
  data: UpdatePriorityData
): Promise<Priority> => {
  return makeRequest<Priority>(`/priorities/projects/${projectId}/priorities/${id}`, {
    method: "PUT",
    data,
  });
};

export const deletePriority = async (projectId: string, id: string): Promise<void> => {
  return makeRequest<void>(`/priorities/projects/${projectId}/priorities/${id}`, {
    method: "DELETE",
  });
};
