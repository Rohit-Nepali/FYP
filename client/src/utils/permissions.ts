/**
 * RBAC Permission Utility Module (Frontend)
 * Centralized permission logic for Taskora UI
 * 
 * This module provides functions to compute user permissions for tasks and projects
 * in React components. Used for conditional rendering of UI elements.
 */

/**
 * Task-level permissions
 */
export interface TaskPermissions {
  canView: boolean;
  canEditTitle: boolean;
  canEditDescription: boolean;
  canEditStatus: boolean;
  canEditPriority: boolean;
  canEditDueDate: boolean;
  canAssign: boolean;
  canDelete: boolean;
  canMarkComplete: boolean;
  canComment: boolean;
  canUploadAttachment: boolean;
  canDeleteOwnAttachment: boolean;
  canDeleteAnyAttachment: boolean;
}

/**
 * Project-level permissions
 */
export interface ProjectPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  canManageStatuses: boolean;
  canManagePriorities: boolean;
  canLeave: boolean;
}

/**
 * Task data structure (minimal for permission calculations)
 */
export interface TaskData {
  creatorId: string;
  assigneeId?: string | null;
  projectId?: string | null;
  project?: {
    ownerId: string;
    members?: Array<{ userId: string }>;
  } | null;
}

/**
 * Project data structure (minimal for permission calculations)
 */
export interface ProjectData {
  ownerId: string;
  members?: Array<{ userId: string }>;
}

/**
 * Get task permissions for a given user
 * 
 * @param task - Task data with creator, assignee, project info
 * @param userId - ID of user to check permissions for
 * @returns TaskPermissions object with all permission flags
 */
export function getTaskPermissions(
  task: TaskData,
  userId?: string
): TaskPermissions {
  // No user = no permissions
  if (!userId) {
    return noTaskPermissions();
  }

  const isTaskCreator = task.creatorId === userId;
  const isTaskAssignee = task.assigneeId === userId;
  const isProjectOwner = task.project?.ownerId === userId;
  const isProjectMember = task.project?.members?.some(m => m.userId === userId) ?? false;
  const isStandaloneTask = !task.projectId;

  // Standalone task: only creator has full access
  if (isStandaloneTask) {
    if (isTaskCreator) {
      return fullTaskPermissions();
    }
    return noTaskPermissions();
  }

  // Project task permissions
  if (isProjectOwner) {
    return fullTaskPermissions();
  }

  if (isTaskCreator || isTaskAssignee || isProjectMember) {
    // Project members are view-only for task fields.
    return {
      canView: true,
      canEditTitle: false,
      canEditDescription: false,
      canEditStatus: false,
      canEditPriority: false,
      canEditDueDate: false,
      canAssign: false,
      canDelete: false,
      canMarkComplete: false,
      canComment: true,
      canUploadAttachment: true,
      canDeleteOwnAttachment: true,
      canDeleteAnyAttachment: false,
    };
  }

  // Non-member: no access
  return noTaskPermissions();
}

/**
 * Get project permissions for a given user
 * 
 * @param project - Project data with owner and member info
 * @param userId - ID of user to check permissions for
 * @returns ProjectPermissions object with all permission flags
 */
export function getProjectPermissions(
  project: ProjectData,
  userId?: string
): ProjectPermissions {
  if (!userId) {
    return noProjectPermissions();
  }

  const isOwner = project.ownerId === userId;
  const isMember = project.members?.some(m => m.userId === userId) ?? false;

  if (isOwner) {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canManageMembers: true,
      canManageStatuses: true,
      canManagePriorities: true,
      canLeave: false, // Owner cannot leave, must delete or transfer
    };
  }

  if (isMember) {
    return {
      canView: true,
      canEdit: false,
      canDelete: false,
      canManageMembers: false,
      canManageStatuses: false,
      canManagePriorities: false,
      canLeave: true,
    };
  }

  // Non-member
  return noProjectPermissions();
}

/**
 * Helper: Full task permissions (for owner/creator in standalone)
 */
function fullTaskPermissions(): TaskPermissions {
  return {
    canView: true,
    canEditTitle: true,
    canEditDescription: true,
    canEditStatus: true,
    canEditPriority: true,
    canEditDueDate: true,
    canAssign: true,
    canDelete: true,
    canMarkComplete: true,
    canComment: true,
    canUploadAttachment: true,
    canDeleteOwnAttachment: true,
    canDeleteAnyAttachment: true,
  };
}

/**
 * Helper: No task permissions
 */
function noTaskPermissions(): TaskPermissions {
  return {
    canView: false,
    canEditTitle: false,
    canEditDescription: false,
    canEditStatus: false,
    canEditPriority: false,
    canEditDueDate: false,
    canAssign: false,
    canDelete: false,
    canMarkComplete: false,
    canComment: false,
    canUploadAttachment: false,
    canDeleteOwnAttachment: false,
    canDeleteAnyAttachment: false,
  };
}

/**
 * Helper: No project permissions
 */
function noProjectPermissions(): ProjectPermissions {
  return {
    canView: false,
    canEdit: false,
    canDelete: false,
    canManageMembers: false,
    canManageStatuses: false,
    canManagePriorities: false,
    canLeave: false,
  };
}

/**
 * Check if user can access a specific attachment
 * 
 * @param attachment - Attachment data with uploadedBy (user who uploaded)
 * @param taskPermissions - Task permissions for the user
 * @param userId - Current user ID
 * @returns boolean - Can user delete this attachment?
 */
export function canDeleteAttachment(
  attachment: { uploadedBy: string },
  taskPermissions: TaskPermissions,
  userId: string
): boolean {
  // Owner of attachment can always delete their own
  if (attachment.uploadedBy === userId && taskPermissions.canDeleteOwnAttachment) {
    return true;
  }

  // Anyone with canDeleteAnyAttachment permission can delete any
  return taskPermissions.canDeleteAnyAttachment;
}

/**
 * Export permission checking utilities
 */
export const PermissionUtils = {
  getTaskPermissions,
  getProjectPermissions,
  canDeleteAttachment,
};
