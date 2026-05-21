# AI/ML Feature Module — Diagram Data

## 1. Use Case Diagram Data

### Actors
- Authenticated User
- FastAPI ML Microservice
- Express Backend
- behavior signals
- Chatbot UI

### Use Cases
- Accept Reflection
- Detect Intent
- Apply Conditional Response
- Extract TF-IDF Features
- Classify Behavior
- Compute Confidence Score
- Persist Behavior Signal
- Compute Task Risk Features
- Predict Risk Level
- Store Risk Snapshot
- Provide Productivity Insights
- Compute Behavioral Trends
- Provide Day-wise Report
- Generate AI Feedback
- Return Health Status

### Relationships
[Authenticated User] --> [Accept Reflection]
[Chatbot UI] --> [Accept Reflection]
[Chatbot UI] --> [Detect Intent]
[Express Backend] --> [Detect Intent]
[Express Backend] --> [Apply Conditional Response]
[FastAPI ML Microservice] --> [Extract TF-IDF Features]
[FastAPI ML Microservice] --> [Classify Behavior]
[FastAPI ML Microservice] --> [Compute Confidence Score]
[FastAPI ML Microservice] --> [Persist Behavior Signal]
[FastAPI ML Microservice] --> [Compute Task Risk Features]
[FastAPI ML Microservice] --> [Predict Risk Level]
[FastAPI ML Microservice] --> [Store Risk Snapshot]
[FastAPI ML Microservice] --> [Provide Productivity Insights]
[FastAPI ML Microservice] --> [Compute Behavioral Trends]
[FastAPI ML Microservice] --> [Provide Day-wise Report]
[FastAPI ML Microservice] --> [Generate AI Feedback]
[Express Backend] --> [Provide Productivity Insights]
[Express Backend] --> [Provide Day-wise Report]
[MongoDB (behavior signals)] --> [Persist Behavior Signal]
[MongoDB (behavior signals)] --> [Store Risk Snapshot]

[Classify Behavior] <<include>> [Extract TF-IDF Features]
[Predict Risk Level] <<include>> [Compute Task Risk Features]

## 2. Entity Relationship Diagram (ERD) Data

### Entities & Attributes
- UserBehaviorSignal (id: String @id @default(cuid()), userId: String, taskId: String?, label: String, confidence: Float, deletedAt: DateTime?, createdAt: DateTime @default(now()))
- TaskRiskSnapshot (id: String @id @default(cuid()), userId: String, taskId: String, risk: String, probability: Float, topFactors: Json?, source: String @default("on_demand"), predictedForDateKey: String, createdAt: DateTime @default(now()))
- InsightReport (persisted as InsightReport in ML service or DB): (id: String, userId: String, date: Date, productivityScore: Number, dominantBehavior: String, trend: Json)

### Relationships
[InsightReport] --aggregates--> [BehaviorSignal] (cardinality: one-to-many)
[RiskSnapshot] --captures-features-for--> [BehaviorSignal] (cardinality: one-to-many)
[RiskSnapshot] --belongs-to--> [InsightReport] (cardinality: many-to-one)

## 3. Sequence Diagram Data

### Flow 1: Behavioral classification
1. Authenticated User -> Chatbot UI : Submit reflection text (task_id, metadata)
2. Chatbot UI -> Express Backend : POST /chat/respond (reflection, auth token)
3. Express Backend -> FastAPI ML Microservice : Forward reflection for processing
4. FastAPI ML Microservice -> FastAPI ML Microservice : Extract TF-IDF Features
5. FastAPI ML Microservice -> FastAPI ML Microservice : ML Model predicts label + confidence
6. FastAPI ML Microservice -> MongoDB (behavior signals) : Persist BehaviorSignal (label, confidence, text_hash)
7. FastAPI ML Microservice -> Express Backend : Return classification + reply/action
8. Express Backend -> Chatbot UI : Forward reply/action
9. Chatbot UI -> Authenticated User : Render feedback

Error handling:
- 422 Unprocessable Entity -> ML service returns "message is required and cannot be empty" when reflection text is blank.
- 500 Internal Server Error -> Unsupported labels or runtime model failures bubble as server errors.
- 401/403 auth failure on the backend -> Express Backend rejects the request before it reaches the ML service.

