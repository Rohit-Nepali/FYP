# Notifications & Reminder Module — Diagram Data

## 1. Use Case Diagram Data

### Actors
- System (Cron Scheduler)
- Authenticated User
- Firebase Cloud Messaging (FCM)
- Express Notification Service
- Task & Risk Services

### Use Cases
- Create Notification
- Store Notification
- Fetch Notifications
- View Notifications
- Mark Notification As Read
- Register FCM Token
- Update FCM Token
- Send Push Notification
- Send In-App Notification
- Schedule Daily Digest
- Build Digest Payload
- Send Daily Digest
- Log Digest
- Check Upcoming Deadlines
- Schedule Deadline Reminder
- Send Deadline Reminder
- Respect Notification Preferences

### Relationships
- System (Cron Scheduler) --> Create Notification
- System (Cron Scheduler) --> Schedule Daily Digest
- System (Cron Scheduler) --> Check Upcoming Deadlines
- Authenticated User --> View Notifications
- Authenticated User --> Mark Notification As Read
- Authenticated User --> Register FCM Token
- Firebase Cloud Messaging (FCM) --> Send Push Notification
- Express Notification Service --> Store Notification
- Express Notification Service --> Send Push Notification
- Express Notification Service --> Send In-App Notification
- Express Notification Service --> Build Digest Payload
- Express Notification Service --> Log Digest
- Task & Risk Services --> Create Notification
- Create Notification <<include>> Store Notification
- Send Daily Digest <<include>> Build Digest Payload
- Send Daily Digest <<include>> Send Push Notification
- Schedule Deadline Reminder <<include>> Send Deadline Reminder

## 2. Entity Relationship Diagram (ERD) Data

### Entities & Attributes
- Notification (id: String @id @default(cuid()), userId: String, type: String, title: String, message: String, isRead: Boolean @default(false), isArchived: Boolean @default(false), data: Json?, createdAt: DateTime @default(now()), readAt: DateTime?, ignoredAt: DateTime?, archivedAt: DateTime?)
- (Push tokens are stored on `User.pushToken`: `pushToken: String?`)
- DailyDigestLog (id: String @id @default(cuid()), userId: String, digestDateKey: String, timezone: String, deliveryChannel: String @default("in_app"), payloadHash: String, sentAt: DateTime @default(now()))

### Relationships
- Notification --belongs-to--> FCMToken (cardinality: many-to-one)
- Notification --belongs-to--> User (cardinality: many-to-one)
- FCMToken --belongs-to--> User (cardinality: many-to-one)
- DigestLog --records-for--> User (cardinality: many-to-one)
- DigestLog --includes--> Notification (cardinality: one-to-many)

## 3. Sequence Diagram Data

Flow 1: Push notification
1. System (Cron Scheduler) -> Express Notification Service : trigger event / emit notification event
2. Express Notification Service -> Database (notifications) : create Notification record
3. Express Notification Service -> Database (fcm_tokens) : fetch FCMToken for user
4. Express Notification Service -> Firebase Cloud Messaging (FCM) : call FCM send API with payload and token
5. Firebase Cloud Messaging (FCM) -> Device (client app) : deliver push notification
6. Device (client app) -> Express Notification Service : acknowledge delivery (optional)

Error handling:
- Missing FCM config or push token -> push delivery is skipped, but the in-app Notification record is still created.
- FCM send failure -> error is logged and the service continues without crashing the notification workflow.

Flow 2: Daily digest
1. System (Cron Scheduler) -> Express Notification Service : scheduled digest trigger
2. Express Notification Service -> Task & Risk Services : fetch user's pending tasks for next 24hrs
3. Task & Risk Services -> Express Notification Service : return tasks list
4. Express Notification Service -> Express Notification Service : build digest payload
5. Express Notification Service -> Firebase Cloud Messaging (FCM) : send FCM push with digest payload
6. Express Notification Service -> Database (notifications) : create in-app Notification records for digest
7. Express Notification Service -> Database (digest_logs) : log digest in DigestLog

Error handling:
- 400 Bad Request -> Digest preference updates reject invalid digest hours outside 0-23.
- 404 Not Found -> Notification update actions return "Notification not found" when the target record does not exist.
- Disabled digest preference -> digest send is skipped for that user and only the stored preference is updated.

Flow 3: Deadline reminder
1. System (Cron Scheduler) -> Task & Risk Services : query tasks with due_date within threshold
2. Task & Risk Services -> Express Notification Service : list at-risk tasks and owners
3. Express Notification Service -> Database (notifications) : create Notification for each at-risk task
4. Express Notification Service -> Database (fcm_tokens) : fetch FCMToken for task owner
5. Express Notification Service -> Firebase Cloud Messaging (FCM) : send FCM push for deadline reminder
6. Express Notification Service -> Database (notifications) : update notification status if send confirmed
7. Express Notification Service -> User Preferences Store : respect Notification Preferences before sending

Error handling:
- 403 Forbidden -> User-facing notification actions that touch restricted resources should return access denied instead of opening the task.
- 404 Not Found -> Mark/read/archive/delete actions return "Notification not found" for missing or already-removed items.
- Missing push token -> deadline reminder stays in-app only and does not attempt FCM delivery.

## 4. Activity Diagram Data

### Start node
- Start

### Actions (in order, one per line)
- Open App / Receive Background Push
- Check Notification List
- Display Notification Items
- User Selects Notification
- Navigate To Referenced Resource (e.g., Task)
- Perform Action On Task (if applicable)
- Mark Notification As Read
- Handle notification delivery or preference errors without blocking the inbox view

### Decision points (format: DECISION: [condition] → [yes path] / [no path])
- DECISION: [Notification has reference?] → Navigate To Referenced Resource / Show Notification Details
- DECISION: [User has permission for referenced resource?] → Display Resource / Show Access Denied
- DECISION: [Notification requires immediate action?] → Prompt User Action / Dismiss
- DECISION: [Notification record exists?] → Mark read/archive/delete / Show 404 not found
- DECISION: [Push token and FCM config available?] → Send push / Keep notification in-app only

### End node
- End

## 5. Component/Architecture Diagram Data

[React Native Notification Screen] --> [Express Notification Service] : REST API / GraphQL
[React Native Background Handler / FCM SDK] --> [Firebase Cloud Messaging (FCM)] : push channel
[Express Notification Service] --> [Database (notifications, fcm_tokens, digest_logs)] : read/write
[Express Notification Service] --> [Task & Risk Services] : internal service API / RPC
[Express Notification Service] --> [FastAPI ML Service] : HTTP REST (risk classification / insights)
[Task & Risk Services] --> [Database (tasks)] : read
[Express Notification Service] --> [Firebase Cloud Messaging (FCM)] : FCM HTTP API
[Digest Scheduler (Cron)] --> [Express Notification Service] : scheduled trigger
[Authenticated User] --> [React Native Notification Screen] : UI interaction
[Express Notification Service] --> [Logging / Monitoring] : audit events

