# Taskora AI Local Training And Integration Plan

## 1) Objective
Build and run both AI models locally (classifier + task risk prediction), organize the AI codebase for maintainability, and integrate with existing backend/frontend without breaking current functionality.

## 2) Current State Analysis (From Codebase)

### Existing integration already in place
- Backend calls `ml-service` for classifier:
  - `server/src/services/mlClassification.service.js` -> `POST {ML_API_URL}/classify`
- Backend calls `ml-service` for risk prediction:
  - `server/src/services/taskRiskPrediction.service.js` -> `POST {ML_API_URL}/predict-task-risk`
- Frontend is decoupled from ML service directly and only calls backend APIs:
  - Chatbot: `client/src/services/chatbotService.ts` -> `/chatbot/message`
  - Insights: `client/src/services/insightsService.ts` -> `/insights/user-behavior`

### ML service current behavior
- `ml-service/main.py` loads:
  - `models/taskora_classifier.pkl`
  - `models/taskora_tfidf.pkl`
- `/classify` uses trained artifacts.
- `/predict-task-risk` is currently rule-based (no trained risk model artifact loaded yet).

### Database/feature context
- Useful inputs already available from backend service aggregation:
  - due metrics, activity count, behavior signal score in `taskRiskPrediction.service.js`
- Time-tracking fields are limited (no explicit estimated/actual duration model), so risk training should start from currently available online features.

## 3) Target AI Codebase Organization

Create and maintain this structure under `ml-service/`:

- `ml-service/main.py` (FastAPI inference API)
- `ml-service/requirements.txt`
- `ml-service/models/`
  - `taskora_classifier.pkl`
  - `taskora_tfidf.pkl`
  - `taskora_risk_model.pkl`
  - `taskora_risk_preprocessor.pkl` (if needed)
  - `model_metadata.json` (version, metrics, feature schema)
- `ml-service/training/`
  - `train_classifier.py`
  - `train_risk_model.py`
  - `evaluate.py`
  - `common.py` (shared preprocessing/paths)
- `ml-service/data/`
  - `raw/`
  - `processed/`
- `ml-service/tests/`
  - `test_api_contract.py`
  - `test_model_loading.py`
  - `test_feature_schema.py`
- `ml-service/README.md` (runbook)

Notes:
- Keep inference artifact loading and training scripts separated.
- Keep model paths centralized in one constants module.
- Keep endpoint contracts unchanged to avoid backend/frontend breakage.

## 4) Non-Breaking Integration Strategy

### API contract freeze (must not change)
- Keep `/classify` response shape:
  - `{ label: string, confidence: number }`
- Keep `/predict-task-risk` response shape:
  - `{ risk: "LOW"|"MEDIUM"|"HIGH", probability: number, top_factors: string[], generated_at: string }`

### Safe rollout approach
1. Add trained risk model loading in `ml-service/main.py` behind a feature flag.
2. Keep current rule-based risk logic as fallback.
3. If model load fails or inference fails, automatically return fallback prediction.
4. Only switch default mode to trained model after validation passes.

### Suggested flags
- `ML_RISK_MODEL_ENABLED=true|false`
- `ML_RISK_FALLBACK_ENABLED=true|false`
- `ML_MODELS_DIR=./models`
- `ML_MODEL_VERSION=<string>`

## 5) End-To-End Architecture (After Migration)

1. User interacts with frontend (chatbot/task/insights).
2. Frontend calls backend APIs only.
3. Backend computes online features and calls `ml-service`.
4. `ml-service` uses local model artifacts directly.
5. Backend stores snapshots/signals and returns same API shape to frontend.

This preserves existing client contracts and route structure.

## 6) Implementation Phases

## Phase A: Baseline And Safety
- Add branch for AI refactor work.
- Capture baseline behavior with sample requests for:
  - `/api/chatbot/message`
  - `/api/predictions/task-risk`
  - `/api/insights/user-behavior`
- Save current model artifacts and hash/version metadata.

Deliverable:
- Baseline report with example inputs/outputs and expected ranges.

## Phase B: Local Training Pipeline Setup
- Add `ml-service/training/` scripts for reproducible local training.
- Use deterministic seeds and fixed train/validation/test split strategy.
- Add artifact registry convention:
  - filename, created_at, data snapshot identifier, metrics.

Deliverable:
- One-command local training for each model.

## Phase C: Classifier Local Training
- Move notebook logic into `train_classifier.py`.
- Persist both classifier and TF-IDF vectorizer.
- Evaluate and log:
  - accuracy
  - macro F1
  - per-label precision/recall
  - confusion matrix
- Enforce label whitelist compatibility:
  - HIGH_MOTIVATION
  - CONSISTENT_PRODUCTIVITY
  - LOW_ENERGY
  - WORK_OVERLOAD
  - DISTRACTION
  - PROCRASTINATION
  - POOR_PLANNING
  - FORGETFULNESS

