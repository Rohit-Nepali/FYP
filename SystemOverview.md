1. High-Level Architecture
The system consists of three interconnected layers:

React Native Frontend (client) - User-facing interface
Node.js/Express Backend (server) - Orchestration and business logic
Python FastAPI ML Service (ml-service) - Model inference and training
Flow Pattern:

Key API Endpoints:

Endpoint	Method	Purpose	Called By
/chatbot/message	POST	User chatbot interaction	Frontend
/classify	POST	Text classification (ML Service)	Backend
/predict-task-risk	POST	Task risk prediction (ML Service)	Backend
/predictions/task-risk	POST	Create risk snapshot	Frontend
/insights/user-behavior	GET	Behavior analytics	Frontend

2. Data Sources
Classifier Dataset (Text + Labels)
Location: classifier
File: productivity_dataset_2.csv
Structure: Text messages + 8 behavioral labels
Labels: HIGH_MOTIVATION, CONSISTENT_PRODUCTIVITY, LOW_ENERGY, WORK_OVERLOAD, DISTRACTION, PROCRASTINATION, POOR_PLANNING, FORGETFULNESS
Used for: Training text classifier (TF-IDF + Logistic Regression)
Risk Prediction Dataset (Gryzzly Dataset)
Location: risk
Files:
tasks.csv - Task metadata
tasks_computed.csv - Computed task statistics
declarations.csv - User activity declarations (time tracking)
(Optional) projects.csv, users.csv, teams.csv - Context data
Used for: Training task risk prediction model
Live Data Sources (Database)
Database: PostgreSQL via Prisma ORM
Tables:
UserBehaviorSignal - Stores classified chatbot messages + confidence
Task - Task metadata (due dates, completion status)
Activity - Task activity history (7-day windows used for feature engineering)
3. Data Processing Pipeline
Classifier Text Preprocessing (train_classifier.py)
Pipeline Steps:

Load CSV (infer text/label columns automatically)
Clean text with regex preprocessing
Remove empty rows and invalid labels
Stratified train/test split (default 80/20)
TF-IDF vectorization (max 10,000 features, 1-2 grams, min_df=2)
Store train/test metrics for validation
Risk Model Feature Engineering (train_risk_model.py)
Input Features (from Gryzzly data):

is_completed - Task completion status
due_in_days - Remaining time to deadline
days_overdue - Days past deadline
recent_activity_count - Activity in last 7 days
behavior_risk_score - Aggregated behavior signal risk
Feature Derivation:

Merge tasks.csv + tasks_computed.csv + declarations.csv
Normalize duration fields (nanoseconds → seconds)
Compute aggregations:
recent_activity_count = declarations in last 7 days
task_delay_days = (completion_date - created_at)
completion_rate_project = completed / total in project
Fill missing values with 0 (imputation)
Standardize numeric features
4. Model Training Pipeline
Classifier Training (train_classifier.py)
Command:

Training Details:

Vectorizer: TfidfVectorizer (1-2 grams, 10K features)
Model: LogisticRegression (multinomial, balanced class weights)
Evaluation: Accuracy + Macro F1-Score
Output: taskora_classifier.pkl, taskora_tfidf.pkl
Risk Model Training (train_risk_model.py)
Command:

Training Details:

