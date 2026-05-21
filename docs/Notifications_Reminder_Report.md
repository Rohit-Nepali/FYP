# Notifications & Reminder Module

## 1. Subsystem Overview

The Notifications & Reminder Module provides in-app and push-based communication capabilities for Taskora, responsible for delivering time-sensitive task updates, scheduled digests, deadline reminders, and risk alerts to users. It acts as the delivery layer that translates domain events (task assignment, status changes, risk flags) into user-visible notifications persisted in the platform database and optionally pushed to device endpoints via Firebase Cloud Messaging (FCM). The module runs as an Express-based notification service within the backend, and integrates with the mobile client (React Native) and the core Node server services.

This subsystem integrates closely with the `Tasks` and `Projects` modules (to observe task lifecycle events and retrieve task metadata), the `Auth` module (for user identity and authorization and to resolve user IDs), and the AI/ML FastAPI microservice in `ml-service` (to receive risk classifications and model-driven insights that can trigger risk alerts). It uses a small persistent schema for notifications and token storage (e.g., `notifications`, `fcm_tokens`, `digest_logs`) exposed via REST endpoints consumed by the client. Cron-based schedulers trigger bulk digest and reminder flows.

Technically, the implementation uses an Express notification service for business logic, Prisma ORM for persistence to the existing relational database, a cron scheduler (e.g., `node-cron` or OS-level cron invoking an HTTP webhook) to schedule digest and reminder jobs, and the Firebase HTTP v1 API to deliver push messages. The service enforces authorization via JWT tokens validated against the existing `Auth` middleware and respects user-level preferences stored alongside user profiles.

## 2. Functional Requirements

- FR-NO-01: The system SHALL persist every generated notification in a `notifications` store with a unique `id`, `user_id`, `type`, `title`, `body`, `is_read`, `reference_id`, `reference_type`, and `created_at` timestamp.
- FR-NO-02: The system SHALL provide an API endpoint to fetch a paginated list of notifications for the authenticated user ordered by `created_at` (newest first).
- FR-NO-03: The system SHALL support per-user FCM tokens and provide API endpoints to register and update `FCMToken` records.
- FR-NO-04: The system SHALL send push notifications via Firebase Cloud Messaging when a pushable notification is created and an up-to-date FCM token exists for the target device.
- FR-NO-05: The system SHALL create and deliver an in-app notification record for all notification types, independent of push delivery success.
- FR-NO-06: The system SHALL expose an endpoint to mark a notification as read for the authenticated user; changes SHALL update the `is_read` attribute and be persisted immediately.
- FR-NO-07: The system SHALL provide a daily digest feature that aggregates a user's pending tasks for the next 24 hours into a single digest notification and create corresponding `Notification` and `DigestLog` records.
- FR-NO-08: The system SHALL schedule and execute deadline reminder checks at configurable intervals (e.g., hourly) that identify tasks within a configurable threshold and issue reminders.
- FR-NO-09: The system SHALL accept risk alerts from the `ml-service` and create corresponding risk notifications when a task or project exceeds configured risk thresholds.
- FR-NO-10: The system SHALL respect user notification preferences prior to sending any push or in-app notification (e.g., opt-out, channel preferences, quiet hours) and log decisions for audit.
- FR-NO-11: The system SHALL log digest send events in a `digest_logs` store with `id`, `user_id`, `sent_at`, and `tasks_included` for audit and debugging.
- FR-NO-12: The system SHALL support querying notification history for an authenticated user, including filters for `is_read`, `type`, and date range.
- FR-NO-13: The system SHALL provide server-side deduplication logic to prevent duplicate notifications for the same source event within a configurable window.
- FR-NO-14: The system SHALL expose administrative endpoints to re-trigger or re-send digests and reminders for debugging, protected by elevated admin authorization.

## 3. Non-Functional Requirements

- NFR-01 (Performance): Typical API fetch requests for a single user's most recent 50 notifications SHALL respond within 200 ms under normal load (p95).
- NFR-02 (Throughput): The notification service SHALL be able to submit up to 500 push requests per second to the FCM outbound subsystem in burst scenarios, with graceful degradation when limits are reached.
- NFR-03 (Security): All API endpoints SHALL require JWT-based authentication and validate the token against the `Auth` module; notification creation endpoints SHALL verify the caller's authorization scope.
- NFR-04 (Data Protection): Persistent notification content and FCM tokens SHALL be stored encrypted-at-rest using database encryption features or field-level encryption where supported.
- NFR-05 (Scalability): The notification service SHALL be horizontally scalable; scheduled digest and reminder jobs SHALL be designed to avoid duplicate execution when multiple instances are running (leader-election or distributed lock).
- NFR-06 (Reliability): Digest and reminder scheduling SHALL guarantee at-least-once delivery semantics with idempotent processing and retry policies; system shall maintain 99.9% uptime for the notification API.
- NFR-07 (Usability): The mobile client SHALL expose a clear notification UI showing read/unread state and allow users to manage notification preferences; API responses SHALL include sufficient metadata for UI rendering (e.g., `reference_type`, `reference_id`, `actions`).
- NFR-08 (Compatibility): Push delivery SHALL be supported for both iOS and Android Expo-managed builds; the system SHALL include platform-specific payload variants (APNS/FCM fields) as required.
- NFR-09 (Observability): All notification deliveries, failures, and scheduler runs SHALL be logged and exposed to monitoring/alerting systems (response times, failure counts, FCM error rates).

