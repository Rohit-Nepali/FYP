# Project Management Module

## 1. Subsystem Overview

The Project Management Module provides the core functionality for creating, organising, collaborating on, and reporting about projects within Taskora. It exposes REST endpoints consumed by the mobile client and coordinates persistence, access control, notifications and file storage required for project-centric workflows. This subsystem is responsible for project lifecycle operations (create / update / view / delete), membership management and project-level artifacts such as files, activity streams and aggregated reports.

This module integrates tightly with Taskora's other modules: the `AuthContext` and authentication backend for user identity and JWT validation; the `Tasks` subsystem which stores per-project tasks and assignments; the `Notifications` provider (push notifications via Firebase Cloud Messaging) for invite and activity alerts; and the `Uploads`/`files` storage area (server or Firebase Storage) for shared resources. For AI/ML augmented reporting it interacts with the FastAPI microservice located in the `ml-service` folder to obtain model-driven insights and risk scores used in the Project Overview and Task Assignment reports.

Technically, the module follows a client-server REST architecture with server-side RBAC enforcement. On the backend it uses the existing Node.js/Express + Prisma stack for transactional operations and data modelling, supplemented by Firebase services (Firestore / Cloud Messaging) for real-time activity feeds and mobile push. Where advanced analytics are required the system delegates to the FastAPI microservice (Pydantic models, FastAPI endpoints) and consumes the results synchronously or asynchronously depending on report latency requirements.

## 2. Functional Requirements

FR-PR-01: The system shall allow an authenticated user to create a project by providing a name, description, optional start/end dates and an initial member list; success returns HTTP 201 and the new project id.

FR-PR-02: The system shall allow an authenticated project owner to update project metadata (name, description, dates, status) via HTTP PUT/PATCH; changes must be persisted and return HTTP 200 with the updated resource.

FR-PR-03: The system shall allow an authenticated user with access to a project to retrieve project details (GET /projects/{id}) including members, active tasks summary, files list and recent activity; response must return HTTP 200 and a JSON object matching the project schema.

FR-PR-04: The system shall allow a project owner to delete a project (DELETE /projects/{id}); deletion must remove or archive related tasks, revoke invites, and return HTTP 204 on success.

FR-PR-05: The system shall present a Project & Task Dashboard (GET /projects/{id}/dashboard) that provides counts of tasks by status, upcoming deadlines, and a prioritized task list; the endpoint must return data suitable for client rendering within 500ms under nominal load.

FR-PR-06: The system shall allow a project owner or member with permission to add new members to a project (POST /projects/{id}/members) by user id or email; adding by email should send an invite if the account does not exist.

FR-PR-07: The system shall send email and push notifications when invites are issued (POST /projects/{id}/invites); invite state must be persisted and resolvable (accept / decline) via API.

FR-PR-08: The system shall support role-based permissions with at minimum two roles: `Owner` (full control) and `Member` (limited control); role changes must be enforceable server-side and auditable in project activity.

FR-PR-09: The system shall allow upload and retrieval of shared files and resources associated with a project (POST /projects/{id}/files, GET /projects/{id}/files/{fileId}); files must be stored in `uploads/` or a configured storage provider and served with secure access controls.

FR-PR-10: The system shall provide a Project Activity Feed (GET /projects/{id}/activity) that records creation, updates, membership changes, file uploads and task state changes; feed entries must be timestamped and retrievable in reverse chronological order.

FR-PR-11: The system shall allow project-level task comments (POST /projects/{id}/tasks/{taskId}/comments) where members may create, edit and delete their comments; each comment must be auditable and linked to the author and timestamp.

FR-PR-12: The system shall generate a Project Overview Report (GET /projects/{id}/report/overview) combining metadata, task statistics, recent activity and ML-driven insights (when enabled) and return a structured JSON report suitable for PDF/visualisation generation.

FR-PR-13: The system shall generate a Task Assignment Report (GET /projects/{id}/report/task-assignments) listing tasks, assignees, assignment timestamps and workload distribution metrics; the report must be filterable by date range.

FR-PR-14: The system shall require authentication for all non-public project endpoints and enforce permission checks returning HTTP 403 for unauthorized operations.

FR-PR-15: The system shall log all project-level administrative actions (create, update, delete, role-change) to an auditable store and expose them via the activity feed.

## 3. Non-Functional Requirements

- NFR-PR-01 (Performance): 95% of read endpoints (GET project, dashboard, activity) shall respond within 500ms under nominal load (single server, typical dataset). Write endpoints (create/update) should complete within 1s excluding large file uploads.
- NFR-PR-02 (Security): All API endpoints shall require TLS in transit; authentication must use JWTs issued by the Auth subsystem and validated server-side. Sensitive data in transit and at rest (e.g., files marked private) must be encrypted using platform-provided mechanisms.
- NFR-PR-03 (Scalability): The module must support horizontal scaling; stateless API servers and externalised state (database, object storage, Firestore) so that additional instances can be added without state loss.
- NFR-PR-04 (Reliability/Availability): Critical project operations must have retries with idempotency keys for create/update operations and the system should target 99.5% availability for the project API during working hours.
- NFR-PR-05 (Usability): The API surface and returned payloads must be consistent and well-documented (OpenAPI/Swagger) to enable predictable client rendering; client UI patterns should display actionable errors and progress indicators for long-running operations.
- NFR-PR-06 (Compatibility): The mobile client UI and APIs must be compatible with both iOS and Android Expo-managed builds; binary assets and push notifications should be validated across both platforms.
- NFR-PR-07 (Maintainability): Server code should be covered by unit and integration tests (target >70% for core project logic) and follow existing repository patterns (Prisma models, service/controller layering).

