# Taskora

Taskora is an AI-assisted productivity platform with three main parts:

- Mobile client built with Expo React Native
- Node.js backend API with Express and Prisma
- Python ML service for behavior classification and task-risk prediction

This README is designed as a full system guide so a new developer can understand how the project works and run it locally.

## 1) What Problem Taskora Solves

Taskora helps users plan and complete work by combining classic task/project management with AI insights.

Core capabilities:

- Create and manage tasks, projects, statuses, and priorities
- Collaborate with project members
- Track activity and notifications
- Use an AI chatbot that classifies productivity behavior signals
- Predict task risk and show behavior insights

## 2) High-Level Architecture

Taskora is a monorepo with 3 runtime services:

- client: React Native app (Expo)
- server: REST API + business logic + PostgreSQL access
- ml-service: FastAPI inference and local model training

Request flow:

1. Client calls server API.
2. Server authenticates user, performs business logic, reads/writes PostgreSQL.
3. For AI features, server calls ml-service.
4. Server returns standardized JSON response to client.

## 3) Repository Structure

Top-level folders:

- client: Expo mobile application
- server: Express API and Prisma schema/migrations
- ml-service: ML inference API, training scripts, and tests

Important paths:

- client/src/app: Screen routes (home, tasks, chatbot, insights, projects)
- client/src/services: API clients and feature service modules
- server/src/routes: API route modules
- server/src/controllers: Request handlers
- server/src/services: Business logic and integrations
- server/prisma/schema.prisma: Database schema
- ml-service/main.py: FastAPI app entry
- ml-service/training: Model training scripts
- ml-service/models: Saved model artifacts

## 4) Tech Stack

Frontend:

- Expo 54, React Native 0.81, React 19, Expo Router
- Nativewind/Tailwind styles
- Firebase messaging in mobile app

Backend:

- Node.js + Express 5
- Prisma ORM + PostgreSQL
- JWT auth
- Google APIs, Nodemailer, Firebase Admin, cron jobs

ML service:

- Python + FastAPI
- scikit-learn, pandas, numpy
- Separate classifier and risk model pipelines

## 5) Core Features Mapped to Services

Task and project management:

- Server routes under /api/tasks and /api/projects
- Prisma models for Task, Project, ProjectMember, Status, Priority

Authentication and identity:

- Server routes under /api/auth
- Email verification, password reset, token refresh, Google sign-in

AI chatbot:

- Client chatbot screen calls /api/chatbot/message
- Server classifies free-text responses using ml-service /classify
- High-confidence labels are stored as UserBehaviorSignal

Risk prediction:

- Client/server call /api/predictions/task-risk
- Server computes features from task/activity data
- Server calls ml-service /predict-task-risk
- Risk snapshots persist to TaskRiskSnapshot

Behavior insights:

- Server route /api/insights/user-behavior
- Aggregates trends from behavior signals and risk/completion data

Notifications and digest:

- User notification routes under /api/users/notifications
- Hourly scheduler triggers daily digest eligibility checks

## 6) Local Development Setup

### Prerequisites

- Node.js 18+
- npm
- Python 3.10+
- PostgreSQL
- Expo Go app or Android emulator

### Step 1: Clone and Install Dependencies

From repository root:

```bash
cd client
npm install

cd ../server
npm install

cd ../ml-service
pip install -r requirements.txt
```

If you use a Python virtual environment, create and activate it before installing ml-service dependencies.

### Step 2: Configure Environment Variables

Create these files with your own values.

client/.env

```env
EXPO_PUBLIC_API_URL=http://localhost:5000
```

Notes:

- Android emulator usually needs http://10.0.2.2:5000
- Physical device should use your machine LAN IP