Deliverable:
- `taskora_classifier.pkl`, `taskora_tfidf.pkl`, metrics summary.

## Phase D: Risk Model Local Training
- Build training dataset from currently available inference-time features:
  - `is_completed`
  - `due_in_days`
  - `days_overdue`
  - `recent_activity_count`
  - `behavior_risk_score`
- Train probabilistic classifier (example: LogisticRegression / XGBoost depending on constraints).
- Calibrate probabilities (Platt or isotonic if needed).
- Map probability -> risk bucket:
  - LOW / MEDIUM / HIGH thresholds aligned with product logic.
- Persist model and preprocessor artifacts.

Deliverable:
- `taskora_risk_model.pkl` (+ preprocessor), metrics and calibration report.

## Phase E: Inference Layer Refactor (No Contract Change)
- Update `ml-service/main.py` startup to load risk model artifacts.
- Implement `predict-task-risk` path:
  - If enabled and model present -> use trained model.
  - Else -> use current rule fallback.
- Add startup validation:
  - check artifact existence
  - check expected feature schema
  - fail fast or fallback based on flags.

Deliverable:
- Backward-compatible API with trained risk model path.

## Phase F: Backend Hardening
- Keep backend service clients (`mlClassification.service.js`, `taskRiskPrediction.service.js`) stable.
- Add tighter error telemetry for ML service failures (status, timeout, endpoint).
- Add response schema guards in backend before DB writes (especially `top_factors`).

Deliverable:
- Robust backend handling for ML outages and malformed payloads.

## Phase G: Testing And Verification

### ML service tests
- health endpoint
- model load tests
- schema contract tests for both endpoints
- invalid payload tests

### Backend integration tests
- prediction route success and service-unavailable behavior
- chatbot route classification handling

### Regression checks
- no change in frontend contract
- no crash in daily digest risk snapshot pipeline

Deliverable:
- Test checklist with pass/fail and known risks.

## Phase H: Deployment And Operations (Local First)
- Add run commands for local development:
  - train models
  - start ML API
  - start backend
  - start frontend
- Add model version logging at service startup.
- Add simple health diagnostics endpoint for loaded model versions.

Deliverable:
- Reproducible local runbook.

## 7) Local Requirements (Training + Inference)

## System
- Python 3.10+ recommended for ML service consistency.
- Node.js runtime already required by existing backend/frontend.

## Python packages
Minimum for current and planned pipeline:
- fastapi
- uvicorn
- scikit-learn==1.6.1
- joblib
- pydantic
- numpy
- pandas
- scipy
- matplotlib (optional, for evaluation plots)
- seaborn (optional, for confusion matrix visualization)

Optional (if using boosted trees):
- xgboost or lightgbm

## Environment variables
Backend (`server/.env`):
- `ML_API_URL=http://localhost:8000`
- `ML_LOW_CONFIDENCE_THRESHOLD=0.6` (already used)

ML service (`ml-service/.env` or process env):
- `ML_MODELS_DIR=./models`
- `ML_RISK_MODEL_ENABLED=true`
- `ML_RISK_FALLBACK_ENABLED=true`
- `ML_MODEL_VERSION=<version_tag>`

## Data requirements
- Classifier training dataset with text + labels matching production labels.
- Risk training dataset with online-compatible features and target label.
- Feature definition file to ensure train/inference parity.

## 8) Necessity Of Training And Running Locally

Training locally is necessary because:
- It removes dependency on Colab runtime/session availability.
- It gives reproducible builds and artifact version control in your project flow.
- It enables faster iteration with backend integration testing.
- It lets you validate feature parity against real backend-generated inputs.

Running models locally is necessary because:
- Existing backend already expects a local/accessible ML API (`ML_API_URL`).
- It reduces latency and external service dependency in development.
- It supports controlled fallback and debugging when predictions look wrong.

## 9) Risk Controls And Guardrails
- Do not change existing endpoint paths or response schema.
- Keep rule-based fallback until trained risk model is production-stable.
- Version every model artifact and include metadata.
- Add strict checks for missing model files on startup.
- Validate numerical ranges for probabilities and confidence.

## 10) Acceptance Criteria
- Classifier and risk models both train locally with documented commands.
- `ml-service` can run locally and serve both endpoints.
- Backend endpoints continue to function without frontend changes.
- Daily digest and insights flows continue to work.
- Regression tests pass for API contracts and failure handling.

## 11) Suggested Execution Order (Practical)
1. Implement training scripts and metadata output.
2. Train classifier locally and verify `/classify` parity.
3. Train risk model locally with available online features.
4. Add risk-model inference path + fallback in `ml-service/main.py`.
5. Run backend integration tests and snapshot checks.
6. Enable trained risk model by default only after validation.

---

This plan is intentionally contract-first so the AI subsystem can evolve without breaking the existing frontend/backend behavior.
