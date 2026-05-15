# Task Management UML Specification

## Actors

- User: authenticated system user (creator, assignee, project member)
- Project Owner: user who owns a project (ownerId)
- Assignee: user assigned to a task
- System Service: ML Risk Prediction Service (task risk snapshot/upsert)
- Notification Service: in-app and push notification sender

## Use Cases

### 1. Create Task
Preconditions:
- Request authenticated by `authenticateToken` (req.user present).
- Request body validated by `createTaskSchema` (see Validation Rules).
- If `projectId` provided: project must exist and caller must be project owner.

Main Flow:
1. Client -> POST /api/tasks with validated body.
2. `authenticateToken` attaches `req.user`.
3. `validate(createTaskSchema)` sanitizes `req.body`.
4. `taskService.create(taskData, userId)` executes:
   - checks `dueDate` is not in the past (service-level check).
   - if `statusId` or `priorityId` provided, ensures they belong to project.
   - if `projectId` provided, loads project and ensures it exists and caller is owner.
   - if `assigneeId` provided and `projectId` present, ensures assignee is project member or owner.
   - creates task via Prisma and returns task object (includes status, priority, assignee, project, attachments).
5. Controller triggers `taskRiskSnapshotService.upsertSnapshot(...)` (fire-and-forget) when task not completed.
6. Controller logs activity (`TASK_CREATED`) when `projectId` present.
7. Controller responds with success: HTTP 201 and created task.

Alternative Flows:
- If `projectId` not provided, task is standalone: creator becomes `creatorId` and regular validations skip project-member checks for assignee (only creator can later upload/delete attachments unless shared behavior).
- If `assigneeId` omitted, task is created unassigned.

Error Flows:
- Missing/invalid JWT -> HTTP 401, ERROR_MESSAGES.UNAUTHORIZED via `authenticateToken`.
- Joi validation fails in `validate` -> forwarded to error middleware -> HTTP 400 with validation error details.
- `dueDate` in the past (service check) -> HTTP 400 with message "Due date cannot be in the past".
- `statusId`/`priorityId` not found or not in project -> HTTP 404 with message "Status not found or does not belong to this project" / "Priority not found or does not belong to this project".
- `project` not found -> HTTP 404, ERROR_MESSAGES.NOT_FOUND.
- Caller not project owner when `projectId` present -> HTTP 403 with message "Only project owner can create tasks".
- `assigneeId` not a project member -> HTTP 400 with message "Assignee must be a member of the project".

Response:
- Success (created):

  {
    "success": true,
    "message": "Resource created successfully",
    "data": { /* task object as returned by Prisma include */ }
  }

- Error:

  {
    "success": false,
    "error": {
      "message": "<message>",
      "statusCode": <http status>,
      "details": <optional details | validation array>
    }
  }

### 2. Read / View Task (Get Task By ID)
Preconditions:
- Authenticated request (`authenticateToken`).
- User must be task creator OR project owner OR project member (checked in service query conditions).

Main Flow:
1. Client -> GET /api/tasks/:id
2. `authenticateToken` attaches `req.user`.
3. Controller calls `taskService.getById(id, userId)`.
4. Service uses `prisma.task.findFirst` with WHERE: id AND (creatorId == userId OR project.ownerId == userId OR project.members include userId).
5. If found, controller returns HTTP 200 with task (includes status, priority, assignee, project, attachments).

Alternative Flows:
- None in code beyond not-found and access restrictions.

Error Flows:
- Not authenticated -> HTTP 401.
- Task not found or user lacks access -> HTTP 404 (service throws ERROR_MESSAGES.NOT_FOUND).

Response:
- Success (retrieved): HTTP 200 with `data` set to the single task object.

### 3. List Tasks (Get All Tasks)
Preconditions:
- Authenticated request.

Main Flow:
1. Client -> GET /api/tasks?status=&priority=&page=&limit=
2. `authenticateToken` attaches `req.user`.
3. Controller builds `filters` from query params and calls `taskService.getAll(userId, filters)`.
4. Service queries Prisma for tasks where creatorId == userId OR assigneeId == userId, and applies optional statusId/priorityId filters, with pagination and includes.
5. Controller responds HTTP 200 with array of tasks and `meta.pagination`.

Error Flows:
- Missing/invalid token -> 401.

Response:
- Success: HTTP 200

  {
    "success": true,
    "message": "Data retrieved successfully",
    "data": [ /* tasks */ ],
    "meta": { /* pagination: page, limit, total, totalPages */ }
  }

### 4. Get Project Tasks
Preconditions:
- Authenticated request.
- Caller must be project owner or member (checked in service).