server/.env (minimum)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DB_NAME?schema=public
JWT_SECRET=replace_with_secure_secret
JWT_REFRESH_SECRET=replace_with_secure_refresh_secret
ML_API_URL=http://localhost:8000
```

Optional but used by features:

- Email flows: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, SMTP_FROM_EMAIL, SMTP_FROM_NAME
- Push notifications: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL
- Frontend invite links: FRONTEND_URL or FRONTEND_PORT
- Insights/risk tuning: HIGH_RISK_THRESHOLD, INSIGHTS_DEFAULT_RANGE_DAYS, INSIGHTS_MAX_RANGE_DAYS, INSIGHTS_CACHE_TTL_MS, ML_LOW_CONFIDENCE_THRESHOLD
- Digest scheduler: DAILY_DIGEST_ENABLED

ml-service environment variables (optional overrides)

```env
ML_MODELS_DIR=./models
ML_RISK_MODEL_ENABLED=true
ML_RISK_FALLBACK_ENABLED=true
ML_RISK_THRESHOLD_MEDIUM=0.45
ML_RISK_THRESHOLD_HIGH=0.75
```

### Step 3: Initialize Database (Server)

From server:

```bash
cd server
npx prisma generate
npx prisma migrate deploy
```

For active schema development you can use:

```bash
npx prisma migrate dev --name init
```

### Step 4: Run All Services

Terminal A - ML service:

```bash
cd ml-service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Terminal B - Backend server:

```bash
cd server
npm run dev
```

Terminal C - Mobile client:

```bash
cd client
npm start
```

## 7) API Overview

Base URL:

- http://localhost:5000/api

Main route groups:

- /auth: sign-up, sign-in, token, profile, password reset, Google auth
- /tasks: CRUD for tasks and task attachments
- /projects: CRUD, members, invites, statistics, assignment report, attachments
- /status and /priorities: personal/project status and priority options
- /comments: task comments
- /users: user search, profile update, avatar, notifications, digest preferences
- /projects/:projectId/activities: activity feed
- /chatbot/message: chatbot conversation endpoint
- /predictions/task-risk: task risk prediction endpoint
- /insights/user-behavior: behavior analytics and trends

Response format is standardized with success, message, data and optional meta.

## 8) ML Service Endpoints

Base URL:

- http://localhost:8000

Endpoints:

- GET /health: model availability and service readiness
- POST /classify: classify user message into productivity label + confidence
- POST /predict-task-risk: predict risk level and factors from computed features

## 9) Database Model Highlights

Key entities:

- User and UserSession
- Project and ProjectMember
- Task linked to status, priority, creator, assignee, project
- Comment and Activity
- Attachment (task or project)
- Notification
- UserBehaviorSignal (chatbot classifications)
- TaskRiskSnapshot (risk prediction history)


## 10) Testing

ML service tests:

```bash
cd ml-service
pytest
```

Backend currently has no implemented npm test suite in package scripts.

## 11) Troubleshooting

Client cannot reach server:

- Verify EXPO_PUBLIC_API_URL in client/.env
- For Android emulator use 10.0.2.2 instead of localhost
- Ensure server is running on port 5000

Server cannot connect to database:

- Verify DATABASE_URL
- Confirm PostgreSQL is running and accessible
- Re-run prisma generate and migration commands

AI endpoints fail:

- Ensure ml-service is running on port 8000
- Verify ML_API_URL in server environment
- Check ml-service /health

Email verification/reset fails:

- Ensure SMTP_HOST, SMTP_USER, SMTP_PASS and related SMTP settings are valid

## 12) Security Notes

- Do not commit real secrets in .env files
- Rotate any previously exposed keys immediately
- Use different credentials for local, staging, and production
- Prefer secret managers in deployment environments

## 13) Where to Start Reading Code

Suggested order for new contributors:

1. client/src/app/_layout.tsx (routing/auth gate)
2. client/src/app/index.tsx and tasks.tsx (main user flows)
3. server/src/routes/router.js (API entry map)
4. server/src/services (business logic)
5. server/prisma/schema.prisma (data model)
6. ml-service/main.py and ml-service/ml_engine.py (AI inference)

## 14) Current Runtime Ports

- Client (Expo dev server): usually 8081
- Backend API: 5000
- ML service: 8000

Keep these aligned with your environment variable settings.
