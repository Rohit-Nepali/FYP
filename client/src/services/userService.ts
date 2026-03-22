import { makeRequest, apiClient, ApiSuccess } from "./apiClient";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserLite {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  profileImage?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  profileImage?: string;
  createdAt: string;
  googleId?: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any> | null;
  createdAt: string;
  readAt?: string | null;
}

// ─── Public API Functions ────────────────────────────────────────────────────

export async function searchUsers(query: string): Promise<UserLite[]> {
  return makeRequest<UserLite[]>(`/users`, {
    method: "GET",
    params: { search: query },
  });
}

export async function addProjectMembers(
  projectId: string,
  userIds: string[]
): Promise<any> {
  for (const userId of userIds) {
    await makeRequest(`/projects/${projectId}/members`, {
      method: "POST",
      data: {
        memberId: userId,
        role: "member",
      },
    });
  }
  return true;
}

export async function removeProjectMember(
  projectId: string,
  memberId: string
): Promise<any> {
  await makeRequest(`/projects/${projectId}/members/${memberId}`, {
    method: "DELETE",
  });
  return true;
}

export async function updateProfile(
  data: UpdateProfileData
): Promise<UserProfile> {
  return makeRequest<UserProfile>(`/users/profile`, {
    method: "PUT",
    data,
  });
}

export async function uploadAvatar(file: {
  uri: string;
  name: string;
  type?: string;
}): Promise<UserProfile> {
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type || "image/jpeg",
  } as any);

  return makeRequest<UserProfile>(`/users/profile/avatar`, {
    method: "POST",
    data: formData,
    isMultipart: true,
  });
}

export async function getNotifications(unreadOnly = false): Promise<InAppNotification[]> {
  return makeRequest<InAppNotification[]>(`/users/notifications`, {
    method: "GET",
    params: { unreadOnly },
  });
}

export async function getUnreadNotificationCount(): Promise<number> {
  const data = await makeRequest<{ unreadCount: number }>(`/users/notifications/unread-count`, {
    method: "GET",
  });
  return data.unreadCount;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await makeRequest<void>(`/users/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await makeRequest<void>(`/users/notifications/read-all`, {
    method: "PATCH",
  });
}