Main Flow:
1. Client -> GET /api/tasks/project/:projectId
2. `authenticateToken`.
3. Controller calls `taskService.getAllForProject(projectId, userId)`.
4. Service verifies project exists and that user is owner OR member; then returns tasks for the project ordered by createdAt desc.
5. Controller returns HTTP 200 with tasks array.

Error Flows:
- Project not found or user not a member -> HTTP 403 with message "Access denied: Not a member of this project".

### 5. Update Task
Preconditions:
- Authenticated request.
- Request body validated by `updateTaskSchema`.
- Caller must be one of: task creator, project owner, or task assignee (with additional restrictions when project task).

Main Flow:
1. Client -> PATCH /api/tasks/:id with validated body.
2. `authenticateToken` and `validate(updateTaskSchema)` run.
3. Controller calls `taskService.update(id, userId, updateData)`.
4. Service loads existing task via `prisma.task.findFirst` with access checks (creator OR project owner OR project member via project membership check in OR clause).
5. If no existingTask -> throw 404.
6. Determine roles: `isCreator`, `isOwner`, `isAssignee`, `isProjectTask`.
7. If `isProjectTask` and NOT `isOwner` -> throw 403: "Project members can only view tasks" (prevents non-owners from updating project tasks except limited assignee updates).
8. If caller not in allowed roles (creator, owner, assignee) -> throw 403.
9. Build `data` to update depending on who is performing the update:
   - If `isCreator` or `isOwner`: can update title, description, isCompleted (also allowed for assignee), statusId (validated belongs to project or null), priorityId (validated), dueDate, assigneeId (if project exists and assignee is project member or null).
   - Else if `isAssignee`: allowed to update title, `isCompleted`, statusId only (status validated belongs to project or null). Assignee cannot change other fields.
10. Perform Prisma update and return updated task (includes relations).
11. Send notifications if assignee changed (in-app + optional push with delay).
12. Controller triggers risk snapshot upsert (if not completed) and logs `TASK_UPDATED` when projectId present.
13. Controller responds HTTP 200 with updated task.

Alternative Flows:
- Assignee-only flow: assignee can update completion and status but not assign or change priority/title (code allows limited title change by assignee but not other fields).

Error Flows:
- Existing task not found -> 404.
- Forbidden due to project membership/role checks -> 403 with messages:
  - "Project members can only view tasks"
  - "Only the task creator, project owner, or assignee can update this task"
  - "Only the task creator, assignee, or project owner can update completion status"
- Provided `statusId` or `priorityId` invalid -> 404.
- `assigneeId` not a project member -> 400.

Response:
- Success: HTTP 200 with updated task in `data`.

### 6. Delete Task
Preconditions:
- Authenticated request.
- Caller must be project owner for project tasks; for standalone tasks caller must be creator.

Main Flow:
1. Client -> DELETE /api/tasks/:id
2. `authenticateToken` attaches `req.user`.
3. Controller fetches task summary (id, title, projectId) for activity logging.
4. Controller calls `taskService.delete(id, userId)`.
5. Service loads existingTask via `prisma.task.findUnique`.
6. If not found -> 404.
7. If `existingTask.projectId` present and `existingTask.project.ownerId !== userId` -> 403 "Only the project owner can delete project tasks".
8. Else if standalone and `existingTask.creatorId !== userId` -> 403 "Only the task creator can delete standalone tasks".
9. Delete task with Prisma.
10. Controller logs `TASK_DELETED` activity if projectId present.
11. Controller responds HTTP 200 with SUCCESS_MESSAGES.DELETED.

Error Flows:
- Not found -> 404.
- Forbidden by ownership rule -> 403.

Response:
- Success: HTTP 200

  {
    "success": true,
    "message": "Resource deleted successfully"
  }

### 7. Upload Task Attachment
Preconditions:
- Authenticated request.
- File present in multipart under field `file` and within size limits (upload.middleware enforces 10MB per file).

Main Flow:
1. Client -> POST /api/tasks/:taskId/attachments with multipart form-data `file`.
2. `authenticateToken` runs.
3. `uploadTaskAttachment.single("file")` handles file storage to `uploads/tasks` and attaches `req.file`.
4. Controller queries task with project + membership information to authorize user:
   - If standalone task: only creator can upload.
   - If project task: creator, project owner, or project member can upload.
5. Controller calls `attachmentService.create({ file, taskId, userId })` and returns created attachment.
6. Controller logs `ATTACHMENT_ADDED` activity (if project task).
7. Respond HTTP 201 with attachment object.

Error Flows:
- No file uploaded -> HTTP 400 "No file uploaded".
- Task not found -> HTTP 404 "Task not found".
- Authorization failure -> HTTP 403 with messages "You don't have permission to upload files to this task" or "Not a member of this project".

