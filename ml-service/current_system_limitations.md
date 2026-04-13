# Phase 1 - ML Core Audit and Model Evidence Reconciliation

Scope note: this phase excludes notebook analysis and uses only deployed ml-service code, training scripts, and saved model artifacts.

## 1 Models In Use (Actual)

### A. Text Behavior Classifier
- Type: ML model (multiclass Logistic Regression with TF-IDF features)
- Training implementation:
	- training/train_classifier.py -> TfidfVectorizer(max_features=10000, ngram_range=(1,2), min_df=2)
	- training/train_classifier.py -> LogisticRegression(max_iter=2000, class_weight="balanced", multi_class="multinomial")
- Runtime inference:
	- main.py -> POST /classify
	- ml_engine.py -> clean_text(), vectorizer.transform(), classifier.predict_proba()
- Artifacts:
	- models/taskora_classifier.pkl
	- models/taskora_tfidf.pkl

### B. Task Risk Predictor
- Type: ML model (binary Logistic Regression wrapped in sklearn Pipeline + ColumnTransformer)
- Training implementation:
	- training/train_risk_model.py -> Pipeline(preprocessor + LogisticRegression(max_iter=2000, class_weight="balanced"))
- Runtime inference:
	- main.py -> POST /predict-task-risk
	- ml_engine.py -> _model_predict_task_risk()
- Artifacts:
	- models/taskora_risk_model.pkl
	- models/taskora_risk_preprocessor.pkl

### C. Rule-Based Fallback (Not ML)
- ml_engine.py -> _fallback_predict_task_risk()
- This is deterministic heuristic scoring, not learned behavior.
- Important operational fact: config defaults enable fallback and disable risk model.
	- config.py -> ML_RISK_MODEL_ENABLED default false
	- config.py -> ML_RISK_FALLBACK_ENABLED default true

## 2) ML vs Rule-Based Classification (Phase 1 Judgment)

### Truly ML
- Text classification path (/classify) is ML-based and uses trained artifacts.
- Risk prediction path can be ML-based only when ML_RISK_MODEL_ENABLED=true and model loads successfully.

### Rule-Based or Hardcoded
- Risk prediction in default runtime config is effectively rule-based because fallback is the active path.
- Risk level mapping thresholds are hardcoded configurable cutoffs:
	- ML_RISK_THRESHOLD_MEDIUM default 0.45
	- ML_RISK_THRESHOLD_HIGH default 0.75
- Factor explanations are rule-derived tags from payload conditions, not model explanation techniques.

### Hardcoded Logic Disguised as ML (Critical)
- If deployment leaves ML_RISK_MODEL_ENABLED=false, API still returns risk/probability outputs that look like ML predictions but are produced by handcrafted weights in _fallback_predict_task_risk().

## 3) Evidence Reconciliation (Training vs Runtime)

### Text Classifier - Mostly Consistent
- Text cleaning logic is consistent in both training/common.py and runtime/ml_engine.py.
- Both remove digits and special chars, keep apostrophes.

Potential issue:
- Removing all numbers can drop deadline/context signals (e.g., "2 days", "3pm").

### Risk Model - Feature Contract Mismatch
- Training features in training/train_risk_model.py default:
	- due_in_days
	- recent_activity_count
	- task_frequency
	- project_historical_risk_rate
- Runtime payload in ml_engine.py / schemas.py expects:
	- is_completed
	- due_in_days
	- days_overdue
	- recent_activity_count
	- behavior_risk_score

This is a major inconsistency risk:
- Saved preprocessor/model may expect one feature schema while inference provides another.
- Depending on the trained artifact version, this can cause misalignment, degraded prediction quality, or runtime transformation errors.

### README Drift
- README describes older/additional risk features (including overdue_indicator/completion_rate_project wording), while training script currently finalizes a different schema.
- Documentation is not fully synchronized with executable pipeline.

## 4) Validation and Overfitting Risk Assessment

### Classifier
- model_metadata.json reports very high performance:
	- accuracy ~0.9965, macro_f1 ~0.9965
- Risk flags:
	- Single random holdout split only (no cross-validation)
	- No robustness or OOD evaluation in automated tests
	- Very high score can indicate easy/near-duplicate data patterns after cleaning

### Risk Model
- model_metadata.json:
	- accuracy ~0.9348
	- macro_f1 ~0.7705
	- roc_auc ~0.9425
- Class-wise imbalance evidence:
	- Positive-class precision is much lower than negative class.
	- Macro F1 significantly below accuracy confirms minority-class challenge.
- Risk flags:
	- No time-aware validation split
	- No threshold calibration workflow tied to business outcomes
	- No ablation or sensitivity analysis for engineered features

## 5) Missing Pipeline Components (Phase 1)

- No formal feature contract/versioning between training and inference for risk model.
- No automated training-to-serving compatibility check.
- No calibration diagnostics (PR curve tuning, cost-based threshold optimization).
- No drift monitoring (data drift or performance drift).
- No meaningful model quality tests in tests/ beyond shape/existence checks.

## 6) Hardcoded Values and Magic Numbers (Phase 1 Inventory)

### In risk fallback/inference logic
- base probability: 0.15
- overdue weight per day: 0.08, capped at 0.45
- due soon adjustment (<=2 days): +0.12
- no activity adjustment: +0.2
- low activity adjustment (<3): +0.1
- behavior risk scaling: *0.25
- probability clamp: [0.01, 0.99]

### In risk target engineering
- completion proxy: elapsed >= 95% planned
- overrun proxy: elapsed > 120% planned
- abandonment proxy: >30 days inactivity
- recency window: 7 days

### In preprocessing and training defaults
- random_state: 42
- test_size: 0.2
- max_iter: 2000

## 7) Phase 1 Verdict (Brutally Honest)

- There are real ML models in this project.
- But the risk prediction path can operate as non-ML in default configuration, which is a credibility risk if presented as always ML-driven.
- The highest technical risk right now is feature-schema drift between risk training pipeline and runtime inference payload.
- Current validation/testing depth is insufficient for strong academic or production claims.

## 8) Immediate Phase 1 Fix Priorities (Next Actions)

1. Enforce a single canonical risk feature schema shared by training and inference.
2. Add startup compatibility check: model expected feature names vs runtime payload columns.
3. Make runtime source explicit in responses (e.g., source: model|fallback) to avoid fake-ML perception.
4. Add cross-validation and class-imbalance-focused metrics reporting for both models.
5. Align README and metadata with actual executable feature pipeline.