## 4. Key Features Breakdown

In-app notification system

The in-app notification system persists notifications in a relational store and exposes REST endpoints for listing, filtering, and updating read state. Implementation uses Prisma ORM models mapped to a `notifications` table and an Express controller layer that enforces user-scoped queries. This feature is important because it provides an auditable, consistent history of notifications irrespective of push delivery success and forms the canonical source of truth for notification state.

FCM push notifications

Push notifications are sent through Firebase Cloud Messaging using the FCM HTTP v1 API; the service manages per-user `FCMToken` records which include `platform` metadata to tailor payloads. The Express service composes FCM payloads and handles common FCM responses (token expired, invalid, rate-limited) with retry and token cleanup logic. Push notifications are critical for immediate user engagement and for surface-level reminders when the app is backgrounded.

Daily digest notification

Daily digests aggregate a user's pending tasks for the next 24 hours into a consolidated payload produced by the notification service. A cron-triggered job queries the `Tasks` service for items, the service builds a compact digest payload, writes digest notifications and a `DigestLog` entry, and issues a single push and multiple in-app records as configured. Digests reduce notification noise while ensuring users receive a concise summary of imminent work.

Deadline reminder triggers

Deadline reminders are implemented as scheduled checks (cron or scheduled worker) that query the `Tasks` datastore for tasks with `due_date` within a configurable threshold. For each qualifying task the service creates a `Notification`, checks user preferences, and attempts to send push/in-app reminders. This mechanism ensures users are proactively alerted to impending due dates, improving task completion rates.

Risk alert notifications

Risk alerts are produced when the FastAPI `ml-service` classifies a task or project as high risk; the `ml-service` sends events or a webhook to the notification service, which then generates risk-type notifications and optionally triggers higher-priority push templates. Technical implementation uses authenticated HTTP calls between services and structured risk payloads; these alerts enable early intervention and are essential for surfaced AI-driven insights.

Notification read/unread state

The read/unread state is stored in the `notifications` table via an `is_read` boolean and updated atomically through REST PATCH endpoints. The client updates state when users view or interact with a notification; server-side logic enforces ownership checks to prevent unauthorized state changes. Accurate read-state tracking is important to support user workflows and UI affordances such as unread counts and notification badges.

User notification preferences respected

User preferences (channels enabled, quiet hours, risk alert opt-in) are stored as part of the user profile or a dedicated `notification_preferences` record. The notification service consults these preferences prior to sending any push or digest, and records the decision outcome for auditing. Respecting preferences preserves user control, reduces unwanted interruptions, and ensures compliance with user expectations.

Cron job scheduling for digests & reminders

Scheduled jobs are run via a reliable scheduler (e.g., `node-cron` with distributed locking, or an external scheduler invoking HTTP endpoints). Jobs perform discovery queries against the `Tasks` and `ml-service` outputs, then invoke the notification flows. The scheduling architecture includes leader election or distributed locks to avoid duplicate sends in multi-instance deployments and implements exponential backoffs and idempotency keys for robust processing.

## 5. Module Dependencies

- `Tasks` module: provides task records, due dates, assignment data and emits domain events used to generate notifications and reminders.
- `Projects` module: supplies project context and membership information used in notification content and access control.
- `Auth` module: provides JWT authentication and user identity resolution used to authorize API access and map notification recipients.
- `ml-service` (FastAPI): supplies risk classifications and insights that can trigger risk alert notifications.
- `Uploads` / file storage: referenced resources in notifications (attachments, images) are stored here and used when rendering notification content.
- `Database` (Prisma-backed relational DB): persistent storage for `notifications`, `fcm_tokens`, and `digest_logs`.
- `Firebase Cloud Messaging` (external): third-party service used to deliver push notifications to devices.

## 6. API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|---|---|---:|:---:|
| GET | /api/notifications | Fetch paginated notifications for authenticated user (filters: is_read, type, date range) | Yes |
| GET | /api/notifications/:id | Fetch single notification details (must belong to authenticated user) | Yes |
| PATCH | /api/notifications/:id/read | Mark notification as read/unread (payload: { is_read: boolean }) | Yes |
| POST | /api/notifications/fcm-token | Register or update an FCM token for the authenticated user (payload: { token, platform }) | Yes |
| POST | /api/notifications/push | Server-side endpoint to create a notification and attempt push delivery (used by internal services) | Yes (internal service token) |
| POST | /api/notifications/digest/trigger | Trigger daily digest generation for a user or system-wide (admin or scheduled use) | Yes (admin or scheduler token) |
| POST | /api/notifications/reminder/trigger | Trigger immediate reminder processing for a set of tasks (admin or scheduler usage) | Yes (admin or scheduler token) |
| GET | /api/notifications/preferences | Get notification preferences for authenticated user | Yes |
| PATCH | /api/notifications/preferences | Update notification preferences for authenticated user | Yes |

