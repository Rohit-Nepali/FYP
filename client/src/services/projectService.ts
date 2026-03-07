import { makeRequest, apiClient, ApiResponse, ApiSuccess } from "./apiClient";

// ─── Types ───────────────────────────────────────────────────────────────────

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

export interface ProjectStatistics {
  overview: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    unassignedTasks: number;
    tasksDueThisWeek: number;
    completionPercentage: number;
  };
  statusBreakdown: Array<{
    name: string;
    color: string;
    count: number;
  }>;
  priorityBreakdown: Array<{
    name: string;
    color: string;
    count: number;
  }>;
  assigneeBreakdown: Array<{
    assignee: {
      id: string;
      name: string;
      email: string;
      profileImage?: string;
    };
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
  }>;
}

// ─── Public API Functions ────────────────────────────────────────────────────

export async function getAllProjects(): Promise<Project[]> {
  return makeRequest<Project[]>("/projects", { method: "GET" });
}

export async function getProjectById(projectId: string): Promise<Project & { tasks?: any[] }> {
  return makeRequest<Project & { tasks?: any[] }>(`/projects/${projectId}`, { method: "GET" });
}

export async function createProject(payload: { title: string; description?: string }): Promise<Project> {
  return makeRequest<Project>("/projects", {
    method: "POST",
    data: payload,
  });
}

export async function inviteProjectMember(projectId: string, email: string, role: string = "member"): Promise<any> {
  return makeRequest<any>(`/projects/${projectId}/invites`, {
    method: "POST",
    data: { email, role },
  });
}

export async function removeProjectMember(projectId: string, memberId: string): Promise<Project> {
  return makeRequest<Project>(`/projects/${projectId}/members/${memberId}`, {
    method: "DELETE",
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  return makeRequest<void>(`/projects/${projectId}`, {
    method: "DELETE",
  });
}

export async function getProjectStatistics(projectId: string): Promise<ProjectStatistics> {
  return makeRequest<ProjectStatistics>(`/projects/${projectId}/statistics`, {
    method: "GET",
  });
}