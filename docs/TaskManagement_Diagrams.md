# Task Management Module — Diagram Data

## 1. Use Case Diagram Data

### Actors
- Authenticated User
- Project Member
- Project Owner
- File Storage Service

### Use Cases
- Create Task
- View Task
- Update Task
- Delete Task
- Change Task Status
- Assign Task
- Unassign Task
- Add Comment
- View Comments
- Upload Attachment
- Download Attachment
- Tag Task
- Categorize Task
- Sort Tasks
- Filter Tasks
- Bulk Update Tasks
- Export Tasks
- View Task Audit
- Compute Task Progress
- Notify Participants

### Relationships
[Authenticated User] --> [Create Task]
[Authenticated User] --> [View Task]
[Authenticated User] --> [Update Task]
[Authenticated User] --> [Delete Task]
[Authenticated User] --> [Add Comment]
[Authenticated User] --> [Upload Attachment]
[Authenticated User] --> [Download Attachment]
[Authenticated User] --> [Tag Task]
[Authenticated User] --> [Categorize Task]
[Authenticated User] --> [Sort Tasks]
[Authenticated User] --> [Filter Tasks]
[Authenticated User] --> [Export Tasks]
[Authenticated User] --> [View Task Audit]
[Project Member] --> [Assign Task]
[Project Member] --> [Unassign Task]
[Project Member] --> [Change Task Status]
[Project Owner] --> [Bulk Update Tasks]
[Project Owner] --> [Delete Task]
[File Storage Service] --> [Upload Attachment]
[File Storage Service] --> [Download Attachment]

[Create Task] <<include>> [Assign Task]
[Create Task] <<include>> [Tag Task]
[Create Task] <<include>> [Categorize Task]
[Create Task] <<include>> [Upload Attachment]
[Add Comment] <<include>> [Upload Attachment]
[Bulk Update Tasks] <<include>> [Update Task]
[Export Tasks] <<extend>> [List Tasks]

## 2. Entity Relationship Diagram (ERD) Data

### Entities & Attributes
- Task (id: String @id @default(cuid()), title: String, description: String?, isCompleted: Boolean @default(false), statusId: String?, priorityId: String?, dueDate: DateTime?, creatorId: String, projectId: String?, assigneeId: String?, createdAt: DateTime @default(now()), updatedAt: DateTime @updatedAt)
- Status (id: String @id @default(cuid()), name: String, color: String?, order: Int @default(0), projectId: String?, userId: String?, createdAt: DateTime @default(now()), updatedAt: DateTime @updatedAt)
- Priority (id: String @id @default(cuid()), name: String, color: String?, order: Int @default(0), projectId: String?, userId: String?, createdAt: DateTime @default(now()), updatedAt: DateTime @updatedAt)
- Comment (id: String @id @default(cuid()), content: String, taskId: String, authorId: String, createdAt: DateTime @default(now()), updatedAt: DateTime @updatedAt)
- Attachment (id: String @id @default(cuid()), taskId: String?, projectId: String?, fileName: String, fileType: String?, fileSize: Int?, fileUrl: String, uploadedBy: String, createdAt: DateTime @default(now()))
- TaskRiskSnapshot (id: String @id @default(cuid()), userId: String, taskId: String, risk: String, probability: Float, topFactors: Json?, source: String @default("on_demand"), predictedForDateKey: String, createdAt: DateTime @default(now()))

### Relationships
[Project] --one-to-many--> [Task] (cardinality: one Project has many Tasks)
[Task] --one-to-many--> [TaskComment] (cardinality: one Task has many TaskComments)
[Task] --one-to-many--> [TaskAttachment] (cardinality: one Task has many TaskAttachments)
[Task] --one-to-many--> [TaskCategory] (cardinality: one Task has many TaskCategories)
[User] --many-to-many--> [Task] (cardinality: Users assigned to many Tasks; Tasks can have many assignees)
[Task] --one-to-many--> [AuditRecord] (cardinality: one Task has many AuditRecords)

## 3. Sequence Diagram Data

