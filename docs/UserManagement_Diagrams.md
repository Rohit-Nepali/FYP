# User Management Module — Diagram Data

## 1. Use Case Diagram Data

### Actors
- Unauthenticated User
- Authenticated User
- System (JWT Service)
- Google OAuth Provider
- Email Service

### Use Cases
- Register Account
- Verify Email
- Resend Verification Code
- Login with Email
- Login with Google
- Refresh Token
- Logout
- View Profile
- Update Profile
- Delete Account
- Upload Avatar
- Request Password Reset
- Verify Reset Token
- Reset Password
- Add Push Token
- Update Digest Preferences
- List Notifications
- Get Unread Notification Count
- Mark Notification As Read
- Mark Notification As Ignored
- Archive Notification
- Unarchive Notification
- Delete Notification
- Clear Behavioral Signals
- Search Users

### Relationships
[Unauthenticated User] --> [Register Account]
[Unauthenticated User] --> [Login with Email]
[Unauthenticated User] --> [Login with Google]
[Unauthenticated User] --> [Request Password Reset]
[Unauthenticated User] --> [Verify Reset Token]
[Unauthenticated User] --> [Reset Password]
[Authenticated User] --> [View Profile]
[Authenticated User] --> [Update Profile]
[Authenticated User] --> [Delete Account]
[Authenticated User] --> [Upload Avatar]
[Authenticated User] --> [Add Push Token]
[Authenticated User] --> [Update Digest Preferences]
[Authenticated User] --> [List Notifications]
[Authenticated User] --> [Get Unread Notification Count]
[Authenticated User] --> [Mark Notification As Read]
[Authenticated User] --> [Mark Notification As Ignored]
[Authenticated User] --> [Archive Notification]
[Authenticated User] --> [Unarchive Notification]
[Authenticated User] --> [Delete Notification]
[Authenticated User] --> [Clear Behavioral Signals]
[Authenticated User] --> [Search Users]
[System (JWT Service)] --> [Refresh Token]
[Google OAuth Provider] --> [Login with Google]
[Email Service] --> [Verify Email]
[Email Service] --> [Request Password Reset]

[Register Account] <<include>> [Verify Email]
[Request Password Reset] <<include>> [Verify Reset Token]

## 2. Entity Relationship Diagram (ERD) Data

### Entities & Attributes
- User (id: String @id @default(cuid()), email: String @unique, name: String, passwordHash: String?, emailVerified: Boolean @default(false), emailVerifiedAt: DateTime?, role: userRole @default(USER), profileImage: String?, googleId: String?, googleRefreshToken: String?, pushToken: String?, timezone: String @default("UTC"), dailyDigestEnabled: Boolean @default(true), digestHourLocal: Int @default(19), createdAt: DateTime @default(now()), updatedAt: DateTime @updatedAt)
- UserSession (id: String @id @default(uuid()), userId: String, refreshToken: String @unique, ipAddress: String?, deviceInfo: String?, createdAt: DateTime @default(now()), expiresAt: DateTime)
- EmailVerification (id: String @id @default(cuid()), userId: String, token: String, expiresAt: DateTime, createdAt: DateTime @default(now()))
- PasswordReset (id: String @id @default(cuid()), userId: String, token: String @unique, expiresAt: DateTime, createdAt: DateTime @default(now()))
- Notification (id: String @id @default(cuid()), userId: String, type: String, title: String, message: String, isRead: Boolean @default(false), isArchived: Boolean @default(false), data: Json?, createdAt: DateTime @default(now()), readAt: DateTime?, ignoredAt: DateTime?, archivedAt: DateTime?)
- UserBehaviorSignal (id: String @id @default(cuid()), userId: String, taskId: String?, label: String, confidence: Float, deletedAt: DateTime?, createdAt: DateTime @default(now()))
- DailyDigestLog (id: String @id @default(cuid()), userId: String, digestDateKey: String, timezone: String, deliveryChannel: String @default("in_app"), payloadHash: String, sentAt: DateTime @default(now()))

### Relationships
[User] --one-to-many--> [UserSession] (cardinality: one-to-many)
[User] --one-to-many--> [EmailVerification] (cardinality: one-to-many)
[User] --one-to-many--> [PasswordReset] (cardinality: one-to-many)
[User] --one-to-many--> [Notification] (cardinality: one-to-many)
[User] --one-to-one--> [NotificationPreference] (cardinality: one-to-one)
[User] --one-to-many--> [BehavioralSignal] (cardinality: one-to-many)


