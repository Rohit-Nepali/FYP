# AI/ML Feature Module

## 1. Subsystem Overview

The AI/ML Feature Module implements Taskora's intelligent analytics and conversational assistant functionality. It is delivered as a standalone FastAPI microservice (located in the repository under `ml-service/`) that exposes prediction, classification, feature-extraction, insight-generation, and retraining endpoints. The subsystem ingests structured user and task activity signals from core Taskora components, performs feature engineering and supervised inference, and emits risk assessments, productivity insights, and text-based feedback used by the mobile client. It also supports a scheduled nightly retrain pipeline so refreshed risk artifacts can be produced automatically and reloaded without a manual deploy.

This module integrates with the Taskora mobile client and backend: it consumes event and task data produced by the `client` (UI) and `server` (task APIs and webhooks), and it writes derived artifacts (risk snapshots, behavior signals) to the central persistent store so that `server` and `client` can query and render results. Authentication and user identity are validated using the same credentials and tokens used by `server` (the microservice accepts bearer tokens compatible with Taskora's auth flow and validates them against `server` endpoints or the identity provider configured in `server/src/config`).

The technical approach emphasises classical NLP feature extraction (TF–IDF) combined with lightweight supervised learning (scikit-learn) for behavioral classification and risk prediction. Models are trained offline using the training pipeline in `ml-service/training/` and persisted with joblib; the microservice performs feature extraction using `sklearn.feature_extraction.text.TfidfVectorizer`, computes engineered task-risk features (temporal, completion, and interaction signals), and serves predictions with FastAPI + Uvicorn for low-latency inference. A server-side scheduler can call the retrain endpoint nightly to regenerate the risk model, persist updated artifacts, and reload them in memory.

## 2. Functional Requirements

FR-AI-01: The system shall present a Chatbot UI in the mobile client that accepts free-text user reflections and transmits them to the AI/ML microservice via a `POST /chat/respond` API call. (Test: send reflection text and observe 200 response with JSON payload.)

FR-AI-02: The system shall distinguish between 'command' and 'response' intents for each incoming message, returning an intent label of either `command` or `response` in API responses. (Test: provide labelled test inputs and measure classification accuracy.)

FR-AI-03: The system shall apply conditional message response logic: when intent==`command` return a validated action proposal; when intent==`response` return an analytical text reply. (Test: assert response schema contains `action` or `reply` fields according to intent.)

FR-AI-04: The system shall extract TF–IDF features from user reflection text using a deterministic tokenizer and a persisted vocabulary, and return a sparse feature vector or its dense approximation. (Test: same input twice yields identical feature vectors; vocabulary used matches persisted vocabulary.)

FR-AI-05: The system shall perform supervised behavioral classification on user reflections and user-task signals, returning a discrete behavior class label (for example: `procrastination`, `on-track`, `overloaded`). (Test: classification endpoint returns labels for a labelled test set with documented mapping.)

FR-AI-06: The system shall compute and return a confidence score (probability) for each classification and prediction result. (Test: confidence field present and between 0.0 and 1.0 for every prediction.)

FR-AI-07: The system shall persist anonymised user behaviour signals (timestamped events, text hashes, task interactions) to a durable store for later aggregation. (Test: write event, subsequently query store for same event ID.)

FR-AI-08: The system shall compute task risk features from raw task and interaction data (e.g., overdue ratio, average completion delay, recent activity decay, TF–IDF topical risk score) and expose them via an API. (Test: provide controlled task events and verify computed feature values.)

FR-AI-09: The system shall predict a normalized `risk_level` score per task or user (range 0–1) using the risk prediction model. (Test: predictions returned for requested task IDs; range validated.)

FR-AI-10: The system shall store immutable risk snapshots (features + prediction + timestamp) per task and make them retrievable by date range. (Test: create snapshot and read it back for its timestamp.)

FR-AI-11: The system shall provide an insights endpoint that returns productivity metrics and visual-ready summaries for the Productivity Insights dashboard. (Test: call insights endpoint for a user and verify returned keys match dashboard contract.)

FR-AI-12: The system shall provide behavioral trend analysis outputs (aggregated labels, moving averages, trend slopes) for a specified time window. (Test: request trends for 7/30/90-day windows and inspect aggregation correctness.)

FR-AI-13: The system shall provide a day-wise analysis report endpoint that returns per-day aggregates of signals and risk snapshots for a given date range. (Test: compare per-day sums/averages to known input events.)

FR-AI-14: The system shall generate AI feedback (actionable text suggestions) for users based on classification, risk prediction, and historical trends, exposing the output as a text field with provenance metadata. (Test: ensure output includes `feedback_text`, `confidence`, and `source_model` fields.)

FR-AI-15: The system shall record and surface model version metadata with every prediction response to support reproducibility. (Test: response includes `model_version` and `vocab_hash`.)

FR-AI-16: The system shall support retraining the risk model through a gated endpoint and a scheduled nightly job, updating persisted artifacts and model metadata after successful training. (Test: scheduled retrain or manual POST to `/retrain-risk-model` completes, artifacts are refreshed, and the service reloads the updated model.)

## 3. Non-Functional Requirements

- NFR-AI-01 (Performance): 95% of inference requests shall return within 300 ms for single-text classification under typical load (p95 latency). Batch jobs and heavy feature recomputations may be slower. (Measurement: p95 latency under representative load test.)
- NFR-AI-02 (Security): All API endpoints shall require bearer token authentication compatible with Taskora's auth flow; PII must be either hashed or encrypted-at-rest and in-transit (TLS v1.2+). (Verification: token validation and encryption in storage.)
- NFR-AI-03 (Scalability): The microservice shall scale horizontally behind a load balancer; model artifacts shall be statelessly loaded so replicas can be added without downtime. (Verification: horizontal scale test with container replicas.)
- NFR-AI-04 (Reliability / Availability): The service shall achieve 99.5% uptime during working hours and expose health-check endpoints (`GET /health`) for orchestrators. (Verification: uptime monitoring and health checks.)
- NFR-AI-05 (Usability): The Chatbot responses and AI feedback shall be concise and limited to 300 characters for primary suggestions (UI truncation compat). Error cases shall return helpful error messages and client-visible status codes. (Verification: UX review and integration tests.)
- NFR-AI-06 (Compatibility): The module shall provide JSON APIs consumable by both iOS and Android clients; response schemas must be stable and versioned to maintain compatibility across client releases. (Verification: integration tests on both platforms.)
- NFR-AI-07 (Privacy): User reflection text shall be retained only for a configurable retention period; retention policy must be enforced automatically. (Verification: retention job and deletion audit logs.)
- NFR-AI-08 (Model Management): The system shall support model versioning and rollback; each deployed model must be traceable to a training commit and dataset snapshot. (Verification: model registry metadata and deployment logs.)
- NFR-AI-09 (Retraining / Automation): The system shall support scheduled retraining with a safe runtime gate so automatic model refreshes can run without exposing the training endpoint publicly. (Verification: nightly scheduler logs, retrain endpoint gating, and refreshed model metadata.)

## 4. Key Features Breakdown

Chatbot UI with user reflection input:
This feature accepts free-text reflections in the mobile client and forwards them to the microservice. The client UI collects the text and contextual metadata (task id, timestamp, recent activity) and calls `POST /chat/respond`; the microservice validates the token and runs intent detection and classification. It is important because direct user reflection provides signal-rich textual data that enables behavioral classification and personalised feedback.

Command vs response intent detection:
Intent detection classifies incoming messages as either actionable `command` or descriptive `response` using a lightweight text classifier (scikit-learn logistic regression or calibrated tree-based model) trained on labeled examples. Implementation uses `TfidfVectorizer` for features and `sklearn.linear_model.LogisticRegression` (or equivalent) for inference; models are persisted with `joblib`. Distinguishing intent prevents confusion between direct user commands (e.g., “create task”) and reflective text used for analytics.

Conditional message response logic:
When a message is labelled `command` the service validates and synthesises an `action` payload (structured suggestion). When labelled `response` it produces an analytical textual reply. This control flow is implemented in FastAPI route handlers that branch on predicted intent and may call downstream feature or prediction endpoints. It ensures the chat interface is both interactive and analytically useful.

TF-IDF feature extraction:
The module uses `sklearn.feature_extraction.text.TfidfVectorizer` with a deterministic tokeniser and a persisted vocabulary to convert reflection text into numerical features. The vocabulary and vectorizer configuration are versioned and stored alongside the model (joblib artifacts). TF–IDF is used because it is efficient, interpretable, and robust for small-to-medium sized training corpora typical in project-management text.

Supervised ML behavioral classification:
Behavioral classification uses supervised models (scikit-learn: Logistic Regression / RandomForest / CalibratedClassifierCV) trained with engineered features (TF–IDF, interaction counts, temporal deltas). Training occurs offline in `ml-service/training/`, with experiments recorded in metadata and models exported with `joblib`. This feature provides discrete labels that drive feedback and downstream risk scoring.

Model retraining pipeline:
The risk model can be retrained through a gated FastAPI endpoint (`POST /retrain-risk-model`) that runs the training script, writes updated artifacts, and reloads the model in memory. A server-side cron scheduler triggers this endpoint nightly when `MODEL_RETRAIN_ENABLED=true`, allowing the deployment to refresh risk artifacts automatically while keeping the training workflow isolated from normal inference traffic.

Confidence score analysis:
Each model inference returns a calibrated confidence score (probability) computed with classifier probability outputs or calibration wrappers. The microservice formats confidence into both raw probability and binned confidence levels (`low`, `medium`, `high`) for UI consumption. Confidence enables the UI to surface certainty and helps determine when human review or fallback logic is required.

User behavior signal storage:
Signals (event timestamps, task interactions, anonymised text fingerprints, label outputs) are written to the persistent store for aggregation and trend analysis. The microservice uses an async DB client (SQLAlchemy/asyncpg or an equivalent configured connection) or can emit events to `server` ingestion endpoints for centralised storage. Persisted signals enable historical queries, trend reports, and reproducible feature computations.

Task risk feature computation:
Risk features are computed by aggregating task metadata and interaction signals: overdue ratio, mean completion delay, recent activity decay (exponential window), and topical risk indicators derived from TF–IDF features. Computation is implemented as a deterministic pipeline in the microservice (numpy/pandas for batch ops) and exposed via `POST /features/compute`. These features are the inputs to the risk prediction model and provide interpretability of risk drivers.

Risk level prediction:
Risk prediction applies a supervised regression or calibrated classifier to compute a normalized `risk_level` (0–1) per task or user. Implementation uses scikit-learn (e.g., `RandomForestRegressor` or `LogisticRegression` for classification) and returns prediction, confidence, and contributing features. Risk levels allow the product to prioritise interventions and surface high-risk tasks in the UI.

Risk snapshot storage:
After prediction, the system writes an immutable risk snapshot (features, prediction, model version, timestamp) to persistent storage for auditing and longitudinal analysis. Snapshots are stored with appropriate indexes to support time-range queries and are retained according to policy. Snapshots enable reproducible historical analyses and are the source for day-wise or trend reports.

Productivity insights dashboard:
The insights dashboard aggregates per-user and per-project signals into productivity metrics: throughput, mean time to complete, focus time estimates, and risk-weighted completion rates. The microservice exposes an `GET /insights/productivity` endpoint that returns JSON aggregates ready for charting; heavy aggregations may be served from precomputed caches. This feature gives users actionable clarity on their work patterns and team-level productivity.

Behavioral trend analysis:
Trend analysis computes moving averages, class distribution time-series, and trend slopes for behavioral labels and risk levels over configurable windows. Implemented with efficient windowed aggregations (pandas/numpy or database time-series queries), results are used to detect gradual changes and trigger alerts or long-form feedback. Trend outputs are essential for monitoring improvements or regressions in user behaviour.

Day-wise analysis report:
Day-wise reports return per-day aggregates (counts, mean risk, predominant label) for a given date range and user or project scope. The endpoint `GET /reports/daywise` supports pagination and filtering by project or task set. Day-wise reports provide digestible snapshots for users and stakeholders to review recent activity.

AI feedback generation:
AI feedback generation composes contextual, actionable suggestions using template-based rules augmented with model outputs (classification, risk features, trend signals). The microservice uses rule templates plus simple generative text composed from model-driven slots to ensure responses remain deterministic and auditable. This provides users with clear next steps and avoids opaque generative behaviour unsuitable for high-stakes product decisions.

## 5. Module Dependencies

- `client` — supplies reflection text, task context, and displays feedback; the Chatbot UI and Productivity Dashboard components call the microservice. The specific client UI pages involved include `src/app/chatbot.tsx` and `src/app/tasks.tsx`.
- `server` — provides authentication, persistent user/task data, and optionally central ingestion endpoints; the microservice validates tokens against `server` and may write derived artifacts back to `server` data stores or call `server` APIs for persistence. Relevant code areas include `server/src/routes/` and `server/src/services/`.
- `firebase` / `config/firebase.ts` (if used) — for push notifications or background messaging integration when feedback needs to be pushed to devices.
- `ml-service/training/` — the training pipeline that produces the model artifacts consumed by this microservice.
- `server/src/services/modelRetrainScheduler.service.js` — nightly scheduler that triggers the retrain endpoint when enabled.
- Persistent storage (shared DB or object store) — to store signals, snapshots, and cached aggregates (the project uses `server/prisma/` for DB schema; the microservice conforms to the same storage schema or writes via `server` APIs).

## 6. API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|---|---|---:|:---:|
| POST | /chat/respond | Accepts user reflection text, returns intent, classification, and reply/action | Yes |
| POST | /features/tfidf | Returns TF–IDF vector (or summary) for supplied text | Yes |
| POST | /features/compute | Compute engineered task risk features from provided task/activity data | Yes |
| POST | /predict/risk | Predict risk level for a task or user given features | Yes |
| POST | /classify/behavior | Return behavioral class label and confidence for supplied signals | Yes |
| POST | /retrain-risk-model | Retrain the risk model, persist updated artifacts, and reload the service model | Yes (internal / gated by env) |
| POST | /signals | Persist a behaviour signal/event to durable storage | Yes |
| GET | /snapshots | Query risk snapshots by task/user and date range | Yes |
| GET | /insights/productivity | Return productivity aggregates for dashboard consumption | Yes |
| GET | /reports/daywise | Return day-wise analysis report for a date range and scope | Yes |
| GET | /trends | Return behavioral trend analysis for a specified window | Yes |
| GET | /health | Service health check; returns service and model status | No (or token optional for internal use) |

All endpoints exchange JSON and use standard HTTP status codes; endpoints that modify persistent state require authentication and are rate-limited to protect model resources.