Flow 1: Create task
1. [Authenticated User] -> [Client (Task Form)]: fill form and submit
2. [Client (Task Form)] -> [API Server / TaskController]: POST /api/tasks {payload}
3. [API Server / TaskController] -> [Validation Service]: validate fields
4. [Validation Service] -> [API Server / TaskService]: validation result
5. [API Server / TaskService] -> [Database]: insert Task record
6. [API Server / TaskService] -> [Notification Service]: notify assignee(s)
7. [Notification Service] -> [Project Member]: deliver notification (in-app/push)
8. [API Server / TaskController] -> [Client (Task Form)]: return created Task object (201)

Error handling:
- 400 Bad Request -> Validation rejects past due dates, missing fields, or invalid assignee/project combinations.
- 403 Forbidden -> Task creation returns "Only project owner can create tasks" when the user is not the project owner.
- 404 Not Found -> Task creation returns "Project not found" or invalid status/priority lookup errors when referenced records are missing.

Flow 2: Update status
1. [Authenticated User] -> [Client (Task Detail)]: drag/tap status control
2. [Client (Task Detail)] -> [API Server / TaskController]: PATCH /api/tasks/{id}/status {status}
3. [API Server / TaskController] -> [Auth Middleware]: authorize action
4. [API Server / TaskService] -> [Database]: update Task.status
5. [API Server / AuditService] -> [Database]: insert activity audit record
6. [API Server / Notification Service] -> [Project Members]: push status update
7. [API Server / TaskController] -> [Client (Task Detail)]: return updated Task (200)

Error handling:
- 401 Unauthorized -> Auth middleware blocks the request when the token is missing or expired.
- 403 Forbidden -> Update returns "Only the task creator, project owner, or assignee can update this task" for unauthorized users.
- 404 Not Found -> Update returns "Task not found" or "Status not found" when the task or status record is missing.

Flow 3: Add comment
1. [Authenticated User] -> [Client (Task Detail)]: enter comment and submit
2. [Client (Task Detail)] -> [API Server / CommentController]: POST /api/tasks/{id}/comments {content}
3. [API Server / CommentService] -> [Database]: insert TaskComment
4. [API Server / Realtime Service] -> [Project Members]: emit real-time event for new comment
5. [API Server / CommentController] -> [Client (Task Detail)]: return created Comment (201)

Error handling:
- 404 Not Found -> Commenting returns "Task not found" or "Comment not found" when the target item is missing.
- 403 Forbidden -> Comment service returns "You are not a member of this project" or "You are not allowed to comment on this task".
- 400 Bad Request -> Validation rejects empty comment content before persistence.

## 4. Activity Diagram Data

### Start node
- Start

### Actions
- Open Create Task form
- Enter title and description
- Add optional metadata (due date, priority, tags, assignees)
- Attach files (optional)
- Submit form
- Server validates input
- Server checks task/project references and user permissions
- Server persists task
- Notify assignees and project members
- Show error state when validation or authorization fails

### Decision points
- DECISION: [User has permission to create in project] → [Proceed to form submission] / [Show permission error]
- DECISION: [Validation passed] → [Persist task] / [Return 400 validation errors]
- DECISION: [Due date is in the future] → [Persist task] / [Return due-date error]
- DECISION: [Assignee belongs to project] → [Persist task] / [Return assignee error]
- DECISION: [Attachments present] → [Upload attachments] / [Skip attachment upload]
- DECISION: [Task exists and user can update/view it] → [Continue task actions] / [Return 404 or 403 error]

### End node
- End

## 5. Component/Architecture Diagram Data

[TaskListScreen] --> [API Server / TaskController] : REST API (list/filter/sort)
[TaskDetailScreen] --> [API Server / TaskController] : REST API (get/update/delete)
[TaskForm] --> [API Server / TaskController] : REST API (create/update)
[CommentComponent] --> [API Server / CommentController] : REST API (create/list)
[API Server / TaskController] --> [TaskService] : internal service call
[TaskService] --> [Prisma ORM / Database] : ORM queries (read/write)
[CommentService] --> [Prisma ORM / Database] : ORM queries (comments)
[AttachmentService] --> [File Storage Service] : upload/download (HTTP/S3/proxy)
[Notification Service] --> [Push Provider / RealTime Service] : push/emit events
[API Server] --> [Auth Middleware] : JWT verification
[API Server] --> [ML Microservice (FastAPI)] : HTTP async calls for classification/tagging
[API Server] --> [Uploads directory] : filesystem storage (local) or proxy to cloud
