# Taskora ML Service

This folder contains local training and inference for Taskora AI models:
- Text classifier for chatbot behavior labels
- Task risk prediction model

## Folder layout

- `main.py`: FastAPI inference server
- `models/`: Saved model artifacts
- `training/`: Local training scripts
- `training/raw/classifier/`: Raw text classifier dataset
- `training/raw/risk/`: Raw Gryzzly risk datasets
- `data/processed/`: Processed datasets ready for training
- `tests/`: API and model validation tests

## Setup

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

## Train classifier locally

```bash
python training/train_classifier.py --dataset training/raw/classifier/productivity_dataset_2.csv --text-col text --label-col label
```

If your classifier CSV has different column names, change `--text-col` and `--label-col`.

## Train risk model locally

Place Gryzzly CSVs under:
- `training/raw/risk/tasks.csv`
- `training/raw/risk/tasks_computed.csv`
- `training/raw/risk/declarations.csv`
- (optional but retained for lineage) `projects.csv`, `projects_computed.csv`, `subscriptions.csv`, `teams.csv`, `users.csv`

The trainer now performs preprocessing + feature engineering before fitting:
- missing value handling
- date normalization
- derived features including `task_age_days`, `task_frequency`, and leave-one-out `project_historical_risk_rate`
- model-aligned features: `due_in_days`, `recent_activity_count`, `task_frequency`, `project_historical_risk_rate`

Then run:

```bash
python training/train_risk_model.py --raw-risk-dir training/raw/risk --dataset data/processed/risk_training.csv --target-col risk_target
```

Risk model training now also saves data-visualization artifacts for before and after preprocessing (histograms, correlations, missingness comparison, and class balance) under:

- `reports/figures/risk/before_preprocessing/`
- `reports/figures/risk/after_preprocessing/`
- `reports/figures/risk/`

You can override this location with:

```bash
python training/train_risk_model.py --visualization-dir reports/figures/risk
```

## Run inference API

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Environment variables

- `ML_MODELS_DIR`: defaults to `./models`
- `ML_RISK_MODEL_ENABLED`: defaults to `false`
- `ML_RISK_FALLBACK_ENABLED`: defaults to `true`
- `ML_RISK_THRESHOLD_MEDIUM`: defaults to `0.45`
- `ML_RISK_THRESHOLD_HIGH`: defaults to `0.75`

## Model metadata

Training scripts update:
- `models/model_metadata.json`

Use this to track training dataset, metrics, thresholds, and artifact paths.
