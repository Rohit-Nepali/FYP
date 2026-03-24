# Taskora RBAC Implementation Roadmap

**Status**: Starting implementation
**Date**: March 25, 2026
**Goal**: Transform the Taskora codebase from scattered authorization checks to a unified, secure RBAC system

---

## Executive Summary

The codebase has **basic authentication** (JWT) but **fragmented authorization**. This roadmap repairs critical security gaps, enforces the permission matrix from RBAC_AUDIT_PLAN.md, and establishes a reusable permission layer.

**Critical Risk**: Two high-severity gaps exist:
1. ⚠️ Attachment upload accepts any authenticated user (bypasses project membership)
2. ⚠️ Comments are readable by any authenticated user (data leak)

**Timeline**: 4 phases, ~6-8 hours total

---

## Current State Assessment

### What's Working ✅
- JWT authentication functional across all routes
- Task creator/assignee/owner checks implemented correctly
- Project membership validation in place
- Attachment delete permissions correct
- Comment create/update/delete authorization enforced

### What's Broken ❌
| Gap | Severity | Root Cause | Impact |
|-----|----------|-----------|---------|
| Attachment upload (no access check) | 🔴 HIGH | Missing task access validation in `attachment.controller.js:7-45` | Privilege escalation to any task |
| Comments read (no authorization) | 🔴 HIGH | Missing userId parameter in `comment.service.js:126` | Private comments readable by anyone |
| Status/Priority create (overly permissive) | 🟡 MED | Member check instead of owner-only in `status/priority.service.js:7-32` | Any team member can modify workflow |

### Current Authorization Patterns
- **Scattered**: ~13 service files contain authorization logic
- **Inconsistent**: Some use direct `project.ownerId === userId`, others use `.some()` membership checks
- **No central validation**: Each route/service does its own checks (duplicated logic)

---

## Implementation Phases

### Phase 1: Fix Critical Security Gaps (🔴 CRITICAL - Start First!)
**Goal**: Close the two high-severity authorization leaks  
**Estimated Time**: 1-2 hours  
**Risk**: LOW - isolated changes, no API contract changes  

#### 1.1 Fix Task Attachment Upload Authorization
**File**: `server/src/controllers/attachment.controller.js`  
**Problem**: POST `/tasks/:taskId/attachments` uploads file without validating task access  
**Current Code** (lines 7-45):
```javascript
export const uploadTaskAttachmentController = async (req, res) => {
  const { taskId } = req.params;
  const file = req.file;
  
  // ❌ MISSING: Validate user has access to task
  const attachment = await attachmentService.uploadTaskAttachment({
    taskId,
    userId: req.user.id,
    file,
  });
```

**Fix**: Add task access validation before upload
```javascript
// Get task + project context
const task = await prisma.task.findUnique({
  where: { id: taskId },
  include: { project: { select: { ownerId: true, members: true } } }
});

if (!task) throw new ApiError("Task not found", 404);

// Validate user access
const isOwner = task.project?.ownerId === req.user.id;
const isMember = task.project?.members?.some(m => m.userId === req.user.id);
const isCreator = task.creatorId === req.user.id;

if (!task.projectId && !isCreator) {
  throw new ApiError("Unauthorized", 403);
}
if (task.projectId && !isOwner && !isMember) {
  throw new ApiError("Not a project member", 403);
}
```

**Action Items**:
- [ ] Read current implementation in `attachment.controller.js`
- [ ] Add task + project fetch before `attachmentService` call
- [ ] Add access validation (owner/member/creator check)
- [ ] Test: Unauthorized user should get 403

---

#### 1.2 Fix Comment Read Authorization
**File**: `server/src/services/comment.service.js` + `server/src/controllers/comment.controller.js`  
**Problem**: GET `/comments/task/:taskId` returns all comments without user context  
**Current Code** (service line 126):
```javascript
const getCommentsByTask = async (taskId) => {
  // ❌ MISSING: userId parameter, no access check
  const comments = await prisma.comment.findMany({
    where: { taskId }
  });
```

**Current Code** (controller line 41):
```javascript
export const getCommentsByTaskController = async (req, res) => {
  const { taskId } = req.params;
  // ❌ NOT PASSING userId to service
  const comments = await commentService.getCommentsByTask(taskId);
```

**Fix**:  
1. Update service to accept + validate userId:
```javascript
const getCommentsByTask = async (taskId, userId) => {
  // Get task + project context
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { select: { ownerId: true, members: true } } }
  });
  
  if (!task) throw new ApiError("Task not found", 404);
  
  // Validate access (same as task attachment logic)
  const isOwner = task.project?.ownerId === userId;
  const isMember = task.project?.members?.some(m => m.userId === userId);
  const isCreator = task.creatorId === userId;
  
  if (!task.projectId && !isCreator) {
    throw new ApiError("Unauthorized", 403);
  }
  if (task.projectId && !isOwner && !isMember) {
    throw new ApiError("Not a project member", 403);
  }
  
  return prisma.comment.findMany({ where: { taskId } });
};
```

