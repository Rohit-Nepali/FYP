# Task Management Module

## 1. Subsystem Overview

The Task Management module provides the core domain functionality for creating, organizing, tracking, and collaborating on tasks within Taskora. It implements the canonical task lifecycle (create → assign → progress → complete), supports metadata for prioritization and categorization, and exposes REST APIs consumed by the client application and other backend components. The module is responsible for persisting task state, managing access control for task operations, storing attachments, and emitting events used by notifications and audit components.

This subsystem integrates tightly with several other Taskora modules: the `Auth` context (client: `src/contexts/AuthContext.tsx`, server: `server/src/middleware` and `server/prisma`) for authentication and authorization; the `Projects` and `Members` modules (client: `src/app/projects` and `server/src/controllers/project*`) for scoping and assigning tasks; the `Notifications` subsystem (client and server notification services) to surface updates; and the `uploads` storage on the server (`uploads/tasks/`) for binary attachments. AI/ML capabilities such as risk classification or task-similarity are provided by the separate FastAPI microservice in `ml-service/` and are integrated via asynchronous calls when advanced analyses are required.

The key technical approach is a layered RESTful design: the server exposes resource-oriented endpoints for task entities backed by a relational datastore accessed via Prisma ORM (schema in `server/prisma/schema.prisma`). The mobile/web client (Expo React Native in `client/`) interacts with these endpoints using authenticated JSON APIs. Attachments are handled via multipart/form-data endpoints and stored on the server filesystem under `uploads/tasks/` (or optionally proxied to cloud storage). Business rules (status transitions, assignment validation, progress calculation) are implemented as server-side domain logic in the `server/src/services` and enforced by middleware for consistency and security.

## 2. Functional Requirements

FR-TA-01: The system SHALL allow an authenticated user to create a new task with required fields: title, description, projectId, creatorId, and optional fields: dueDate, priority, tags, assignees. (Test: POST /api/tasks returns 201 with stored task JSON.)

FR-TA-02: The system SHALL allow an authenticated user to retrieve a single task by ID including metadata, comments, attachments, and assignment list. (Test: GET /api/tasks/{id} returns 200 and full task representation.)

FR-TA-03: The system SHALL allow an authenticated user with appropriate permissions to update task fields (title, description, dueDate, priority, tags, assignees). (Test: PUT /api/tasks/{id} persists changes and returns 200.)

FR-TA-04: The system SHALL allow an authenticated user with appropriate permissions to delete a task. (Test: DELETE /api/tasks/{id} returns 204 and subsequent GET returns 404.)

FR-TA-05: The system SHALL support status transitions for tasks (Todo, In Progress, Done) and prevent invalid transitions when business rules disallow them. (Test: PATCH /api/tasks/{id}/status enforces allowed transitions and returns 200.)

FR-TA-06: The system SHALL support explicit priority levels (Low, Medium, High) and persist priority per task. (Test: POST/PUT with priority field stores expected value.)

FR-TA-07: The system SHALL enable categorization via tags and a category field; tags SHALL be multi-valued strings and filterable. (Test: GET /api/tasks?tags=tagA returns only tasks with tagA.)

FR-TA-08: The system SHALL provide endpoints to sort tasks by fields (createdAt, dueDate, priority, status) and allow client-specified ascending/descending ordering. (Test: GET /api/tasks?sort=dueDate:asc returns tasks in ascending due date order.)

FR-TA-09: The system SHALL provide filtering endpoints to filter tasks by project, assignee, status, priority, tags, and date ranges. (Test: GET /api/tasks?assignee=uid&status=Todo returns matching tasks.)

FR-TA-10: The system SHALL allow tasks to be assigned to one or multiple members; assignment changes SHALL produce an assignment audit entry. (Test: PUT /api/tasks/{id} with assignees updates list and creates audit record.)

FR-TA-11: The system SHALL allow authenticated users to add comments to a task; each comment SHALL include authorId, timestamp, and content. (Test: POST /api/tasks/{id}/comments returns 201 with stored comment.)

FR-TA-12: The system SHALL support file attachment upload for tasks via a multipart/form-data endpoint; files SHALL be persisted to `uploads/tasks/` and linked to the task record. (Test: POST /api/tasks/{id}/attachments uploads file and GET /api/tasks/{id} lists attachment metadata and download URL.)

