import { makeRequest } from "./apiClient";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    profileImage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentData {
  taskId: string;
  content: string;
}

// ─── Public API Functions ────────────────────────────────────────────────────

export async function createComment(commentData: CreateCommentData): Promise<Comment> {
  return makeRequest<Comment>("/comments", {
    method: "POST",
    data: commentData,
  });
}

export async function getCommentsByTask(taskId: string): Promise<Comment[]> {
  return makeRequest<Comment[]>(`/comments/task/${taskId}`, {
    method: "GET",
  });
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<Comment> {
  return makeRequest<Comment>(`/comments/${commentId}`, {
    method: "PUT",
    data: { content },
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  return makeRequest<void>(`/comments/${commentId}`, {
    method: "DELETE",
  });
}