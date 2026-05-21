# Project Management Module — Diagram Data

## 1. Use Case Diagram Data

### Actors
- Project Owner
- Project Member
- Invited User
- Email Notification Service

### Use Cases
- Create Project
- Update Project
- View Project
- Delete Project
- List Projects
- View Project Dashboard
- View Prioritised Tasks
- Add Member
- Send Invite
- Accept Invite
- Change Member Role
- Upload File
- Download File
- View Shared Files
- View Activity Feed
- Create Task Comment
- Edit Task Comment
- Delete Task Comment
- Generate Project Overview Report
- Generate Task Assignment Report
- Notify via Email
- Get ML Insights

### Relationships
[Project Owner] --> [Create Project]
[Project Owner] --> [Update Project]
[Project Owner] --> [Delete Project]
[Project Owner] --> [Add Member]
[Project Owner] --> [Send Invite]
[Project Owner] --> [Change Member Role]
[Project Owner] --> [Upload File]
[Project Member] --> [View Project]
[Project Member] --> [View Project Dashboard]
[Project Member] --> [View Activity Feed]
[Project Member] --> [Create Task Comment]
[Invited User] --> [Accept Invite]
[Email Notification Service] --> [Notify via Email]
[Add Member] <<include>> [Send Invite]
[Send Invite] <<include>> [Notify via Email]
[Generate Project Overview Report] <<include>> [Get ML Insights]
[Create Project] <<include>> [Assign Owner]

## 2. Entity Relationship Diagram (ERD) Data

### Entities & Attributes
- Project (id: String @id @default(uuid()), title: String, description: String?, ownerId: String, createdAt: DateTime @default(now()), status: String @default("todo"))
- ProjectMember (id: String @id @default(uuid()), projectId: String, userId: String, role: String @default("member"), createdAt: DateTime @default(now()))
- ProjectInvite (id: String @id @default(uuid()), email: String, role: String @default("member"), token: String @unique, projectId: String, invitedById: String, expiresAt: DateTime, createdAt: DateTime @default(now()), updatedAt: DateTime @updatedAt)
- Activity (id: String @id @default(cuid()), type: String, projectId: String, userId: String, taskId: String?, commentId: String?, metadata: Json?, createdAt: DateTime @default(now()))
- Attachment (id: String @id @default(cuid()), projectId: String?, taskId: String?, fileName: String, fileType: String?, fileSize: Int?, fileUrl: String, uploadedBy: String, createdAt: DateTime @default(now()))

### Relationships
[Project] --one-to-many--> [ProjectMember] (cardinality: one Project to many ProjectMember)
[Project] --one-to-many--> [ProjectInvite] (cardinality: one Project to many ProjectInvite)
[Project] --one-to-many--> [ActivityLog] (cardinality: one Project to many ActivityLog)
[Project] --one-to-many--> [SharedFile] (cardinality: one Project to many SharedFile)
[ProjectMember] --many-to-one--> [Project] (cardinality: many ProjectMember to one Project)
[ActivityLog] --many-to-one--> [Project] (cardinality: many ActivityLog to one Project)
[SharedFile] --many-to-one--> [Project] (cardinality: many SharedFile to one Project)

## 3. Sequence Diagram Data

Flow 1: Create project
1. [Project Owner] -> [Client App] : submit create project form
2. [Client App] -> [Projects API (Server)] : POST /projects {project data}
3. [Projects API] -> [Database] : INSERT Project
4. [Database] -> [Projects API] : return project id
5. [Projects API] -> [Database] : INSERT ProjectMember {project_id, user_id, role=Owner}
6. [Database] -> [Projects API] : confirm member record
7. [Projects API] -> [Client App] : return 201 Created with project payload

Error handling:
- 400 Bad Request -> Validation errors are returned when the project name or other required fields are missing/invalid.
- 401 Unauthorized -> Auth middleware stops the request when the user is not logged in.
- 500 Internal Server Error -> Database insert failures bubble to the error middleware if project creation or default setup fails.