FR-TA-13: The system SHALL provide downloadable URLs for task attachments accessible to authorized users. (Test: GET /api/tasks/{id}/attachments/{fileId} returns 200 and file bytes for authorized user.)

FR-TA-14: The system SHALL compute and expose task progress as a percentage based on subtasks or completion markers when available. (Test: GET /api/tasks/{id} returns `progress` numeric value between 0 and 100.)

FR-TA-15: The system SHALL emit events or notifications on assignment, status changes, comment additions, and attachment uploads so that the Notifications module can deliver in-app or push notifications. (Test: action triggers notification event in server logs or notification queue.)

FR-TA-16: The system SHALL allow listing tasks with pagination and limit/offset parameters to support large result sets. (Test: GET /api/tasks?page=2&limit=20 returns second page of results.)

FR-TA-17: The system SHALL maintain an audit trail recording the user, timestamp, and fields changed for create/update/delete operations on tasks. (Test: GET /api/tasks/{id}/audit returns chronological change records.)

FR-TA-18: The system SHALL enforce access control rules so that only users with project membership or explicit permissions can view or modify tasks in that project. (Test: unauthorized user receives 403 for protected operations.)

FR-TA-19: The system SHALL support bulk actions for tasks (bulk update status, bulk assign) via dedicated endpoints to improve efficiency. (Test: POST /api/tasks/bulk returns 200 and applies requested changes atomically or with clear partial-failure reporting.)

FR-TA-20: The system SHALL support export of task lists for a project in JSON or CSV format via an authenticated endpoint. (Test: GET /api/projects/{id}/tasks/export?format=csv returns CSV download.)

## 3. Non-Functional Requirements

NFR-TA-01 (Performance): 95% of single-task read requests (GET /api/tasks/{id}) SHALL respond within 150ms under nominal load (up to 100 concurrent users). Bulk list requests with pagination SHALL respond within 500ms for result sets of up to 100 items.

NFR-TA-02 (Security - Authentication): All task management endpoints SHALL require authentication using JWT tokens validated by server middleware; tokens SHALL expire and be revocable.

NFR-TA-03 (Security - Authorization & Data Protection): The system SHALL enforce role-based access control for task operations and ensure that attachment download URLs are protected and signed or checked server-side prior to serving files.

NFR-TA-04 (Scalability): The service SHALL horizontally scale stateless API instances behind a load balancer; attachments SHALL be migratable to cloud object storage (e.g., S3 or Firebase Storage) as volume increases.

NFR-TA-05 (Reliability/Availability): The Task Management API SHALL achieve 99.9% availability monthly; critical operations (create, update, delete) SHALL be retried or queued safely in the event of transient datastore failures.

NFR-TA-06 (Usability): The API and client interactions SHALL return clear, machine-readable error responses conforming to a standard error schema so client UI can display actionable messages to users.

NFR-TA-07 (Compatibility): The task features and APIs SHALL be fully usable from both iOS and Android client builds (Expo/React Native) and degrade gracefully on lower network bandwidth.

NFR-TA-08 (Maintainability): Business rules, validation logic, and database schema SHALL be modularized in `server/src/services` and `server/prisma` to allow future changes with minimal cross-cutting edits.

NFR-TA-09 (Privacy): Personally identifiable information contained in task comments or attachments SHALL be treated according to data retention policies and removable on request, and backups SHALL be encrypted at rest.

## 4. Key Features Breakdown

Create / Update / View / Delete task

This feature set provides the core CRUD operations for task entities. Implementation uses resource-based REST endpoints on the Node server (`server/src/controllers/tasks*`), input validation via request validators/middleware, and persistence through Prisma ORM to the relational database defined in `server/prisma/schema.prisma`. These operations are fundamental because they form the authoritative record for project work and drive notifications, reporting, and integrations.

Status management (Todo, In Progress, Done)

Status management enforces state transitions for tasks and is implemented as server-side business rules within service methods. Status changes are exposed via PATCH endpoints and generate domain events for the Notifications subsystem; validation ensures transitions follow allowed rules (for example, preventing Done → In Progress without explicit re-open). This is important to provide predictable workflow semantics and enable downstream automation.

