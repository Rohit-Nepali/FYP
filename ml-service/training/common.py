from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

try:
    from simplemma import lemmatize as simplemma_lemmatize
except ImportError:  # pragma: no cover - handled by runtime fallback
    simplemma_lemmatize = None

VALID_LABELS = {
    "HIGH_MOTIVATION",
    "CONSISTENT_PRODUCTIVITY",
    "LOW_ENERGY",
    "WORK_OVERLOAD",
    "DISTRACTION",
    "PROCRASTINATION",
    "POOR_PLANNING",
    "FORGETFULNESS",
}

BASE_DIR = Path(__file__).resolve().parents[1]
WORKSPACE_ROOT = BASE_DIR.parent
TRAINING_DIR = BASE_DIR / "training"
RAW_CLASSIFIER_DIR = TRAINING_DIR / "raw" / "classifier"
RAW_RISK_DIR = TRAINING_DIR / "raw" / "risk"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
MODELS_DIR = BASE_DIR / "models"
CLASSIFIER_PATH = MODELS_DIR / "taskora_classifier.pkl"
TFIDF_PATH = MODELS_DIR / "taskora_tfidf.pkl"
RISK_MODEL_PATH = MODELS_DIR / "taskora_risk_model.pkl"
RISK_PREPROCESSOR_PATH = MODELS_DIR / "taskora_risk_preprocessor.pkl"
METADATA_PATH = MODELS_DIR / "model_metadata.json"


TEXT_COLUMN_CANDIDATES = ["message", "text", "input", "content", "sentence"]
LABEL_COLUMN_CANDIDATES = ["label", "category", "class", "target"]


def clean_text(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r"[^a-z0-9\s']", "", text)
    text = re.sub(r"\d+", "", text)
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        return ""

    if simplemma_lemmatize is None:
        return text

    tokens = text.split(" ")
    lemmatized_tokens = [simplemma_lemmatize(token, lang="en") for token in tokens]
    return " ".join(lemmatized_tokens)


def ensure_models_dir() -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)


def read_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")
    return pd.read_csv(path)


def infer_columns(df: pd.DataFrame, text_col: str | None, label_col: str | None) -> tuple[str, str]:
    resolved_text_col = text_col
    resolved_label_col = label_col

    if resolved_text_col is None:
        for candidate in TEXT_COLUMN_CANDIDATES:
            if candidate in df.columns:
                resolved_text_col = candidate
                break

    if resolved_label_col is None:
        for candidate in LABEL_COLUMN_CANDIDATES:
            if candidate in df.columns:
                resolved_label_col = candidate
                break

    if resolved_text_col is None or resolved_label_col is None:
        raise ValueError(
            "Could not infer text/label columns. Provide --text-col and --label-col explicitly."
        )

    return resolved_text_col, resolved_label_col


def update_metadata(section: str, payload: dict) -> None:
    ensure_models_dir()

    existing = {}
    if METADATA_PATH.exists():
        with METADATA_PATH.open("r", encoding="utf-8") as file_obj:
            existing = json.load(file_obj)

    existing[section] = {
        **payload,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    with METADATA_PATH.open("w", encoding="utf-8") as file_obj:
        json.dump(existing, file_obj, indent=2)
