from typing import Final
from pathlib import Path
import os

VALID_LABELS: Final[set[str]] = {
    "HIGH_MOTIVATION",
    "CONSISTENT_PRODUCTIVITY",
    "LOW_ENERGY",
    "WORK_OVERLOAD",
    "DISTRACTION",
    "PROCRASTINATION",
    "POOR_PLANNING",
    "FORGETFULNESS",
}

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = Path(os.getenv("ML_MODELS_DIR", BASE_DIR / "models"))
CLASSIFIER_PATH = MODELS_DIR / "taskora_classifier.pkl"
TFIDF_PATH = MODELS_DIR / "taskora_tfidf.pkl"
RISK_MODEL_PATH = MODELS_DIR / "taskora_risk_model.pkl"
RISK_PREPROCESSOR_PATH = MODELS_DIR / "taskora_risk_preprocessor.pkl"

ML_RISK_MODEL_ENABLED = os.getenv("ML_RISK_MODEL_ENABLED", "false").lower() == "true"
ML_RISK_FALLBACK_ENABLED = os.getenv("ML_RISK_FALLBACK_ENABLED", "true").lower() == "true"
ML_RISK_THRESHOLD_MEDIUM = float(os.getenv("ML_RISK_THRESHOLD_MEDIUM", "0.45"))
ML_RISK_THRESHOLD_HIGH = float(os.getenv("ML_RISK_THRESHOLD_HIGH", "0.75"))
