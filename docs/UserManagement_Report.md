# User Management Module

## 1. Subsystem Overview

The User Management Module implements user identity, authentication, profile management and user-related preferences for Taskora. It provides the server-side endpoints and business logic (Express controllers and services) and the client-side integration (React Native AuthContext and authService) required to register, authenticate, maintain sessions, and manage user profiles and notification preferences.

This subsystem is integrated with several other Taskora modules: the frontend client located under `client/` (specifically `src/contexts/AuthContext.tsx` and `src/services/authService.ts`), the server API routes (`server/src/routes/auth.router.js` and `server/src/routes/user.router.js`), the persistence layer via Prisma (`server/src/config/db.js` and Prisma models used in `server/src/services/auth.service.js` and `user.service.js`), the `email.service` for verification and password reset messages, and the `mlClassification.service` for behavioral-signal classification (ML backend runs as a FastAPI service in `ml-service/`). The module also writes and serves uploaded avatar assets from the `uploads/` directory (`server/src/app.js` exposes `/uploads`).

Technically, authentication is implemented using JWTs (short-lived access tokens and 7-day refresh tokens) produced by `server/src/utils/jwt.utils.js`. Passwords are hashed with `bcryptjs`. Input validation is performed with `joi` schemas (`server/src/validator/auth.validator.js`). Sessions are persisted in a `userSession` table via Prisma so refresh tokens can be validated and revoked server-side. File uploads use a Multer-based middleware (`server/src/middleware/upload.middleware.js`) and avatar updates are handled in `user.controller.js` / `user.service.js`.

## 2. Functional Requirements

FR-US-01: The system shall allow a new user to register with name, email and password via `POST /api/auth/sign-up` and return a response indicating whether email verification is required.

FR-US-02: The system shall allow a user to authenticate by email and password via `POST /api/auth/sign-in` and return an access token and refresh token on successful authentication.

FR-US-03: The system shall allow sign-in / sign-up using Google OAuth tokens via `POST /api/auth/google-signup` and `POST /api/auth/google-signin`, accepting Google identifier, email and profile image, and returning JWT tokens.

FR-US-04: The system shall issue a short-lived JWT access token (default 45 minutes) and a refresh token (default 7 days) on successful authentication; it shall store refresh tokens in `userSession` (Prisma) and return both tokens in the API response.

FR-US-05: The system shall validate access tokens on protected routes using middleware (`authenticateToken`) and reject requests missing or containing invalid/expired tokens with HTTP 401.

FR-US-06: The system shall support refreshing tokens by accepting a valid refresh token at `POST /api/auth/refresh-token`, validating the stored session and returning a new access token and refresh token.

FR-US-07: The system shall provide an email verification flow: generate a 6-digit verification code, persist it (expires in 15 minutes), send it by email, and expose `POST /api/auth/verify-email` and `POST /api/auth/resend-verification` to verify or resend the code.

FR-US-08: The system shall provide a password reset workflow where a numeric reset token (6 digits, expires in 10 minutes) is generated and persisted, `POST /api/auth/forgot-password` triggers generation and emailing (if the account exists), `POST /api/auth/verify-reset-token` validates the token and `POST /api/auth/reset-password` sets a new password and invalidates existing sessions. Exception: accounts created or linked via Google OAuth (have `googleId`) are not allowed to change passwords via the reset flow; `POST /api/auth/forgot-password` will return a success-like response with `isOAuth=true` and `provider="google"` and a message instructing the user to sign in with Google. The client must surface this message and offer Google Sign-In instead of email-based reset for such accounts.

FR-US-09: The system shall allow users to view their profile via `GET /api/auth/profile` (protected) and allow profile updates and account deletion via `PUT /api/users/profile` and `DELETE /api/users/profile` (protected), with input validation and email format checks.

FR-US-10: The system shall allow users to upload and update an avatar image via `POST /api/users/profile/avatar` (multipart/form-data) and persist the resulting file path; requests without a file must return HTTP 400.

FR-US-11: The system shall allow users to configure notification preferences (digest settings) via `PATCH /api/users/preferences/digest` and manage push tokens via `POST /api/users/push-token` for push notifications.

FR-US-12: The system shall expose notification management endpoints (list, unread count, mark read, archive, delete) under `/api/users/notifications` and ensure operations are authorized for the requesting user.

FR-US-13: The system shall allow explicit logout via `POST /api/auth/logout` which deletes all sessions for the requesting user and invalidates refresh tokens stored server-side.

