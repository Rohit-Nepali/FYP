export interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: User;
  createdAt: string;
  members: GroupMember[];
}

export interface GroupMember {
  id: string;
  user: User;
  role: "admin" | "member";
  joinedAt: string;
}

export interface CreateGroupData {
  name: string;
  description?: string;
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
}

export interface AddMemberData {
  memberId: string;
  role?: "admin" | "member";
}