## 3. Sequence Diagram Data

Flow 1: Registration flow
1. [Unauthenticated User] -> [Frontend] : submit registration form (name,email,password)
2. [Frontend] -> [Auth API (POST /api/auth/sign-up)] : POST payload
3. [Auth Controller] -> [Validation Layer] : validate input (joi)
4. [Auth Service] -> [Hashing Library (bcryptjs)] : hash password
5. [Auth Service] -> [Database (Prisma)]: create/update User and EmailVerification record
6. [Auth Service] -> [Email Service] : send email verification code
7. [Auth API] -> [Frontend] : return response (requiresEmailVerification = true)

Error handling:
- 400 Validation Error -> Frontend shows field-level validation messages for missing/invalid name, email, or password.
- 409 Conflict -> Auth API returns "User with this email already exists" when the email is already verified.
- 503 Service Unavailable -> Auth API returns "Email verification service is unavailable" when SMTP is not configured.

Flow 2: Google OAuth
1. [Unauthenticated User] -> [Frontend] : tap Google login
2. [Frontend] -> [Google OAuth Provider] : redirect / obtain tokens (client-side flow)
3. [Frontend] -> [Auth API (POST /api/auth/google-signup or /google-signin)] : send googleId, email, profileImage, accessToken, refreshToken
4. [Auth Controller] -> [Auth Service] : signUpWithGoogle / signInWithGoogle
5. [Auth Service] -> [Database (Prisma)] : upsert user record (link googleId) and create UserSession
6. [Auth Service] -> [JWT Service] : generate accessToken and refreshToken
7. [Auth API] -> [Frontend] : return { user, accessToken, refreshToken }

Error handling:
- 404 Not Found -> Sign-in flow returns "No account found with this Google email" when the email is not linked yet.
- 409 Conflict -> Sign-up/sign-in returns "This email is already registered" or "User with this Google account already exists" when the account is already linked.
- 401 Unauthorized -> Sign-in returns "Google account mismatch" when the Google ID does not match the stored account.

Flow 3: Password reset
1. [Unauthenticated User] -> [Frontend] : request password reset (enter email)
2. [Frontend] -> [Auth API (POST /api/auth/forgot-password)] : POST email
3. [Auth Service] -> [Database (Prisma)] : lookup User by email
	DECISION: if User.googleId exists (account created via Google OAuth)
		 - [Auth API] -> [Frontend] : return success-like response with `isOAuth=true` and provider="google" and message "This account uses Google Sign-In — please sign in with Google"
		 - Flow ends here for password reset (no PasswordReset record is created)
	 ELSE (regular local account):
4. [Auth Service] -> [Database (Prisma)] : create PasswordReset record with token and expires_at
5. [Auth Service] -> [Email Service] : send password reset token to user email
6. [Frontend/User] -> [Auth API (POST /api/auth/verify-reset-token)] : submit token for verification
7. [Auth API] -> [Auth Service] : verifyResetToken (validate token and expiry)
8. [Frontend/User] -> [Auth API (POST /api/auth/reset-password)] : submit token + new password
9. [Auth Service] -> [Hashing Library (bcryptjs)] : hash new password
10. [Auth Service] -> [Database (Prisma)] : update user password, delete PasswordReset record, delete UserSession records (force re-login)
11. [Auth API] -> [Frontend] : return success confirmation

Error handling:
- 401 Unauthorized -> Verify-reset and reset-password return "Invalid or expired reset token" when the token is missing, invalid, or expired.
- 404 Not Found -> Verify-email returns "User not found" when the account has been removed before verification.
- 401 Unauthorized -> Verify-email returns "Invalid verification code" or "Verification code has expired" for stale OTPs.

Flow 4: Login, token refresh, and error propagation
1. [Unauthenticated User] -> [Frontend] : submit login form (email,password)
2. [Frontend] -> [apiClient] : makeRequest -> POST /api/auth/sign-in
3. [apiClient] -> [Auth API (auth.controller)] : forward credentials
4. [Auth Controller] -> [Auth Service] : authenticate (compare password)
5. [Auth Service] -> [Database (Prisma)] : fetch user record
6. [Auth Service] -> [Hashing Library (bcryptjs)] : verify password
   DECISION: if credentials valid
	- [Auth Service] -> [JWT Service] : generate accessToken + refreshToken and create UserSession
	- [Auth API] -> [apiClient] : return { user, accessToken, refreshToken }
	- [apiClient] -> [Frontend] : resolve login success; store tokens in secure storage
   ELSE (invalid credentials)
	- [Auth API] -> [apiClient] : return 401 with error message = "Invalid email or password"
	- [apiClient] -> [Frontend] : return error to frontend unchanged (no refresh attempt for public auth endpoints)
	- [Frontend] -> [UI] : show backend-provided message (e.g., "Invalid email or password")