2. Update controller to pass userId:
```javascript
export const getCommentsByTaskController = async (req, res) => {
  const { taskId } = req.params;
  const comments = await commentService.getCommentsByTask(taskId, req.user.id);
```

**Action Items**:
- [ ] Update `comment.service.getCommentsByTask()` signature to accept `userId`
- [ ] Add task access check (owner/member/creator pattern)
- [ ] Update `comment.controller.getCommentsByTaskController()` to pass `req.user.id`
- [ ] Test: Unauthorized user should get 403

---

### Phase 2: Enforce RBAC Permission Matrix (🟡 MEDIUM)
**Goal**: Align status/priority mutations with owner-only policy from RBAC_AUDIT_PLAN.md  
**Estimated Time**: 1 hour  
**Risk**: LOW - only affects status/priority operations, not core task flow  
**Dependencies**: Requires Phase 1 complete  

#### 2.1 Restrict Status Create/Update to Owner Only
**File**: `server/src/services/status.service.js`  
**Problem**: Members can create/update statuses (should be owner-only per RBAC matrix)  
**Current Pattern** (lines 7-32, 170+):
```javascript
// CURRENT: Allows member OR owner
if (project.ownerId !== userId && !project.members.some(member => member.userId === userId)) {
  throw new ApiError("Access denied", HTTP_STATUS.FORBIDDEN);
}
```

**Fix**: Change to owner-only
```javascript
// NEW: Owner only
if (project.ownerId !== userId) {
  throw new ApiError("Only project owner can manage statuses", HTTP_STATUS.FORBIDDEN);
}
```

**Action Items**:
- [ ] Locate all status checks in `status.service.js` (lines 20, 66, 109, 154, 260 approx)
- [ ] Change predicate from `AND !members.some()` to direct owner-only check
- [ ] Search: `project.ownerId !== userId && !project.members.some`
- [ ] Replace with: `project.ownerId !== userId`

---

#### 2.2 Restrict Priority Create/Update to Owner Only
**File**: `server/src/services/priority.service.js`  
**Problem**: Same as status (members can create/update)  
**Pattern**: Identical to status service (mirror codebase structure)  

**Action Items**:
- [ ] Apply same fix as 2.1 to priority.service.js
- [ ] Verify both status and priority use consistent owner-only logic

---

### Phase 3: Create Permission Utility Layer (🟢 OPTIONAL REFACTOR)
**Goal**: Centralize permission logic from RBAC_AUDIT_PLAN.md for reuse  
**Estimated Time**: 1-2 hours  
**Risk**: MEDIUM - new file, but doesn't change existing logic  
**Enables**: Easier frontend integration, consistent permission checks  
**Dependencies**: Phases 1-2 complete  

#### 3.1 Create Permission Utility Module
**File**: `server/src/utils/permissions.ts` (new file)  

**Contents** (port from RBAC_AUDIT_PLAN.md):
```typescript
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

export function getTaskPermissions(task, userId) { ... }
export function getProjectPermissions(project, userId) { ... }
// Helper functions...
```

**Action Items**:
- [ ] Create `server/src/utils/permissions.ts`
- [ ] Copy permission interface + functions from RBAC_AUDIT_PLAN.md
- [ ] Add JSDoc comments for each function
- [ ] Create corresponding client file: `client/src/utils/permissions.ts`
- [ ] Export from barrel file (if repo uses index.ts pattern)

---

### Phase 4: Update Frontend with Permission Guards (🟢 UI CONSISTENCY)
**Goal**: Hide owner-only controls from non-owners; use permission utility  
**Estimated Time**: 2 hours  
**Risk**: LOW - UI only, no API changes  
**Enables**: Better UX, prevents confusing "you can't do this" errors  
**Dependencies**: Phase 3 complete (or inline permission logic)  

#### 4.1 Fix Status/Priority Pages
**Files**: 
- `client/src/app/projects/[id]/statuses.tsx` (line 175)
- `client/src/app/projects/[id]/priorities.tsx` (line 175)

**Problem**: Owner inference wrong (`const isOwner = statuses.length > 0`)  
**Fix**:
```typescript
// BEFORE (wrong):
const isOwner = statuses.length > 0;

// AFTER (correct):
const isOwner = project?.ownerId === user?.id;
```

**Action Items**:
- [ ] Fix owner computation in both files
- [ ] Wrap add/edit/delete buttons in `{isOwner && ( ... )}`
- [ ] Test: Non-owner should not see management buttons

---

