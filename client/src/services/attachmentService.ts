import axios, { AxiosError } from "axios";
import { config } from "../config/environment";
import { getStoredTokens } from "./authService";

const API_BASE_URL = config.API_BASE_URL;

export interface Attachment {
  id: string;
  taskId: string;
  projectId: string | null;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  fileUrl: string;
  uploadedBy: string;
  createdAt: string;
  task?: {
    id: string;
    title: string;
    projectId: string | null;
  };
  project?: {
    id: string;
    title: string;
  };
  uploader?: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  };
}

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

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const tokens = await getStoredTokens();
    if (tokens.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      const errorData = error.response.data;
      if (errorData && !errorData.success) {
        return Promise.reject(new Error(errorData.error?.message));
      }
      return Promise.reject(new Error(error.response.statusText));
    } else if (error.request) {
      return Promise.reject(new Error("Network error occurred"));
    }
    return Promise.reject(new Error(error.message));
  }
);

export async function getProjectAttachments(projectId: string): Promise<Attachment[]> {
  const response = await axiosInstance.get<ApiResponse<Attachment[]>>(`/projects/${projectId}/attachments`);
  if (response.data && (response.data as ApiSuccess<Attachment[]>).success) {
    return (response.data as ApiSuccess<Attachment[]>).data;
  }
  throw new Error("Failed to fetch attachments");
}

export async function createProjectAttachment(
  projectId: string,
  file: File
): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post<ApiResponse<Attachment>>(
    `/projects/${projectId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  if (response.data && (response.data as ApiSuccess<Attachment>).success) {
    return (response.data as ApiSuccess<Attachment>).data;
  }
  throw new Error("Failed to upload attachment");
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  // First get the attachment to find the projectId
  // Since we don't have a single attachment endpoint, we'll delete via project
  // This is a workaround - in a real app, you'd have a direct endpoint
  const response = await axiosInstance.delete<ApiResponse<void>>(`/attachments/${attachmentId}`);
  if (response.data && !(response.data as ApiSuccess<void>).success) {
    throw new Error("Failed to delete attachment");
  }
}

// Helper function to determine attachment type category
export function getAttachmentType(fileType: string | null): "image" | "document" | "other" {
  if (!fileType) return "other";
  
  if (fileType.startsWith("image/")) return "image";
  if (
    fileType.includes("pdf") ||
    fileType.includes("document") ||
    fileType.includes("text") ||
    fileType.includes("spreadsheet") ||
    fileType.includes("presentation")
  ) {
    return "document";
  }
  return "other";
}

// Helper function to format file size
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown";
  
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
