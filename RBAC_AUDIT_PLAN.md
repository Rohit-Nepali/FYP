Complete Permission Matrix (Simplified)
Project-Level Actions
Action	Owner	Member
View project	✅	✅
Edit project (name, description)	✅	❌
Delete project	✅	❌
Invite/Add members	✅	❌
Remove members	✅	❌
View members list	✅	✅
Leave project	❌	✅
Create statuses	✅	❌
Edit/Delete statuses	✅	❌
Create priorities	✅	❌
Edit/Delete priorities	✅	❌


Task-Level Actions (Project Tasks)
Action	Owner	Member (Creator)	Member (Assignee)	Member (Neither)
View task	✅	✅	✅	✅
Create task	✅	✅	✅	✅
Edit title	✅	✅	❌	❌
Edit description	✅	✅	❌	❌
Edit priority	✅	✅	❌	❌
Edit due date	✅	✅	❌	❌
Change assignee	✅	✅	❌	❌
Change status	✅	✅	✅	❌
Mark complete	✅	✅	✅	❌
Delete task	✅	✅	❌	❌
Add comment	✅	✅	✅	✅
Edit own comment	✅	✅	✅	✅
Delete own comment	✅	✅	✅	✅
Delete others' comment	✅	❌	❌	❌
Upload attachment	✅	✅	✅	✅
Delete own attachment	✅	✅	✅	✅
Delete others' attachment	✅	❌	❌	❌


Standalone Tasks
Action	Creator	Anyone Else
View	✅	❌
Edit	✅	❌
Delete	✅	❌
Everything	✅	❌



// src/utils/permissions.ts

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
  canDeleteAnyAttachment: boolean;
}

export interface ProjectPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  canManageStatuses: boolean;
  canManagePriorities: boolean;
  canLeave: boolean;
}

interface User {
  id: string;
}

interface Task {
  creatorId: string;
  assigneeId?: string | null;
  projectId?: string | null;
  project?: {
    ownerId: string;
  } | null;
}

interface Project {
  ownerId: string;
}

/**
 * Get permissions for a task
 */
export function getTaskPermissions(
  task: Task,
  userId: string | undefined
): TaskPermissions {
  // No user = no permissions
  if (!userId) {
    return noTaskPermissions();
  }

  const isTaskCreator = task.creatorId === userId;
  const isTaskAssignee = task.assigneeId === userId;
  const isProjectOwner = task.project?.ownerId === userId;
  const isStandaloneTask = !task.projectId;

  // Standalone task: only creator has access
  if (isStandaloneTask) {
    if (isTaskCreator) {
      return fullTaskPermissions();
    }
    return noTaskPermissions();
  }

  // Project task permissions
  if (isProjectOwner) {
    // Owner has full access to all tasks
    return fullTaskPermissions();
  }

  if (isTaskCreator) {
    // Task creator can do everything except delete others' stuff
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
      canDeleteAnyAttachment: false, // Only own attachments
    };
  }

  if (isTaskAssignee) {
    // Assignee can only update status and mark complete
    return {
      canView: true,
      canEditTitle: false,
      canEditDescription: false,
      canEditStatus: true,
      canEditPriority: false,
      canEditDueDate: false,
      canAssign: false,
      canDelete: false,
      canMarkComplete: true,
      canComment: true,
      canUploadAttachment: true,
      canDeleteAnyAttachment: false,
    };
  }

  // Regular member (not creator, not assignee)
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
    canDeleteAnyAttachment: false,
  };
}

/**
 * Get permissions for a project
 */
export function getProjectPermissions(
  project: Project,
  userId: string | undefined
): ProjectPermissions {
  if (!userId) {
    return noProjectPermissions();
  }

  const isOwner = project.ownerId === userId;

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

  // Member
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

// Helper functions
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
    canDeleteAnyAttachment: true,
  };
}

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
    canDeleteAnyAttachment: false,
  };
}

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

// server/src/routes/project.router.js

import { Router } from 'express';
import { authenticateToken } from '#middleware/auth.middleware.js';
import { isProjectOwner, isProjectMember } from '#middleware/rbac.middleware.js';
import * as projectController from '#controllers/project.controller.js';

const router = Router();
router.use(authenticateToken);