Flow 5: Protected request 401 handling and refresh
1. [Frontend] -> [apiClient] : makeRequest to protected endpoint with accessToken
2. [apiClient] -> [Auth API / User API] : request is rejected with 401 (accessToken expired)
3. [apiClient] -> [apiClient.refresh flow] : if request not a public auth endpoint, attempt refresh with stored refreshToken
4. [apiClient] -> [Auth API (POST /api/auth/refresh-token)] : submit refreshToken
   DECISION: if refresh succeeds
	- [Auth API] -> [apiClient] : return new accessToken + refreshToken
	- [apiClient] : store new tokens and retry original request
   ELSE (refresh fails or refresh token invalid)
	- [apiClient] -> [Frontend] : clear local tokens and return error "Session expired. Please sign in again."

Flow 6: Update email (profile edit) — force re-login
1. [Authenticated User] -> [Frontend EditProfile] : submit profile update with new email
2. [Frontend] -> [User API (PATCH /api/users/profile)] : send update payload with accessToken
3. [User Controller] -> [User Service] : validate and apply profile changes
4. [User Service] -> [Database (Prisma)] : update User record (email field)
5. [User Service] -> [Database (Prisma)] : delete UserSession records for that user (invalidate server sessions)
6. [User API] -> [Frontend] : return success (email updated)
7. [Frontend] : clear local tokens / auth state
8. [Frontend] -> [UI] : redirect to login screen and prefill email param with updated address

Flow 7: Change password (authenticated) — force re-login
1. [Authenticated User] -> [Frontend ChangePassword] : submit currentPassword + newPassword
2. [Frontend] -> [User API (PATCH /api/users/profile/password)] : send payload with accessToken
3. [User Controller] -> [User Service] : verify currentPassword (bcrypt.compare)
4. [User Service] -> [Hashing Library (bcryptjs)] : hash newPassword
5. [User Service] -> [Database (Prisma)] : update user passwordHash and delete UserSession records (force re-login)
6. [User API] -> [Frontend] : return success confirmation
7. [Frontend] : clear local tokens / auth state and redirect to login


## 4. Activity Diagram Data

### Start node
Start

### Actions
Open App
Navigate to Sign Up Screen
Enter name, email, password
Submit registration form
Validate input
Check if email already exists and is verified
Hash password
Persist user and create email verification record
Send verification email
Show confirmation to user (verification required)
Show auth error state when sign-in, verification, or reset fails

### Decision points
DECISION: [input valid?] → [yes: continue registration] / [no: show 400 validation errors]
DECISION: [email already verified?] → [no: continue registration] / [yes: show 409 conflict and prompt sign-in]
DECISION: [email service configured?] → [yes: send verification email] / [no: return 503 service unavailable]
DECISION: [verification code or reset token valid?] → [yes: complete auth step] / [no: show 401 unauthorized]

### End node
End

## 5. Component/Architecture Diagram Data

[Auth Screen (React Native)] --> [AuthContext] : invokes auth actions (login/register)
[Google Sign-In Component] --> [AuthContext] : passes google tokens to auth flow
[AuthContext] --> [apiClient] : makes authenticated requests / stores tokens
[apiClient] --> [Auth API (server - auth.controller)] : HTTP REST calls (POST /api/auth/*)
[Frontend] --> [User API (server - user.controller)] : HTTP REST calls for profile, notifications
[Auth API (auth.controller)] --> [Auth Service] : business logic
[User API (user.controller)] --> [User Service] : business logic
[Auth Service] --> [Prisma Database] : CRUD on User, UserSession, EmailVerification, PasswordReset
[User Service] --> [Prisma Database] : CRUD on Notification, NotificationPreference, BehavioralSignal
[Auth Service] --> [Email Service] : send verification and reset emails
[Auth Service] --> [JWT Service] : generate/verify tokens (jsonwebtoken)
[User Service] --> [Notification Service] : manage notifications
[Server] --> [ML Service (FastAPI)] : POST /classify for behavioral signals
[Server] --> [Uploads Storage (uploads/ or S3)] : store avatar files (multipart upload)
