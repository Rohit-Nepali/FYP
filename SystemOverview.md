## 1. High-Level Architecture

The system consists of three interconnected layers:

* **React Native Frontend (client)** - User-facing interface
* **Node.js/Express Backend (server)** - Orchestration and business logic
* **Python FastAPI ML Service (ml-service)** - Model inference and training

### Flow Pattern:
*(Add flow details or diagrams here)*

### Key API Endpoints

| Endpoint | Method | Purpose | Called By |
| :--- | :--- | :--- | :--- |
| `/chatbot/message` | `POST` | User chatbot interaction | Frontend |
| `/classify` | `POST` | Text classification (ML Service) | Backend |
| `/predict-task-risk` | `POST` | Task risk prediction (ML Service) | Backend |
| `/predictions/task-risk` | `POST` | Create risk snapshot | Frontend |
| `/insights/user-behavior` | `GET` | Behavior analytics | Frontend |


## 2. Data Sources

### Classifier Dataset (Text + Labels)
* **Location:** `classifier`
* **File:** `productivity_dataset_2.csv`
* **Structure:** Text messages + 8 behavioral labels
* **Labels:** HIGH_MOTIVATION, CONSISTENT_PRODUCTIVITY, LOW_ENERGY, WORK_OVERLOAD, DISTRACTION, PROCRASTINATION, POOR_PLANNING, FORGETFULNESS
* **Used for:** Training text classifier (TF-IDF + Logistic Regression)

### Risk Prediction Dataset (Gryzzly Dataset)
* **Location:** `risk`
* **Files:**
  * `tasks.csv` - Task metadata
  * `tasks_computed.csv` - Computed task statistics
  * `declarations.csv` - User activity declarations (time tracking)
  * *(Optional)* `projects.csv`, `users.csv`, `teams.csv` - Context data
* **Used for:** Training task risk prediction model

### Live Data Sources (Database)
* **Database:** PostgreSQL via Prisma ORM
* **Tables:**
  * `UserBehaviorSignal` - Stores classified chatbot messages + confidence
  * `Task` - Task metadata (due dates, completion status)
  * `Activity` - Task activity history (7-day windows used for feature engineering)



## 3. Data Processing Pipeline

### Classifier Text Preprocessing (`train_classifier.py`)
**Pipeline Steps:**

1. **Load CSV:** Infer text and label columns automatically.
2. **Clean Text:** Apply regex preprocessing for noise reduction.
3. **Data Cleaning:** Remove empty rows and filter for invalid labels.
4. **Data Splitting:** Stratified train/test split (default 80/20).
5. **TF-IDF Vectorization:** * Max 10,000 features
   * 1-2 grams (unigrams and bigrams)
   * `min_df=2`
6. **Validation:** Store train/test metrics for performance tracking.

---

### Risk Model Feature Engineering (`train_risk_model.py`)

#### Input Features (from Gryzzly data):
* `is_completed` – Task completion status.
* `due_in_days` – Remaining time until the deadline.
* `days_overdue` – Number of days past the deadline.
* `recent_activity_count` – Activity logs within the last 7 days.
* `behavior_risk_score` – Aggregated risk from behavior signals.

#### Feature Derivation:
1. **Merge Data:** Combine `tasks.csv` + `tasks_computed.csv` + `declarations.csv`.
2. **Normalize Duration:** Convert time fields (nanoseconds → seconds).
3. **Compute Aggregations:**
   * `recent_activity_count`: Count of declarations in the last 7 days.
   * `task_delay_days`: Calculated as `(completion_date - created_at)`.
   * `completion_rate_project`: Ratio of `completed / total` tasks within the project.
4. **Imputation:** Fill missing values with `0`.
5. **Scaling:** Standardize numeric features for model stability.



## 4. Model Training Pipeline

### Classifier Training (`train_classifier.py`)
**Command:**
`python ml-service/train_classifier.py`

**Training Details:**
* **Vectorizer:** `TfidfVectorizer` (1-2 grams, 10K features)
* **Model:** `LogisticRegression` (Multinomial, balanced class weights)
* **Evaluation:** Accuracy + Macro F1-Score
* **Output Artifacts:** * `taskora_classifier.pkl`
  * `taskora_tfidf.pkl`

---

### Risk Model Training (`train_risk_model.py`)
**Command:**
`python ml-service/train_risk_model.py`

**Training Details:**
* **Model:** `LogisticRegression` (with Scikit-learn pipeline preprocessing)
* **Features:** 5 model-aligned features (defined in Section 3)
* **Preprocessing:** `SimpleImputer` + `StandardScaler` within the pipeline
* **Evaluation:** Accuracy, F1-Score, ROC-AUC
* **Output Artifacts:** * `taskora_risk_model.pkl`
  * `taskora_risk_preprocessor.pkl`

---

### Validation & Metrics
All metrics are automatically logged to `models/model_metadata.json` for version tracking.

**Tracked Parameters:**
* Dataset file paths
* Target classes/labels
* Performance metrics (Accuracy, F1)
* Sample sizes (Train/Test split)
* Last update timestamps


