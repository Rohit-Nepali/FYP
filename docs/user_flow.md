# Taskora — Detailed User Flow

This document describes the end-to-end user flow for Taskora, from app open to close, including client behavior, server interactions, background services, ML risk prediction, notifications, and persistence. It maps major steps to the components in the repository where relevant.

## Actors
- User (mobile / web client)
- Client app code (`client/`)
- Backend API (`server/`)
- Database + ORM (Prisma) (`server/prisma/`)
- ML service for risk prediction (`ml-service/`)
- Firebase / Push notifications (`client/firebase`, `server/` integrations)

## High-level components and responsibilities
- Client (`client/`): UI, local caching, auth flows, request orchestration, file uploads, background messaging handlers, NotificationProvider.
- Server (`server/src/`): REST API, controllers, services, validation, file storage endpoints, Prisma DB interactions, invoking ML prediction service.
- ML service (`ml-service/`): model loading, prediction API or callable interface, model metadata and training artifacts.
- Database (`server/prisma/schema.prisma`): stores users, projects, tasks, risk metadata, attachments, notifications.
- Background & push systems: Firebase Cloud Messaging, backgroundMessaging handler, NotificationProvider that displays and reacts to events.

---

## 1) App Open (Cold start)
1. OS launches the app binary (or user opens web route). Splash screen appears (`client/src/app/splash.tsx`).
2. App initializes global providers: theme, navigation, `AuthContext` and `NotificationProvider`.
3. `AuthContext` checks for a persisted auth token (secure store / async storage). If token found, it attempts a silent refresh or validates token with backend (`/auth/validate` or `GET /me`).
   - If valid: proceed to authenticated startup.
   - If invalid or absent: show onboarding / login screen and stop the auth-check flow.

## 2) Auth flow (if needed)
1. User chooses sign-in (email/password or `GoogleAuthProvider` flow in `client/providers/GoogleAuthProvider.tsx`).
2. OAuth flow completes (client receives credential or JWT); client stores token and user profile locally and registers FCM token for push notifications.
3. Client calls backend `POST /auth/login` or `POST /auth/oauth` to create/verify user in server DB. Server returns user profile + token.

## 3) Authenticated Startup
1. After auth validation, client parallel-fetches: user profile, user settings, list of joined projects, and user's tasks (APIs like `GET /projects`, `GET /tasks?assignedTo=me`).
2. Client hydrates local state (contexts and caches) and renders the primary navigation (dashboard, projects, tasks, notifications, profile).
3. Client registers background message handlers (see `client/src/firebase/backgroundMessaging.ts`) and subscribes to real-time updates if available (WebSockets or server-sent events) or relies on push notifications.

## 4) Main Navigation & Data Access Patterns
- Dashboard / Home: shows summaries, notifications, priority tasks, and activity feed. Data retrieved from `GET /dashboard` or aggregated client-side from `/tasks` and `/activities`.
- Projects list (Project index): `GET /projects` => displays project cards. Selecting a project loads project detail (`GET /projects/:id`) and tasks inside it.
- Boards / Lists: tasks are grouped by status; client fetches project tasks with filters and sorts.
- Task list & task item: small payload; clicking enters Task Detail view.

## 5) Create Task (detailed sequence)
1. User opens Create Task screen and fills form (title, description, due date, assignee, attachments, tags, priority).
2. Client uploads attachments first (if any) to server `POST /uploads` or to a pre-signed URL endpoint; server stores files in `uploads/` and returns URLs.
3. Client submits `POST /tasks` with the task payload and attachment URLs.
4. Server controller validates payload and calls a Task service (`server/src/services/taskService.js`) which:
   - Creates the task record in DB (Prisma).
   - Triggers risk prediction service (calls `taskRiskPrediction.service.js`).
5. `taskRiskPrediction.service.js` calls ML entrypoint (either in-process or HTTP call to `ml-service/`) with required features (task metadata, user workload, project context).
6. ML service (`ml-service/main.py` or `ml_engine.py`) returns a risk score and metadata. Server persists risk score alongside the task (e.g., `task.riskScore`, `task.riskMetadata`).
7. Server emits real-time update / webhook / notification to assignees: creates a Notification DB record and pushes FCM messages (or WebSocket event). Server may also write an activity log entry.
8. Client receives response for `POST /tasks` with the created task (including persisted risk). UI updates immediately with server record and risk badge.

Notes: The ML step is synchronous from the user's point of view (server waits for prediction) but must be fast; if the ML service is unavailable, server falls back to a default risk value and schedules an async re-evaluation job.

## 6) Update Task / Status transitions
1. User edits task fields or moves card between columns.
2. Client sends `PATCH /tasks/:id` to update fields.
3. Server validates and writes updates to DB. If key features that influence risk changed (due date, assignee, priority), server re-invokes risk prediction and updates `riskScore`.
4. Server emits change events and notifications. Frontend listens and updates views in near-real-time.