Model: LogisticRegression (with pipeline preprocessing)
Features: 5 model-aligned features (see #3)
Preprocessing: SimpleImputer + StandardScaler in pipeline
Evaluation: Accuracy, F1-Score, ROC-AUC
Output: taskora_risk_model.pkl, taskora_risk_preprocessor.pkl
Validation & Metrics
All metrics logged to models/model_metadata.json
Tracks: dataset paths, classes, accuracy, F1, train/test samples, update timestamps
5. Model Storage and Versioning
Model Artifacts Location
Path: models
Files:
taskora_classifier.pkl - Text classifier (LogisticRegression)
taskora_tfidf.pkl - TF-IDF vectorizer
taskora_risk_model.pkl - Task risk classifier (can be disabled)
taskora_risk_preprocessor.pkl - Risk model preprocessing pipeline
model_metadata.json - Training metadata and metrics
Versioning & Fallback Mechanism
The system implements environment-based versioning:

Fallback Strategy:

Classifier: Mandatory - fails if missing
Risk Model: Optional - controlled by ML_RISK_MODEL_ENABLED=true
Risk Fallback: If risk model fails, ML_RISK_FALLBACK_ENABLED=true triggers rule-based fallback
Current Approach:

No explicit versioning (single "active" model per type)
Models are hot-reloaded at FastAPI startup
No A/B testing or canary deployment infrastructure
6. Model Serving (Inference Layer)
FastAPI Service (main.py)
Startup:

Endpoint 1: /classify (POST)
Request:

Processing:

Clean text using same clean_text() function as training
Vectorize with TF-IDF
Get class probabilities from LogisticRegression
Return top class + confidence
Response:

Fallback: Returns null if message empty or invalid labels

Endpoint 2: /predict-task-risk (POST)
Request:

Processing (Two Paths):

Path A: Model-Based (if enabled)

Transform features through preprocessor pipeline
Get probability from risk_model.predict_proba()
Map probability to risk level using thresholds
Path B: Fallback / Rule-Based

If model disabled, ML_RISK_FALLBACK_ENABLED=true, or model fails
Use weighted heuristics:
Base: 0.15
days_overdue > 0: +0.08 × days (max 0.45)
due_in_days <= 2: +0.12
recent_activity_count == 0: +0.20
behavior_risk_score > 0: +0.25 × score
Response:

Configuration Thresholds:

ML_RISK_THRESHOLD_MEDIUM = 0.45 (default)
ML_RISK_THRESHOLD_HIGH = 0.75 (default)
Health Check Endpoint
Returns status of all loaded models and fallback availability

7. Backend Integration
Service Layer
Two main integrations:

A. Chatbot Classification (mlClassification.service.js)
Error Handling: Silently returns null on any ML service error

B. Task Risk Prediction (taskRiskPrediction.service.js)
Data Storage
UserBehaviorSignal Table (schema.prisma:165)
Stores every classification result:

TaskRiskSnapshot Table (schema.prisma:320)
Caches risk predictions per task per day:

Controller Layer (controllers)
Chatbot Controller: Calls chatbot.service.js → detects intent → calls classifyMessage → stores UserBehaviorSignal

Prediction Controller: Calls taskRiskPredictionService.predictTaskRisk() → returns risk prediction

8. Frontend Integration
Service Clients (services)
Chatbot Service (chatbotService.ts)
Returns: { reply, intent, classification }

Insights Service (insightsService.ts)
Returns:

Summary (completion rate, dominant label, top missed weekday)
Trends (completion, risk, labels by date)
Insights (actionable recommendations)
Metadata (cache status, timezone, generated timestamp)
UI Display Locations
Feature	Screen	Component
Chatbot with classifications	chatbot.tsx	Chatbot conversation interface
Behavior insights	insights.tsx	Charts + recommendations
Task risk indicators	tasks.tsx	Visual risk badges on task list
Risk snapshots	ProjectStatusReport, ProjectTasksList	Risk displays in project views
9. End-to-End Flow (Step-by-Step)
Flow A: Chatbot Classification Flow
Flow B: Task Risk Prediction Flow
10. Current Limitations / Gaps
Data Pipeline Gaps
No data validation at ingestion

CSV files can have inconsistent column names → relies on heuristic detection
No schema validation before training
No automated data quality checks (duplicates, outliers, missing patterns)
Limited preprocessing

Text preprocessing is identical for training and inference (good!)
But risk model preprocessing is optional (risk_preprocessor_path may not exist)
No feature scaling consistency between training and inference
No active data ingestion

Gryzzly dataset is static (training/raw/risk/)
No mechanism to automatically add new task data to training pipeline
No scheduled retraining process
Model & Training Gaps
Single model architecture

No ensemble methods or multiple model voting
Logistic Regression is simple but may lack non-linear patterns
Risk model not guaranteed to be trained (ML_RISK_MODEL_ENABLED defaults to false)
No hyperparameter tuning

Fixed hyperparameters in both train scripts
No GridSearchCV or cross-validation for optimization
Max-features (10K), test-size (0.2), random-state (42) hardcoded
Missing model evaluation on test data

Metrics logged to metadata but no automated quality gates
No A/B testing of model versions
No drift detection (if production data distribution changes)
Inference Gaps
Risk model inference dependency

Fallback mechanism exists but it's rule-based, not data-driven
If model fails or is disabled, quality degrades to heuristics
No confidence intervals or uncertainty quantification
No real-time feedback loop

Predictions are cached per day but not validated against actual outcomes
No feedback mechanism to detect when fallback outperforms model
No retraining triggers based on degrading performance
Frontend Integration Gaps
Risk prediction not visible on main UI

Risk predictions computed but Insights only shown in dedicated screen
No at-glance risk indicators on task list by default
Risk snapshots stored but not actively displayed during task management
Missing model explainability

Backend returns top_factors but frontend doesn't prominently explain them
User doesn't understand why a task is high-risk
No feature importance visualization
Storage & Monitoring Gaps
No model versioning infrastructure

Only one "active" model per type
No model registry, version control, or rollback capability
ML_MODELS_DIR path is environment-based (fragile)
No monitoring or logging

No metrics tracking (response times, prediction distributions, error rates)
No alerting if ML service is down or models are stale
Training metadata updated but no inference logging
Database schema limitations

UserBehaviorSignal stores raw predictions but no model version info
TaskRiskSnapshot source field is low-cardinality (on_demand vs scheduled)
No audit trail of model changes affecting predictions
11. Recommended Next Steps
Phase 1: Short-term (Data & Quality)
Implement data validation pipeline

Add JSON schema validation for input CSVs
Automatic column detection with fallbacks
Check for duplicates, missing values, outliers before training
Log data quality metrics to model_metadata.json
Add model evaluation gating

Require minimum accuracy/F1 scores before saving models
Auto-reject model if metrics degrade vs previous version
Test on holdout validation set (not just train/test split)
Implement active risk model training by default

Change ML_RISK_MODEL_ENABLED default to true
Train risk model in the pipeline (not optional)
Fall back to rules only if model training fails
Add cross-validation

Phase 2: Medium-term (Inference & Monitoring)
Implement model versioning

Timestamp-based model storage: /models/classifier_20260328_104532.pkl
Maintain model registry: models/registry.json
Store active version pointer
Support model rollback if new version fails
Add inference logging & monitoring

Log every prediction to inference.log (timestamp, input, output, latency, model_version)
Track prediction distributions (drift detection)
Alert if ML service latency > 500ms or error rate > 5%
Implement feedback loop

Create API endpoint to log actual task outcomes
After 30 days, mark task as missed/completed
Compare prediction vs actual for accuracy audit
Retrain on data with outcomes labeled
Add model explainability

For classifier: Return top contributing TF-IDF features
For risk: Return feature importance from LogisticRegression coefficients
expose explanation in API response and frontend