FR-US-14: The system shall validate and sanitize input for all public authentication endpoints using `joi` schemas in `server/src/validator/auth.validator.js`.

FR-US-15: The system shall maintain session information for refresh-token validation, including `ipAddress`, `deviceInfo`, `expiresAt`, and `refreshToken`, stored in the database and used by `auth.service.refreshToken`.

## 3. Non-Functional Requirements

- Performance: 95% of authentication and profile API requests shall respond within 300 ms under normal load (single-instance testing); token refresh under 100 ms when session record exists.
- Security: Passwords must be hashed with a secure algorithm (`bcryptjs` with a cost factor of 10). JWT secrets must be read from environment variables (`JWT_SECRET`, `JWT_REFRESH_SECRET`) and not committed to source control. All protected endpoints must validate the JWT access token server-side. Sensitive actions (password reset, email verification) must use short-lived numeric tokens and single-use semantics.
- Scalability: The service shall allow horizontal scaling of stateless API instances; session persistence (refresh tokens) must be stored centrally (Prisma-backed database) so any instance can validate refresh tokens. File storage may be migrated to object storage (S3) to support large scale.
- Reliability / Availability: Authentication flows shall tolerate intermittent failures of the email service by returning appropriate service-unavailable errors for verification-only flows; sessions shall be resilient to process restarts because they are persisted in the database.
- Usability: Client libraries in `client/src/services/authService.ts` provide predictable error messages and automatic token refresh. User-facing flows (email OTP, password reset) must include clear messages and single-resend rate limits (rate limiters are implemented in `server/src/middleware/rateLimit.middleware.js`).
- Compatibility: The client-side implementation supports both iOS and Android (React Native / Expo); Google sign-in is provided via platform-specific configuration (Google client IDs present in `client/.env` and `google-services.json`).

## 4. Key Features Breakdown

Email register/login
What it does: Allows users to create an account with email/password and later authenticate using those credentials. How implemented: `auth.service.signUp` hashes passwords using `bcryptjs`, issues a verification code via `email.service`, and `auth.service.signIn` validates credentials then issues JWTs via `server/src/utils/jwt.utils.js`. Why important: This is the primary identity method that enables user-specific data, access control and personalized features.

Google OAuth login
What it does: Allows users to register or sign in using Google account details supplied by the client. How implemented: Client obtains Google tokens (configured via `client/.env` and `google-services.json`) and posts them to `POST /api/auth/google-signup` or `POST /api/auth/google-signin`; `auth.service` links or creates a user record and issues JWT tokens. Why important: Provides a friction-reduced sign-in option and allows reuse of verified email identity.

JWT Authentication
What it does: Secures protected server endpoints using bearer tokens and supports session revocation via refresh-token sessions. How implemented: Access tokens are signed by `jsonwebtoken` (`generateAccessToken` default 45m) and validated in `authenticateToken` middleware; refresh tokens are long-lived (7d), stored in `userSession` (Prisma) and rotated via `POST /api/auth/refresh-token`. Why important: Enables stateless, scalable authentication with server-side session control for refresh tokens.

Password reset & email verification
What it does: Email verification ensures account ownership; password reset allows users to re-establish account access. How implemented: Short-lived numeric tokens are created and persisted (`emailVerification`, `passwordReset` tables in Prisma), emailed via `email.service`, and verified through `auth.controller` endpoints. Why important: Protects account integrity and provides recovery mechanisms.
Note: Password reset is disabled for Google-OAuth accounts. The API will not create a `passwordReset` record for accounts with `googleId`, and will return an informational response indicating the account uses Google Sign-In. The client should prompt the user to sign in with Google.

Profile view / update / delete
What it does: Users can retrieve their profile (`GET /api/auth/profile`), update metadata (`PUT /api/users/profile`) and delete their account (`DELETE /api/users/profile`). How implemented: `auth.controller.getProfile` and `user.controller.updateProfile` call `auth.service` / `user.service` to read/update Prisma records with validation checks. Why important: Profile management supports personalization and GDPR-style account removal.

Avatar upload
What it does: Allows users to upload a profile image and update their `profileImage` reference. How implemented: An upload middleware based on Multer (`upload.middleware.js`) accepts multipart/form-data at `POST /api/users/profile/avatar`, the controller validates presence of a file and `user.service.updateAvatar` persists file metadata and updates the user record; static files served from `/uploads`. Why important: Improves UX and identification of users inside the app.