Flow 2: Invite member
1. [Project Owner] -> [Client App] : enter invite email
2. [Client App] -> [Projects API] : POST /projects/{id}/invites {email}
3. [Projects API] -> [Database] : INSERT ProjectInvite {project_id, email, token, status=pending}
4. [Projects API] -> [Email Notification Service] : send invite email with token link
5. [Email Notification Service] -> [Invited User] : deliver invite email
6. [Invited User] -> [Client App] : click invite link / open app
7. [Client App] -> [Projects API] : GET /invites/{token}/accept
8. [Projects API] -> [Database] : create ProjectMember or link existing user to project
9. [Projects API] -> [Client App] : return success / joined project

Error handling:
- 404 Not Found -> Invite acceptance returns "Invalid invite token" when the token cannot be found.
- 400 Bad Request -> Invite acceptance returns "Invite has expired" or "An invite for this email already exists".
- 403 Forbidden -> Invite acceptance returns "This invite is not for your email address" when the logged-in user email does not match.
- 400 Bad Request -> Invite creation returns "User is already a member of this project" or "You are already part of this project" for duplicates.

Flow 3: Activity feed
1. [Any Actor/Client] -> [Projects API] : perform action (create/update/delete task or project)
2. [Projects API] -> [Database] : INSERT ActivityLog {project_id, user_id, action, entity_type, entity_id, created_at}
3. [Database] -> [Projects API] : confirm activity record
4. [Client App] -> [Projects API] : GET /projects/{id}/activity?page=1
5. [Projects API] -> [Database] : SELECT * FROM ActivityLog WHERE project_id=? ORDER BY created_at DESC LIMIT N
6. [Database] -> [Projects API] : return rows
7. [Projects API] -> [Client App] : return activity feed JSON

Error handling:
- 403 Forbidden -> Activity feed returns "You don't have access to this project" when the user is not a member or owner.
- 404 Not Found -> Invitation landing returns "Invite link not found" when the token has already been deleted.
- 400 Bad Request -> Invitation landing returns "Invite link expired" when the token exists but is past its expiry date.

## 4. Activity Diagram Data

### Start node
- Start

### Actions
- Open "Create Project" screen
- Enter project name, description, dates
- Submit project form
- Server validates request
- Server checks membership and invite ownership rules
- Server persists project to database
- Server assigns creator as Project Owner
- Prompt user to add members
- (Optional) Add member emails and send invites
- Show project error state when invite, attachment, or access checks fail

### Decision points
- DECISION: [validation passes] → [persist project] / [show 400 validation errors]
- DECISION: [user chooses to add members] → [send invites] / [complete flow]
- DECISION: [invite token valid and not expired] → [accept invite] / [show invite error]
- DECISION: [user has project access] → [show feed or details] / [show 403 access denied]

### End node
- End

## 5. Component/Architecture Diagram Data

[ProjectListScreen (Frontend)] --> [Projects API (Backend)] : REST API (GET /projects)
[ProjectDetailScreen (Frontend)] --> [Projects API (Backend)] : REST API (GET /projects/{id})
[DashboardComponent (Frontend)] --> [Projects API (Backend)] : REST API (GET /projects/{id}/dashboard)
[MembersModal (Frontend)] --> [Projects API (Backend)] : REST API (POST /projects/{id}/members)
[InviteFlow (Frontend)] --> [Projects API (Backend)] : REST API (POST /projects/{id}/invites)
[CommentsComponent (Frontend)] --> [Projects API (Backend)] : REST API (POST /projects/{id}/tasks/{taskId}/comments)
[Projects API (Backend)] --> [Database (Prisma/Postgres)] : ORM / SQL queries
[Projects API (Backend)] --> [ActivityLog (DB table)] : write/read activity entries
[Projects API (Backend)] --> [SharedFiles Storage (uploads/ or Firebase Storage)] : file upload/download API
[Projects API (Backend)] --> [Email Notification Service (SendGrid/SMTP)] : send invite/email notifications
[Projects API (Backend)] --> [Firebase Cloud Messaging] : push notifications
[Projects API (Backend)] --> [ml-service (FastAPI)] : HTTP API to request ML insights
[ml-service (FastAPI)] --> [ml models / artifacts] : model inference (synchronous)
[Projects API (Backend)] --> [Uploads filesystem] : save file metadata and binary
