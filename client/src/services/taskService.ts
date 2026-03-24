import { makeRequest, apiClient, ApiResponse, ApiSuccess } from "./apiClient";
import { Status } from "./statusService";
import { Priority } from "./priorityService";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  statusId?: string | null;
  status?: Status | null;
  priorityId?: string | null;
  priority?: Priority | null;
  dueDate?: string;
  creatorId: string;
  projectId?: string | null;
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  attachments?: Array<{
    id: string;
    taskId: string;
    projectId: string | null;
    fileName: string;
    fileType: string | null;
    fileSize: number | null;
    fileUrl: string;
    uploadedBy: string;
    createdAt: string;
    uploader?: {
      id: string;
      name: string;
      email: string;
      profileImage: string | null;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  isCompleted?: boolean;
  statusId?: string;
  priorityId?: string;
  dueDate?: string;
  projectId?: string;
  assigneeId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  isCompleted?: boolean;
  statusId?: string;
  priorityId?: string;
  dueDate?: string | null;
  assigneeId?: string;
  projectId?: string;
}

export interface TaskFilters {
  statusId?: string;
  priorityId?: string;
  page?: number;
  limit?: number;
}

// ─── Public API Functions ────────────────────────────────────────────────────

export async function createTask(taskData: CreateTaskData): Promise<Task> {
  return makeRequest<Task>("/tasks", {
    method: "POST",
    data: taskData,
  });
}

export async function getAllTasks(filters?: TaskFilters): Promise<{
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const response = await apiClient.get<ApiResponse<Task[]>>("/tasks", {
    params: filters,
  });

  if (response.data.success) {
    return {
      tasks: response.data.data as Task[],
      pagination: (response.data as ApiSuccess<Task[]>).meta?.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    };
  }
  throw new Error("Failed to fetch tasks");
}

export async function getTaskById(taskId: string): Promise<Task> {
  return makeRequest<Task>(`/tasks/${taskId}`, {
    method: "GET",
  });
}

export async function updateTask(
  taskId: string,
  updateData: UpdateTaskData
): Promise<Task> {
  return makeRequest<Task>(`/tasks/${taskId}`, {
    method: "PATCH",
    data: updateData,
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  return makeRequest<void>(`/tasks/${taskId}`, {
    method: "DELETE",
  });
}

export async function getGroupTasks(groupId: string): Promise<Task[]> {
  return makeRequest<Task[]>(`/tasks/group/${groupId}`, {
    method: "GET",
  });
}

export async function uploadAttachments(
  taskId: string,
  files: {
    uri: string;
    name: string;
    mimeType?: string;
  }[]
): Promise<void> {
  for (const file of files) {
    const formData = new FormData();

    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || "application/octet-stream",
    } as any);

    await makeRequest<void>(`/tasks/${taskId}/attachments`, {
      method: "POST",
      data: formData,
      isMultipart: true,
    });
  }
}

export async function deleteTaskAttachment(taskId: string, attachmentId: string): Promise<void> {
  return makeRequest<void>(`/tasks/${taskId}/attachments/${attachmentId}`, {
    method: "DELETE",
  });
}
