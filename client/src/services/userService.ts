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