## 7) Assign, Invite, and Collaboration flows
- Assigning: `PATCH /tasks/:id` with `assigneeId`. Server adds assignment, creates activity entry, and sends notification to the assignee.
- Inviting users to project: `POST /projects/:id/invite` or `POST /invitations`. Server stores pending invite, sends email or push (if ephemeral) and a link to accept. On accept, server creates membership and triggers sync for the invited user.

## 8) Notifications & Background Messaging
- On server events (task assigned, comment added, due soon), server creates Notification records and sends push via FCM using stored device tokens.
- Client `NotificationProvider` shows notifications and routes user to relevant screens on click.
- Background messages are handled by `client/src/firebase/backgroundMessaging.ts` to show system-level notifications and update local caches.

## 9) Comments and Activity
- Adding a comment: `POST /tasks/:id/comments` -> server persists comment and emits activity + notifications.
- Activity feed: `GET /projects/:id/activity` or `GET /users/:id/activity` for feed aggregation.

## 10) File Uploads & Attachments
- Client uploads binary data to `POST /uploads` or pre-signed storage URLs; server persists metadata in DB and links attachments to tasks.
- Server enforces size limits, mime type checks, and virus scanning hooks if configured.

## 11) Search and Filters
- Client uses `GET /search?q=...` or backend filters `GET /tasks?filter=...`.
- Server uses Prisma queries and indexes to return fast results. Client caches recent queries locally for quick suggestions.

## 12) ML Model Lifecycle and Offline Handling
- Training & model artifacts live in `ml-service/models/` and `models/model_metadata.json`.
- Server loads model metadata at startup. Prediction calls follow this flow:
  - Prepare features from DB and request payload.
  - Call ML engine (direct Python call or HTTP endpoint in `ml-service/`).
  - Interpret output and persist.
- If ML endpoint is down: server logs error, returns default risk, and enqueues the task for async re-scoring (background worker or cron). A re-evaluation endpoint exists to process pending tasks.
- A gated retrain endpoint (`POST /retrain-risk-model`) refreshes the risk model artifacts.
- A nightly server scheduler (`server/src/services/modelRetrainScheduler.service.js`) can trigger retraining at 02:00 when `MODEL_RETRAIN_ENABLED=true`.

## 13) Background Re-Evaluation and Batch Jobs
- Periodic jobs re-score tasks after major model updates or when new features appear. These jobs read tasks in DB, call the ML service in batches, and update DB.
- Job outputs are stored in `reports/` and `ml-service/reports` for analysis.
- Model refresh jobs may also invoke the retrain endpoint before batch rescoring so the latest artifact set is used.

## 14) Security and Permissions
- All API endpoints validate JWTs and check resource permissions (project membership, task visibility).
- File uploads are access-checked; signed URLs expire.

## 15) Error Handling, Retries, and Offline UX
- Client shows optimistic updates for fast UX and rolls back on server error.
- For network failures, the client queues mutation requests and retries automatically when connectivity is restored.

## 16) Logout and App Close
- Logout: client clears stored tokens, unsubscribes from FCM, and navigates to login/onboarding.
- App close: background handlers keep device token alive for push; any queued sync operations run on next app open or background sync.

## 17) Example Sequence Summary (Create Task -> Notify -> Risk visible)
1. User fills form and presses Save.
2. Client uploads attachments, then `POST /tasks` with payload.
3. Server creates DB record -> invokes ML -> persists risk -> creates notifications -> returns created task.
4. Client updates UI with server task and shows `Risk: High` badge.
5. Assignee receives push notification and opens app; app navigates to Task Detail.

---

## Component Mapping (quick references)
- Client auth & providers: `client/src/providers/GoogleAuthProvider.tsx`, `client/src/contexts/AuthContext.tsx`
- Background messaging: `client/src/firebase/backgroundMessaging.ts`
- Notification provider: `client/src/providers/NotificationProvider.tsx`
- Server services: `server/src/services/taskService.js`, `server/src/services/taskRiskPrediction.service.js`
- ML service: `ml-service/main.py`, `ml-service/ml_engine.py`, `ml-service/models/`, `ml-service/model_metadata.json`
- Retrain scheduler: `server/src/services/modelRetrainScheduler.service.js`
- Prisma schema and migrations: `server/prisma/schema.prisma`, `server/prisma/migrations/`

---

## Operational notes and fallback strategies
- ML prediction should be made tolerant: fall back to default risk and schedule async re-score if prediction fails.
- Ensure idempotency for task creation endpoints to avoid duplicate tasks on retries.
- Use message deduplication for push notifications to prevent spam.

---

## Next steps and useful additions
- Add a sequence diagram for the `Create Task` flow (if desired).
- Document rate limits and SLA expectations for ML service.
- Add a health-check endpoint for ML service and expose to server monitoring.


---

Generated: May 12, 2026