#### 4.2 Update Task Detail Modal
**File**: `client/src/components/UI/modals/taskDetail/TaskDetailModalSections.tsx`  
**Problem**: All mutation controls visible regardless of permission  
**Fix**: Import + use permission utility
```typescript
import { getTaskPermissions } from '@/src/utils/permissions';

export default function TaskDetailModalSections({ task, project, ... }) {
  const permissions = getTaskPermissions(
    { ...task, project },
    user?.id
  );
  
  return (
    <>
      {/* Status picker - only if allowed */}
      {permissions.canEditStatus && (
        <StatusChips onSelect={handleUpdateStatus} />
      )}
      
      {/* Priority - only if allowed */}
      {permissions.canEditPriority && (
        <PrioritySelector onSelect={handleUpdatePriority} />
      )}
      
      {/* Delete button - only if allowed */}
      {permissions.canDelete && (
        <Button onPress={handleDelete}>Delete</Button>
      )}
    </>
  );
}
```

**Action Items**:
- [ ] Import `getTaskPermissions` in modal
- [ ] Compute permissions at component top
- [ ] Wrap mutation handlers in permission checks
- [ ] Test: Non-owners should see read-only task detail

---

#### 4.3 Update Project Menu
**File**: `client/src/app/projects/[id].tsx`  
**Problem**: Owner-only actions shown to all members  
**Fix**: Use same approach as above with `getProjectPermissions`

**Action Items**:
- [ ] Import `getProjectPermissions`
- [ ] Compute permissions
- [ ] Wrap owner-only menu items in conditional render

---

### Phase 5: Testing & Validation (✅ ENSURE QUALITY)
**Goal**: Verify all checks work end-to-end  
**Estimated Time**: 1 hour  
**Priority**: HIGH - data security depends on this  

#### 5.1 Write Integration Tests
**Pattern**: For each critical gap, create test

**Test Case 1**: Unauthorized attachment upload
```typescript
// GET /api/tasks/:taskId/attachments (unauthorized user)
// Should return 403
```

**Test Case 2**: Unauthorized comment read
```typescript
// POST /api/comments/task/:taskId (unauthorized user)
// Should return 403
```

**Test Case 3**: Non-owner status create fails
```typescript
// POST /api/projects/:projectId/statuses (as member, not owner)
// Should return 403
```

---

## Implementation Checklist

### Phase 1: Critical Gaps 🔴
- [ ] **1.1 Attachment Upload**
  - [ ] Read `attachment.controller.js` current implementation
  - [ ] Add task + project fetch
  - [ ] Add access validation (owner/member/creator)
  - [ ] Manual test: Upload as unauthorized user → expect 403

- [ ] **1.2 Comment Read**
  - [ ] Update `comment.service.getCommentsByTask()` signature
  - [ ] Add task access check
  - [ ] Update controller to pass `userId`
  - [ ] Manual test: Fetch comments as unauthorized user → expect 403

### Phase 2: RBAC Matrix 🟡
- [ ] **2.1 Status Owner-Only**
  - [ ] Find all status service permission checks
  - [ ] Replace member pattern with owner-only
  - [ ] Test: Member attempts to create status → expect 403

- [ ] **2.2 Priority Owner-Only**
  - [ ] Apply same fix to priority service
  - [ ] Verify consistency

### Phase 3: Permission Utility 🟢
- [ ] **3.1 Create Permission Module**
  - [ ] Create `server/src/utils/permissions.ts`
  - [ ] Port functions from RBAC_AUDIT_PLAN.md
  - [ ] Create `client/src/utils/permissions.ts`

### Phase 4: Frontend Updates 🟢
- [ ] **4.1 Status/Priority Pages**
  - [ ] Fix owner computation (lines 175)
  - [ ] Wrap buttons in conditionals
  
- [ ] **4.2 Task Detail Modal**
  - [ ] Use permission utility
  - [ ] Gate mutation controls
  
- [ ] **4.3 Project Menu**
  - [ ] Use project permissions
  - [ ] Gate owner-only items

### Phase 5: Testing ✅
- [ ] Create integration test suite
- [ ] Verify critical gaps are closed
- [ ] Document test cases

---

## Rollout Strategy

**Deployment Order** (minimize disruption):
1. **Phase 1** (Critical) → Deploy immediately (bug fixes)
2. **Phase 2** (Medium) → Deploy with Phase 1 or next sprint
3. **Phase 3** (Refactor) → Optional, can do incrementally
4. **Phase 4** (UI) → Deploy after backend fully tested
5. **Phase 5** (Testing) → Run before each phase

**No Breaking Changes**: All phases maintain API compatibility; existing clients still work.

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Attachment uploads blocked for legitimate users | Add comment migration guide: "If uploads fail, verify project membership" |
| Comments suddenly require auth | Add logging to detect unexpected 403s during gradual rollout |
| Status/priority create fails for members | Post-deploy comms: "Only owners can create statuses now" |
| Frontend breaks on permission checks | Feature flag: `useNewPermissionSystem` to toggle old/new UI |

---

## Success Criteria

✅ All gaps from analysis closed  
✅ No unauthorized users can access restricted resources  
✅ Permission checks consistent across backend  
✅ Frontend UX doesn't mislead users  
✅ All integration tests pass  
✅ No breaking API changes  

---

## Next Steps

→ **Start Phase 1 immediately** (critical security gaps)  
→ **Proceed step-by-step** with automated validation as we go