## 5. Model Storage and Versioning

### Model Artifacts Location
**Path:** `models/`

| File | Description |
| :--- | :--- |
| `taskora_classifier.pkl` | Text classifier (LogisticRegression) |
| `taskora_tfidf.pkl` | TF-IDF vectorizer |
| `taskora_risk_model.pkl` | Task risk classifier (can be disabled) |
| `taskora_risk_preprocessor.pkl` | Risk model preprocessing pipeline |
| `model_metadata.json` | Training metadata and metrics |

---

### Versioning & Fallback Mechanism
The system implements environment-based versioning and safety nets to ensure service availability.

#### Fallback Strategy:
* **Classifier:** **Mandatory** — The service will fail to initialize if this artifact is missing.
* **Risk Model:** **Optional** — Controlled via the environment variable `ML_RISK_MODEL_ENABLED=true`.
* **Risk Fallback:** If the risk model fails or is disabled, `ML_RISK_FALLBACK_ENABLED=true` triggers a rule-based heuristic fallback.

#### Current Deployment Approach:
> [!NOTE]
> The current architecture uses a simplified deployment flow.
* **Single Active Model:** No explicit versioning (only one "active" model per type is stored).
* **Hot-Reloading:** Models are loaded into memory at FastAPI startup.
* **Infrastructure Limits:** No current support for A/B testing or canary deployments.


## 6. Model Serving (Inference Layer)

### FastAPI Service (`main.py`)
**Startup:**
The service initializes by loading model artifacts from the `models/` directory into memory.

---

### Endpoint 1: `/classify` (POST)
**Request:**
Accepts raw text messages from the user chatbot.

**Processing:**
1. **Sanitization:** Clean text using the same `clean_text()` utility function used during training.
2. **Vectorization:** Transform cleaned text via the loaded TF-IDF vectorizer.
3. **Inference:** Generate class probabilities using `LogisticRegression.predict_proba()`.
4. **Ranking:** Extract the top-performing class and its associated confidence score.

**Response:**
* Returns the predicted behavior label and confidence.
* **Fallback:** Returns `null` if the message is empty or contains invalid labels.

---

### Endpoint 2: `/predict-task-risk` (POST)
**Request:**
Accepts task metadata and behavior signal scores.

**Processing (Two-Path Logic):**

#### Path A: Model-Based (Primary)
*Activated if `ML_RISK_MODEL_ENABLED=true`*
1. **Transform:** Pass raw features through the `taskora_risk_preprocessor` pipeline.
2. **Predict:** Get probability scores from `taskora_risk_model`.
3. **Categorize:** Map probabilities to risk levels using defined thresholds.

#### Path B: Fallback / Rule-Based (Secondary)
*Activated if model is disabled, fails, or `ML_RISK_FALLBACK_ENABLED=true`*
Uses weighted heuristics to calculate risk:
* **Base Risk:** `0.15`
* **Overdue:** `+0.08` per day (capped at `0.45`)
* **Urgency:** `+0.12` if `due_in_days <= 2`
* **Inactivity:** `+0.20` if `recent_activity_count == 0`
* **Behavior:** `+0.25` multiplied by the `behavior_risk_score`

**Response:**
Returns a numerical `risk_score` and a categorical `risk_level` (Low, Medium, High).

---

### Configuration Thresholds
The risk levels are determined by the following default environment variables:
* **Medium Risk:** `0.45`
* **High Risk:** `0.75`

### Health Check Endpoint
A dedicated endpoint that returns the operational status of all loaded models and indicates whether fallback mechanisms are currently active.


## 7. Backend Integration

### Service Layer
The Node.js backend integrates with the ML service through two primary dedicated services:

#### A. Chatbot Classification (`mlClassification.service.js`)
* **Role:** Acts as the bridge between the Express controller and the FastAPI `/classify` endpoint.
* **Error Handling:** Implements a "fail-silent" strategy—returns `null` on any ML service error to prevent interrupting the user chat experience.

#### B. Task Risk Prediction (`taskRiskPrediction.service.js`)
* **Role:** Orchestrates data gathering (Task + Activity) to send to the FastAPI `/predict-task-risk` endpoint.
* **Optimization:** Handles the logic for choosing between the ML model and the rule-based fallback.

---

### Data Storage (Prisma ORM)

#### `UserBehaviorSignal` Table (`schema.prisma:165`)
Stores every classification result for historical analysis and feature engineering.
* **Fields:** `id`, `userId`, `messageText`, `label`, `confidence`, `createdAt`.

#### `TaskRiskSnapshot` Table (`schema.prisma:320`)
Caches risk predictions per task per day to provide time-series insights.
* **Fields:** `id`, `taskId`, `riskScore`, `riskLevel`, `snapshotDate`.

---

### Controller Layer (`controllers/`)

* **Chatbot Controller:** 1. Receives message via `chatbot.service.js`.
  2. Detects user intent.
  3. Calls `classifyMessage` (ML).
  4. Persists result in `UserBehaviorSignal`.

