import { makeRequest, apiClient, ApiResponse, ApiSuccess } from "./apiClient";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Public API Functions ────────────────────────────────────────────────────

export async function getProjectAttachments(projectId: string): Promise<Attachment[]> {
  return makeRequest<Attachment[]>(`/projects/${projectId}/attachments`, {
    method: "GET",
  });
}

export async function createProjectAttachment(
  projectId: string,
  file: File | FormData | Blob
): Promise<Attachment> {
  let formData: FormData;

  // Handle different input types
  if (file instanceof FormData) {
    // React Native: FormData is already prepared, use it directly
    formData = file;
  } else {
    // Web or Blob: create new FormData
    formData = new FormData();
    formData.append("file", file);
  }

  return makeRequest<Attachment>(`/projects/${projectId}/attachments`, {
    method: "POST",
    data: formData,
    isMultipart: true,
  });
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  return makeRequest<void>(`/attachments/${attachmentId}`, {
    method: "DELETE",
  });
}

// ─── Helper Functions ────────────────────────────────────────────────────────

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