## 4. Key Features Breakdown

Create / Update / View / Delete project

This feature provides the canonical CRUD operations for projects. It is implemented as REST endpoints on the server (Node/Express controllers backed by Prisma ORM models) with request validation and schema enforcement; the client calls these endpoints via the app's API client. Server-side middleware enforces RBAC (JWT validation and role checks) so that only `Owner` role users may perform destructive actions; the feature is fundamental because it defines the project boundary and anchors tasks and resources.

Project & task dashboard

The dashboard aggregates project metrics (task counts by status, upcoming deadlines and prioritized tasks) and is implemented with dedicated aggregation queries at the server layer and optionally via materialised views or cached responses for heavier projects. The mobile client renders the returned JSON to visual components (charts, lists) and subscribes to real-time updates using Firebase listeners for low-latency changes. This feature is important for providing immediate situational awareness to users and guiding prioritisation.

Add members & send invites

Membership management lets owners add users by id or email; invites are issued by the server which persists invite tokens and triggers email and push notifications via the Notification service (SendGrid/email and Firebase Cloud Messaging). Implementation uses the existing `Auth` identity provider to resolve users and the server persists invitation state; this enables collaborative workflows and controlled onboarding into projects.

Role-based permissions (Owner, Member)

Roles are centrally modelled in the database and enforced by server middleware that checks the caller's JWT and role membership for protected endpoints. The pattern uses RBAC checks in controllers or a policy service to keep permission logic testable and consistent across endpoints. Proper role enforcement prevents privilege escalation and maintains project integrity as membership changes.

Shared files & resources

Projects can attach files stored either in the local `uploads/` directory (server) or a configured object store (Firebase Storage or S3). Files are uploaded via multipart endpoints and metadata is persisted in the project's file table; access is mediated by signed URLs or server-side streaming depending on privacy settings. File sharing is essential for collaboration, providing a single source of truth for project artefacts.

Project activity feed

The activity feed records significant events (project creation, updates, membership changes, file uploads, task transitions) and is implemented using a write-append model persisted in the database and optionally mirrored to Firestore for real-time client subscriptions. Events are timestamped and can be queried via paginated endpoints; this feature provides transparency and auditability for team interactions.

Task comments at project level

Comments on tasks are stored with author, timestamp and soft-deletion support and exposed via REST endpoints and real-time updates. Implementation uses normalized comment entities linked to tasks and projects; the client displays threaded or inline comments and supports edit/delete constrained by author/perms. Comments enable contextual collaboration directly on work items.

Project overview report

The overview report bundles project metadata, aggregated task metrics and optionally ML-derived insights (risk scores, priority suggestions) provided by the FastAPI microservice. The server composes the report by combining Prisma queries and, when requested, calling the `ml-service` endpoints; responses are returned as structured JSON for client rendering or PDF export. This feature provides managers with summarised project health indicators.

Task assignment report

This report enumerates tasks, assignees, assignment timestamps and workload distribution metrics; it is generated via server-side queries and lightweight analytics routines. The implementation supports filters (date range, assignee) and produces a consumable JSON array or CSV for export. The document helps balance workload and supports resource planning.

## 5. Module Dependencies

- `Auth` / `AuthContext` (client & server): for identity, JWT issuance and role information required to enforce permissions.
- `Tasks` subsystem: tasks are logically contained within projects; project APIs read and update task metadata and lifecycle events.
- `Notifications` provider (Firebase Cloud Messaging / email): to send invites, membership changes and activity alerts to users.
- `Uploads` / `files` storage: for storing shared files and generating secure access URLs for downloads.
- `ml-service` (FastAPI microservice): to provide ML-driven insights used in the Project Overview and Task Assignment reports.
- `server` database layer (Prisma/Postgres or configured DB): persistent storage for projects, members, files, activity and audit logs.

## 6. API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|---|---|---:|---:|
| POST | /projects | Create a new project. Returns 201 with project id. | Yes |
| GET | /projects | List projects visible to the authenticated user (with pagination). | Yes |
| GET | /projects/{id} | Retrieve project details including members, files and recent activity. | Yes |
| PUT/PATCH | /projects/{id} | Update project metadata (name, description, dates, status). | Yes |
| DELETE | /projects/{id} | Delete or archive a project and associated resources. | Yes (Owner only) |
| GET | /projects/{id}/dashboard | Retrieve aggregated dashboard metrics and prioritized task list. | Yes |
| POST | /projects/{id}/members | Add a member to the project by user id or email; may send invite. | Yes (Owner/Member with permission) |
| POST | /projects/{id}/invites | Issue an invite to an email address; persists token and notifies recipient. | Yes (Owner) |
| PUT | /projects/{id}/members/{userId}/role | Change a member's role (Owner/Member). | Yes (Owner only) |
| POST | /projects/{id}/files | Upload a shared file for the project (multipart/form-data). | Yes |
| GET | /projects/{id}/files/{fileId} | Download or obtain a secure URL for a project file. | Yes |
| GET | /projects/{id}/activity | Retrieve paginated activity feed for the project. | Yes |
| POST | /projects/{id}/tasks/{taskId}/comments | Create a comment on a task within the project. | Yes |
| GET | /projects/{id}/report/overview | Generate and return the Project Overview Report (JSON). | Yes |
| GET | /projects/{id}/report/task-assignments | Generate Task Assignment Report, filterable by date range. | Yes |