* **Prediction Controller:** 1. Triggered by frontend or scheduled jobs.
  2. Calls `taskRiskPredictionService.predictTaskRisk()`.
  3. Returns final risk assessment to the client.


## 8. Frontend Integration

### Service Clients (`services/`)

#### Chatbot Service (`chatbotService.ts`)
* **Role:** Manages real-time communication with the Express backend.
* **Output:** Returns a response object containing `{ reply, intent, classification }`.

#### Insights Service (`insightsService.ts`)
**Returns:**
* **Summary:** Completion rate, dominant behavior label, and "top missed weekday" analytics.
* **Trends:** Time-series data for task completion, risk fluctuations, and labels by date.
* **Insights:** AI-generated actionable recommendations for the user.
* **Metadata:** Cache status, timezone, and generation timestamps.

---

### UI Display Locations

The frontend consumes ML data across several key screens to provide a cohesive user experience:

| Feature Screen | Component | Description |
| :--- | :--- | :--- |
| **Chatbot** | `chatbot.tsx` | Interactive conversation interface displaying classifications. |
| **Behavior Insights** | `insights.tsx` | Visual charts and productivity recommendations. |
| **Task Risk Indicators** | `tasks.tsx` | Visual risk badges (Low/Med/High) displayed on the task list. |
| **Risk Snapshots** | `ProjectStatusReport` | High-level risk displays within project management views. |

## 9. End-to-End Flow (Step-by-Step)

### Flow A: Chatbot Classification Flow
This flow describes how user messages are transformed into behavioral insights.

1.  **Frontend:** User types a message in `chatbot.tsx` and sends it to the Express backend.
2.  **Backend (Controller):** `ChatbotController` receives the message and triggers `chatbot.service.js`.
3.  **Backend (Service):** The service calls the Python ML Service `/classify` endpoint.
4.  **ML Service (FastAPI):** * Preprocesses text (regex/cleaning).
    * Runs TF-IDF vectorization.
    * Predicts class probabilities using the Logistic Regression model.
    * Returns the top label (e.g., `WORK_OVERLOAD`) and confidence score.
5.  **Backend (Persistence):** The result is saved to the `UserBehaviorSignal` table via Prisma.
6.  **Frontend (Display):** The chatbot UI displays the reply, and the classification is used to update the user's productivity insights.

---

### Flow B: Task Risk Prediction Flow
This flow describes how task metadata and behavioral history are used to predict deadlines at risk.

1.  **Frontend:** User opens the task list or project report (`tasks.tsx`).
2.  **Backend (Service):** `taskRiskPrediction.service.js` gathers data for the specific task:
    * Task metadata (due dates, status).
    * Historical activity (7-day window).
    * Aggregated `UserBehaviorSignal` scores.
3.  **Backend (ML Call):** Data is POSTed to the `/predict-task-risk` endpoint.
4.  **ML Service (FastAPI):**
    * **Primary:** If enabled, the ML model processes features through the pipeline and returns a probability.
    * **Secondary:** If the model is offline, the rule-based heuristic calculates a score based on overdue days and activity.
5.  **Backend (Caching):** The result is stored in `TaskRiskSnapshot` to track risk trends over time.
6.  **Frontend (Visual):** The UI renders a color-coded risk badge (e.g., a Red "High Risk" badge) next to the task.

## 10. Current Limitations / Gaps

### Data Pipeline Gaps
* **Ingestion Validation:** No schema validation for input CSVs; column detection relies on heuristics which may fail if headers change.
* **Preprocessing Inconsistency:** While text cleaning is synced, risk model scaling/preprocessing is optional and may lead to inconsistent inference if the preprocessor artifact is missing.
* **Static Datasets:** The system uses static files (Gryzzly dataset) with no automated pipeline to ingest new production data for retraining.

### Model & Training Gaps
* **Simplistic Architecture:** Relies solely on Logistic Regression; lacks ensemble methods or non-linear pattern recognition (e.g., Random Forest or XGBoost).
* **Optimization:** No hyperparameter tuning (GridSearchCV) or cross-validation; training uses hardcoded constants for features and splits.
* **Quality Gates:** Metrics are logged but not enforced; models are saved even if accuracy drops significantly compared to previous versions.

### Inference & Integration Gaps
* **Heuristic Reliance:** The risk fallback is rule-based rather than data-driven, leading to degraded accuracy when the ML model is disabled.
* **UI/UX Visibility:** Risk indicators are not yet integrated into the primary task list; "Explainability" is missing, so users don't know *why* a task is flagged as high-risk.
* **Feedback Loop:** No mechanism to compare predicted risk vs. actual task outcomes to measure real-world precision.

### Monitoring & Infrastructure Gaps
* **Versioning:** No model registry or rollback capability; the system only supports one "active" model at a time.
* **Observability:** Lack of telemetry for inference latency, prediction drift, or error rates.
* **Schema Limits:** Database tables store predictions but fail to record which model version generated them.