Response:
- Success: HTTP 201 with `data` containing attachment details.

### 8. Delete Task Attachment
Preconditions:
- Authenticated request.

Main Flow:
1. Client -> DELETE /api/tasks/:taskId/attachments/:attachmentId
2. `authenticateToken` runs.
3. Controller fetches attachment by `attachmentId` and verifies its `taskId` matches param.
4. If missing or mismatched -> 404 "Attachment not found".
5. Controller verifies user has access to the task (creator OR project owner OR project member) via `prisma.task.findFirst` condition.
6. If allowed, `attachmentService.delete(attachmentId, userId)` is invoked and the file/DB record is removed.
7. Controller logs `ATTACHMENT_DELETED` activity if project task.
8. Respond HTTP 200 with message "Attachment deleted successfully".

Error Flows:
- Attachment not found or mismatch -> 404.
- Access denied -> 403 "You don't have access to this task".

Response:
- Success: HTTP 200 with success message.

## Authentication & Authorization Rules

- All task routes: `authenticateToken` middleware required (JWT in `Authorization: Bearer <token>`).
- Role checks are enforced in service layer logic (not via route-level `authorizeRoles`):
  - Project-scoped creation: only project owner (`project.ownerId === userId`) can create project tasks.
  - Update:
    - If task belongs to a project and caller is not project owner, the service blocks update entirely with message "Project members can only view tasks".
    - Otherwise, allowed updaters: task creator, project owner, or assignee (with field-level restrictions).
  - Delete:
    - Project tasks: only project owner can delete.
    - Standalone tasks: only task creator can delete.
  - Attachments:
    - Standalone tasks: only creator can upload/delete attachments.
    - Project tasks: creator, project owner, or any project member can upload/delete.

## Validation Rules

- Request validation performed by Joi schemas in `server/src/validator/task.validator.js`:
  - `createTaskSchema`:
    - `title`: string, min 1, max 200, trimmed, required.
    - `description`: string, max 1000, trimmed, allow empty or null, optional.
    - `isCompleted`: boolean, optional.
    - `statusId`: string, allow null, optional.
    - `priorityId`: string, allow null, optional.
    - `dueDate`: ISO date, allow null, optional, custom `pastDateValidation` (rejects past dates with message "Due date cannot be in the past").
    - `projectId`: string, allow null, optional.
    - `assigneeId`: string, allow null, optional.
  - `updateTaskSchema`:
    - All fields optional; `title` same constraints as create; `dueDate` is ISO date and can be null; `assigneeId` allow null.

- Service-level validations (task.service.js):
  - `dueDate` parsed and validated again (throws 400 if date is in the past).
  - `statusId` and `priorityId` existence check against project context (404 if not found).
  - If `projectId` provided on create: project must exist and caller must be owner.
  - On assign/update: assignee must be a project member or owner (400 if not).

## Error Handling Matrix

- 401 Unauthorized:
  - Missing `Authorization` header or token.
  - Invalid/expired token (JWT errors handled in error middleware).
- 400 Bad Request:
  - Joi validation failures (error details included in `error.details`).
  - `Due date cannot be in the past` (service check).
  - `Assignee must be a member of the project` on invalid assignee.
  - Prisma unique constraint / duplicate entries -> P2002 mapped to 400 with message "Duplicate field value entered".
- 403 Forbidden:
  - Creating project task by non-owner: "Only project owner can create tasks".
  - Updating when not creator/owner/assignee: "Only the task creator, project owner, or assignee can update this task".
  - Updating project task by non-owner: "Project members can only view tasks".
  - Deleting project task by non-owner: "Only the project owner can delete project tasks".
- 404 Not Found:
  - Task not found when fetching/updating/deleting.
  - Status / Priority not found for provided id.
  - Attachment not found or task mismatch.
- 500 Internal Server Error:
  - Unhandled server errors (default fallback in error middleware).

## API Endpoints Mapping

- `POST /api/tasks` -> `createTaskController` (validate:createTaskSchema)
- `GET  /api/tasks` -> `getAllTasksController`
- `GET  /api/tasks/project/:projectId` -> `getProjectTasksController`
- `GET  /api/tasks/:id` -> `getTaskByIdController`
- `PATCH /api/tasks/:id` -> `updateTaskController` (validate:updateTaskSchema)
- `DELETE /api/tasks/:id` -> `deleteTaskController`
- `POST /api/tasks/:taskId/attachments` -> `uploadTaskAttachmentController` (upload middleware)
- `DELETE /api/tasks/:taskId/attachments/:attachmentId` -> `deleteTaskAttachmentController`

-- End of specification (extracted from server/src controllers, services, validators, and middleware).