Notification preferences
What it does: Users can store preferences for daily digests (timezone, local hour) and register push tokens for device notifications. How implemented: `PATCH /api/users/preferences/digest` updates digest preferences in `user.service`; `POST /api/users/push-token` stores push tokens. Notification listing and state management are exposed via `GET /api/users/notifications` and related endpoints, implemented in `user.controller` and `notification.service`. Why important: Enables timely user-facing alerts and digest emails.

User session validation
What it does: Ensures refresh tokens are valid, associated with an existing stored session, and not expired; used to issue new access tokens. How implemented: `auth.service.refreshToken` uses `verifyRefreshToken` and checks `userSession` entries in the database (Prisma). Why important: Prevents token misuse and allows server-side logout/invalidation of refresh tokens.

JWT token expiration handling
What it does: Handles expired access tokens by allowing the client to renew them using refresh tokens; client automatically attempts refresh when an API request receives HTTP 401. How implemented: Client `apiClient` interceptor inspects 401 responses, prevents concurrent refresh races with a queue, posts to `/api/auth/refresh-token`, stores new tokens in `AsyncStorage`, and retries the original request. Why important: Provides seamless UX while keeping access tokens short-lived for security.

## 5. Module Dependencies

- `client/` (React Native): `AuthContext.tsx`, `authService.ts`, `apiClient.ts` — provides token storage, automatic refresh logic and UI integration for authentication flows.
- `server/src/services/email.service.js`: Used for sending verification and password-reset emails.
- `server/src/services/notification.service.js`: Notification storage and retrieval used by the user notification endpoints.
- `server/src/services/priority.service.js` and `status.service.js`: Called during user creation to ensure per-user defaults are created (`ensureStandaloneDefaultsForUser`).
- `prisma` (database): Persistent storage of `user`, `userSession`, `emailVerification`, `passwordReset`, `notifications` and other user-related records.
- `ml-service/` (FastAPI): The ML classification service (`mlClassification.service.js` calls `http://localhost:8000/classify`) is used to produce behavioral labels used in insights and behavioral signals that can be cleared via user privacy endpoints.
- `uploads/` static assets: Avatar file storage and static serving via `server/src/app.js`.

## 6. API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|---|---|---:|:---:|
| POST | /api/auth/sign-up | Register new user (email/password). Returns requiresEmailVerification flag. | No |
| POST | /api/auth/sign-in | Authenticate with email/password; returns accessToken and refreshToken. | No |
| POST | /api/auth/google-signup | Sign up using Google account payload (googleId, email, profileImage). | No |
| POST | /api/auth/google-signin | Sign in using Google account payload; returns tokens. | No |
| POST | /api/auth/refresh-token | Exchange refresh token for new access and refresh tokens. | No (accepts refresh token in body) |
| POST | /api/auth/logout | Logout and invalidate user sessions. | Yes |
| GET | /api/auth/profile | Retrieve current user profile. | Yes |
| GET | /api/auth/user/:email | Retrieve user by email. | Yes |
| POST | /api/auth/verify-email | Verify email using 6-digit code. | No |
| POST | /api/auth/resend-verification | Resend verification code. | No |
| POST | /api/auth/forgot-password | Initiate password reset (send code if account exists). | No |
| POST | /api/auth/verify-reset-token | Verify a password reset token. | No |
| POST | /api/auth/reset-password | Reset password using valid reset token. | No |
| GET | /api/users | Search users (query param `search`). | Yes |
| POST | /api/users/push-token | Add device push token for user notifications. | Yes |
| GET | /api/users/notifications | List user notifications (query params: unreadOnly, archivedOnly). | Yes |
| GET | /api/users/notifications/unread-count | Return unread notification count. | Yes |
| PATCH | /api/users/notifications/:notificationId/read | Mark a notification as read. | Yes |
| PATCH | /api/users/notifications/:notificationId/ignored | Mark a notification as ignored. | Yes |
| PATCH | /api/users/notifications/:notificationId/archive | Archive a notification. | Yes |
| PATCH | /api/users/notifications/:notificationId/unarchive | Unarchive a notification. | Yes |
| DELETE | /api/users/notifications/:notificationId | Delete a notification. | Yes |
| PUT | /api/users/profile | Update name, email or profileImage. | Yes |
| DELETE | /api/users/profile | Delete user account. | Yes |
| POST | /api/users/profile/avatar | Upload avatar image (multipart/form-data, field `file`). | Yes |
| PATCH | /api/users/preferences/digest | Update digest notification preferences (timezone, dailyDigestEnabled, digestHourLocal). | Yes |
| DELETE | /api/users/privacy/behavioral-signals | Clear behavioral signals (privacy). | Yes |