Priority management (Low, Medium, High)

Priority is a discrete attribute stored on each task and surfaced in APIs and UI sorting. The backend persists priority as an enum (Prisma enum mapping) and the client uses priority metadata to display visual cues; sorting endpoints accept priority as a sort key. Priorities help users triage work and drive automated rules or ML models that may surface high-risk tasks.

Task categorization & tagging

Tasks support a category field plus multi-valued tags for flexible classification. Tags are stored as a normalized relation (or JSON array depending on schema) and are queryable via server-side filters implemented in Prisma queries. Categorization enables faceted search, reporting, and integration with ML classifiers in `ml-service/` for automated tagging suggestions.

Task sorting & filtering

The API supports query parameters for sorting and filtering (e.g., `sort=dueDate:asc`, `status=Todo`, `tags=research`). Implementation uses server-side query builders with Prisma to apply indexes and pagination to maintain performance. Sorting and filtering are essential for usability at scale to help users find priority tasks quickly.

Task assignment to members

Tasks can be assigned to one or more project members; assignment changes are validated against project membership and persisted in a join table. The server emits assignment events consumed by Notifications and audit services; the client-side `Assign` UI calls the relevant endpoints and reflects membership lists provided by the Projects/Members services. Assignment is crucial for accountability and workload distribution.

Task comments

The comments feature provides threaded or flat comments attached to tasks, with author, timestamp, and optional attachments. Comments are stored in a dedicated table and returned embedded within task responses or via paged comment endpoints; creation triggers notification events. Comments are central to asynchronous collaboration and contextual communication about work.

File attachments upload

Attachments are uploaded via multipart/form-data endpoints on the server and stored under `uploads/tasks/` with metadata persisted in the database (filename, mimeType, size, uploaderId). The implementation enforces server-side validation (file size, allowed types) and serves files via authenticated download endpoints; the client uploads directly to the server or to a presigned cloud storage URL when configured. Attachments enable sharing artifacts necessary to complete tasks, such as documents or screenshots.

Progress tracking

Progress is calculated as a derived attribute from child subtasks or completion markers and exposed as a numeric percentage in task responses. The server computes progress during relevant updates (subtask create/update/complete) and stores either the aggregated value or recomputes on read for consistency. Progress tracking provides quick insight into task completion and supports dashboards and reports.

## 5. Module Dependencies

- Auth / Identity: for authentication/authorization (client: `src/contexts/AuthContext.tsx`; server middleware and JWT handling).
- Projects & Members: to scope tasks to projects and validate/resolve assignees (client: `src/app/projects`; server: `server/src/controllers/projects`).
- Notifications: to publish in-app and push notifications on assignments, comments, and status changes.
- Uploads / File storage: server-side `uploads/tasks/` and optionally cloud storage for attachments.
- Database / Prisma: persistence layer located in `server/prisma/` used for task, comment, assignment, and audit models.
- ML microservice (`ml-service/`): optional dependency for classification, tagging suggestions, or risk scoring via asynchronous calls to the FastAPI service.

## 6. API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|---|---|---:|---:|
| POST | /api/tasks | Create a new task | Yes (JWT) |
| GET | /api/tasks/{id} | Retrieve task by ID (includes comments, attachments, assignees) | Yes |
| PUT | /api/tasks/{id} | Update task fields (title, description, dueDate, priority, tags, assignees) | Yes |
| DELETE | /api/tasks/{id} | Delete a task | Yes (permission-checked) |
| PATCH | /api/tasks/{id}/status | Update task status (Todo, In Progress, Done) | Yes |
| GET | /api/tasks | List tasks with filters, sorting, and pagination | Yes |
| POST | /api/tasks/bulk | Perform bulk operations on tasks (bulk status update, bulk assign) | Yes |
| POST | /api/tasks/{id}/comments | Add a comment to a task | Yes |
| GET | /api/tasks/{id}/comments | List comments for a task (paged) | Yes |
| POST | /api/tasks/{id}/attachments | Upload an attachment for a task (multipart/form-data) | Yes |
| GET | /api/tasks/{id}/attachments/{fileId} | Download an attachment (authorization checked) | Yes |
| GET | /api/projects/{id}/tasks/export | Export tasks for a project (format=json|csv) | Yes |
