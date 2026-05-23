# AI/ML Feature Module — Diagram Data


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

### Flow 4: Model retraining
1. System (Nightly Scheduler) -> Server Retrain Scheduler : Trigger nightly retrain job at 02:00
2. Server Retrain Scheduler -> FastAPI ML Microservice : POST /retrain-risk-model
3. FastAPI ML Microservice -> FastAPI ML Microservice : Run training script (train_risk_model.py)
4. FastAPI ML Microservice -> ML Artifacts / Model Metadata : Save refreshed model, preprocessor, metrics, and metadata
5. FastAPI ML Microservice -> FastAPI ML Microservice : Reload models into memory after successful retrain
6. FastAPI ML Microservice -> Server Retrain Scheduler : Return retrain status and logs

Error handling:
- 403 Forbidden -> Retrain endpoint returns disabled when `ML_ALLOW_RETRAIN=false`.
- 500 Internal Server Error -> Training failure, missing script, or model reload failure is returned to the scheduler.

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
- Nightly retrain scheduler triggers risk model refresh when enabled
- Return response to Chatbot UI
- Render feedback to user
- Surface model, validation, or fallback errors to the UI when inference fails

### Decision points
DECISION: [message is valid] → [Continue inference] / [Show 422 validation error]
DECISION: [intent == command] → [Generate action payload] / [Generate analytical reply]
DECISION: [confidence < threshold] → [Request clarification from user] / [Proceed with feedback]
DECISION: [model available?] → [Run classification or risk prediction] / [Return 503 service unavailable]
DECISION: [fallback enabled?] → [Return fallback prediction] / [Return model failure error]
DECISION: [retrain enabled?] → [Run nightly retrain pipeline] / [Skip retrain job]

### End node
End

## 5. Component/Architecture Diagram Data

[Chatbot UI] --> [Express Backend] : HTTP JSON API (POST /chat/respond)
[Chatbot UI] --> [Express Backend] : HTTP JSON API (GET /insights/productivity, GET /reports/daywise)
[Express Backend] --> [FastAPI ML Microservice] : HTTP JSON API (forward reflections, /predict/risk, /classify/behavior)
[FastAPI ML Microservice] --> [MongoDB (behavior signals)] : DB read/write (persist BehaviorSignal, RiskSnapshot, InsightReport)
[FastAPI ML Microservice] --> [ML Model artifact] : Local model inference (joblib loaded model)
[Server Retrain Scheduler] --> [FastAPI ML Microservice] : HTTP JSON API (POST /retrain-risk-model)
[FastAPI ML Microservice] --> [ML training pipeline] : Execute train_risk_model.py and refresh artifacts
[Express Backend] --> [Auth Provider] : Token validation / authentication
[Chatbot UI] --> [Firebase (optional)] : Push notifications (background feedback)
[Scheduler] --> [Express Backend] : Cron trigger (risk job)
[Scheduler] --> [FastAPI ML Microservice] : Cron trigger (insights aggregation)
[System (Nightly Scheduler)] --> [Server Retrain Scheduler] : Nightly retrain trigger (02:00)