// Anyone authenticated can create
router.post('/', projectController.createProject);

// Owner or member can view
router.get('/:id', isProjectMember, projectController.getProjectById);

// Owner only
router.patch('/:id', isProjectOwner, projectController.updateProject);
router.delete('/:id', isProjectOwner, projectController.deleteProject);

// Member management (owner only)
router.post('/:id/members', isProjectOwner, projectController.addMember);
router.delete('/:id/members/:memberId', isProjectOwner, projectController.removeMember);
router.post('/:id/invites', isProjectOwner, projectController.createInvite);

// Leave project (member only, not owner)
router.post('/:id/leave', isProjectMember, projectController.leaveProject);

// View members (owner or member)
router.get('/:id/members', isProjectMember, projectController.getMembers);

export default router;

4.Frontend Usage

// In TaskDetailModal.tsx

import { useAuth } from '@/src/contexts/AuthContext';
import { getTaskPermissions } from '@/src/utils/permissions';

export default function TaskDetailModal({ task, project, ... }) {
  const { user } = useAuth();
  
  // Compute permissions
  const permissions = getTaskPermissions(
    {
      creatorId: task.creatorId,
      assigneeId: task.assigneeId,
      projectId: task.projectId,
      project: project ? { ownerId: project.ownerId } : null,
    },
    user?.id
  );

  return (
    <>
      {/* Title - only show edit if allowed */}
      {permissions.canEditTitle ? (
        <EditableTitle value={task.title} onSave={handleUpdateTitle} />
      ) : (
        <Text>{task.title}</Text>
      )}

      {/* Status - show if can edit status */}
      <StatusChips
        statuses={statuses}
        selectedId={task.statusId}
        onSelect={permissions.canEditStatus ? handleUpdateStatus : undefined}
        disabled={!permissions.canEditStatus}
      />

      {/* Delete button - only if allowed */}
      {permissions.canDelete && (
        <TouchableOpacity onPress={handleDelete}>
          <Text>Delete Task</Text>
        </TouchableOpacity>
      )}

      {/* Assignee picker - only if allowed */}
      {permissions.canAssign && (
        <AssigneePicker ... />
      )}
    </>
  );
}


// In Project Settings/Menu

import { getProjectPermissions } from '@/src/utils/permissions';

const permissions = getProjectPermissions(project, user?.id);

return (
  <View>
    {/* Always visible */}
    <MenuItem label="Members" onPress={...} />

    {/* Owner only */}
    {permissions.canEdit && (
      <MenuItem label="Edit Project" onPress={...} />
    )}

    {permissions.canManageStatuses && (
      <MenuItem label="Manage Statuses" onPress={...} />
    )}

    {permissions.canManagePriorities && (
      <MenuItem label="Manage Priorities" onPress={...} />
    )}

    {permissions.canManageMembers && (
      <MenuItem label="Invite Members" onPress={...} />
    )}

    {permissions.canDelete && (
      <MenuItem label="Delete Project" onPress={...} danger />
    )}

    {/* Member only (not owner) */}
    {permissions.canLeave && (
      <MenuItem label="Leave Project" onPress={...} danger />
    )}
  </View>
);


Quick Reference Card
┌────────────────────────────────────────────────────┐
│              PERMISSION QUICK REFERENCE            │
├────────────────────────────────────────────────────┤
│                                                    │
│  PROJECT OWNER (Creator):                          │
│  ✅ Everything                                     │
│                                                    │
│  PROJECT MEMBER:                                   │
│  ✅ View all                                       │
│  ✅ Create tasks                                   │
│  ✅ Edit/Delete OWN tasks                          │
│  ✅ Update status on ASSIGNED tasks                │
│  ✅ Comment on any task                            │
│  ✅ Upload attachments                             │
│  ✅ Delete OWN attachments                         │
│  ✅ Leave project                                  │
│  ❌ Edit/Delete project                            │
│  ❌ Manage members                                 │
│  ❌ Manage statuses/priorities                     │
│  ❌ Edit/Delete others' tasks                      │
│                                                    │
│  STANDALONE TASK:                                  │
│  Creator = Full access, No one else can see        │
│                                                    │
└────────────────────────────────────────────────────┘