### Flow 2: Risk prediction
1. Cron Scheduler -> Express Backend : Trigger risk prediction job (cron or on-demand)
2. Express Backend -> MongoDB (behavior signals) : Fetch task features (days_remaining, priority, activity_count)
3. Express Backend -> FastAPI ML Microservice : POST /predict/risk (features payload)
4. FastAPI ML Microservice -> FastAPI ML Microservice : Compute risk score (model inference)
5. FastAPI ML Microservice -> MongoDB (behavior signals) : Store RiskSnapshot (features, risk_score, model_version)
6. FastAPI ML Microservice -> Express Backend : Return risk prediction results
7. Express Backend -> Chatbot UI : Surface updated risk data in dashboard

Error handling:
- 404 Not Found -> Express Backend returns "Task not found or access denied" when the task is missing or not visible to the user.
- 503 Service Unavailable -> Express Backend returns "ML service unavailable for task risk prediction" when the FastAPI call fails.
- 503 Service Unavailable -> FastAPI returns a service error when the risk model fails and fallback is disabled.

### Flow 3: Insights generation
1. Scheduler -> FastAPI ML Microservice : Trigger insights aggregation job
2. FastAPI ML Microservice -> MongoDB (behavior signals) : Query BehaviorSignals by user/date range
3. FastAPI ML Microservice -> FastAPI ML Microservice : Compute trends and aggregates (moving averages, distributions)
4. FastAPI ML Microservice -> MongoDB (behavior signals) : Write InsightReport (productivity_score, dominant_behavior, trend)
5. FastAPI ML Microservice -> Express Backend : Notify insights available / Return report on request
6. Express Backend -> Chatbot UI : Provide InsightReport to dashboard API consumers

Error handling:
- 500 Internal Server Error -> Insights aggregation or model reload failures return an explicit server error response.
- 503 Service Unavailable -> The service returns a model error when inference cannot run and no fallback path is available.
- 422 Validation Error -> Invalid insight or classify payloads are rejected before aggregation or inference begins.

## 4. Activity Diagram Data

### Start node
Start

### Actions
- Collect reflection text in Chatbot UI
- Attach context (task_id, timestamp, recent activity)
- Send reflection to Express Backend
- Validate auth token
- Forward reflection to FastAPI ML Microservice
- Extract TF-IDF features
- Run intent detection and behavioral classification
- Compute confidence score
- DECISION: [intent == command] → Generate action payload / Generate analytical reply
- Persist BehaviorSignal to MongoDB
- Generate AI feedback text
- Return response to Chatbot UI
- Render feedback to user
- Surface model, validation, or fallback errors to the UI when inference fails

### Decision points
DECISION: [message is valid] → [Continue inference] / [Show 422 validation error]
DECISION: [intent == command] → [Generate action payload] / [Generate analytical reply]
DECISION: [confidence < threshold] → [Request clarification from user] / [Proceed with feedback]
DECISION: [model available?] → [Run classification or risk prediction] / [Return 503 service unavailable]
DECISION: [fallback enabled?] → [Return fallback prediction] / [Return model failure error]

### End node
End

## 5. Component/Architecture Diagram Data

[Chatbot UI] --> [Express Backend] : HTTP JSON API (POST /chat/respond)
[Chatbot UI] --> [Express Backend] : HTTP JSON API (GET /insights/productivity, GET /reports/daywise)
[Express Backend] --> [FastAPI ML Microservice] : HTTP JSON API (forward reflections, /predict/risk, /classify/behavior)
[FastAPI ML Microservice] --> [MongoDB (behavior signals)] : DB read/write (persist BehaviorSignal, RiskSnapshot, InsightReport)
[FastAPI ML Microservice] --> [ML Model artifact] : Local model inference (joblib loaded model)
[Express Backend] --> [Auth Provider] : Token validation / authentication
[Chatbot UI] --> [Firebase (optional)] : Push notifications (background feedback)
[Scheduler] --> [Express Backend] : Cron trigger (risk job)
[Scheduler] --> [FastAPI ML Microservice] : Cron trigger (insights aggregation)
