import joblib
import re
import pandas as pd

from datetime import datetime, timezone
from config import (
    CLASSIFIER_PATH,
    ML_RISK_THRESHOLD_HIGH,
    ML_RISK_THRESHOLD_MEDIUM,
    TFIDF_PATH,
    RISK_MODEL_PATH,
    RISK_PREPROCESSOR_PATH,
    ML_RISK_MODEL_ENABLED,
    ML_RISK_FALLBACK_ENABLED,
)
from schemas import ClassifyRequest, ClassifyResponse, PredictTaskRiskRequest, PredictTaskRiskResponse

vectorizer = None
classifier = None
risk_model = None
risk_preprocessor = None

def load_models() -> None:
    global vectorizer, classifier, risk_model, risk_preprocessor

    if not CLASSIFIER_PATH.exists() or not TFIDF_PATH.exists():
        missing_paths = [
            str(path)
            for path in (CLASSIFIER_PATH, TFIDF_PATH)
            if not path.exists()
        ]
        raise RuntimeError(f"Missing model files: {', '.join(missing_paths)}")

    classifier = joblib.load(CLASSIFIER_PATH)
    vectorizer = joblib.load(TFIDF_PATH)

    if ML_RISK_MODEL_ENABLED:
        if RISK_MODEL_PATH.exists():
            risk_model = joblib.load(RISK_MODEL_PATH)
            if RISK_PREPROCESSOR_PATH.exists():
                risk_preprocessor = joblib.load(RISK_PREPROCESSOR_PATH)
        elif not ML_RISK_FALLBACK_ENABLED:
            raise RuntimeError(
                f"Missing risk model file at {RISK_MODEL_PATH} while fallback is disabled"
            )


def clean_text(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s']", '', text)
    text = re.sub(r'\d+', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def _map_probability_to_risk(probability: float) -> str:
    if probability >= ML_RISK_THRESHOLD_HIGH:
        return "HIGH"
    if probability >= ML_RISK_THRESHOLD_MEDIUM:
        return "MEDIUM"
    return "LOW"

def _extract_top_factors(payload: PredictTaskRiskRequest, probability: float) -> list[str]:
    factors: list[str] = []

    if payload.days_overdue is not None and payload.days_overdue > 0:
        factors.append("task_overdue")

    if payload.due_in_days is not None and payload.due_in_days <= 2:
        factors.append("deadline_very_close")

    if payload.recent_activity_count <= 0:
        factors.append("no_recent_activity")
    elif payload.recent_activity_count < 3:
        factors.append("low_recent_activity")

    if payload.behavior_risk_score > 0:
        factors.append("behavior_signal_risk")

    if probability >= ML_RISK_THRESHOLD_HIGH:
        factors.append("model_high_probability")

    if not factors:
        factors.append("baseline_task_risk")

    return factors


def _fallback_predict_task_risk(payload: PredictTaskRiskRequest) -> PredictTaskRiskResponse:
    if payload.is_completed:
        return PredictTaskRiskResponse(
            risk="LOW",
            probability=0.05,
            top_factors=["task_already_completed"],
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

    factors: list[str] = []
    probability = 0.15

    if payload.days_overdue is not None and payload.days_overdue > 0:
        overdue_weight = min(payload.days_overdue * 0.08, 0.45)
        probability += overdue_weight
        factors.append("task_overdue")

    if payload.due_in_days is not None and payload.due_in_days <= 2:
        probability += 0.12
        factors.append("deadline_very_close")

    if payload.recent_activity_count <= 0:
        probability += 0.2
        factors.append("no_recent_activity")
    elif payload.recent_activity_count < 3:
        probability += 0.1
        factors.append("low_recent_activity")

    if payload.behavior_risk_score > 0:
        probability += min(payload.behavior_risk_score, 1.0) * 0.25
        factors.append("behavior_signal_risk")

    probability = max(0.01, min(probability, 0.99))
    risk = _map_probability_to_risk(probability)

    if not factors:
        factors = ["baseline_task_risk"]

    return PredictTaskRiskResponse(
        risk=risk,
        probability=round(probability, 4),
        top_factors=factors,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


def _model_predict_task_risk(payload: PredictTaskRiskRequest) -> PredictTaskRiskResponse:
    if risk_model is None:
        raise RuntimeError("Risk model is not loaded")

    if payload.is_completed:
        return PredictTaskRiskResponse(
            risk="LOW",
            probability=0.05,
            top_factors=["task_already_completed"],
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

    feature_frame = pd.DataFrame(
        [
            {
                "is_completed": int(payload.is_completed),
                "due_in_days": payload.due_in_days,
                "days_overdue": payload.days_overdue,
                "recent_activity_count": payload.recent_activity_count,
                "behavior_risk_score": payload.behavior_risk_score,
            }
        ]
    )

    model_input = feature_frame
    if risk_preprocessor is not None:
        model_input = risk_preprocessor.transform(feature_frame)

    if hasattr(risk_model, "predict_proba"):
        probabilities = risk_model.predict_proba(model_input)[0]
        positive_index = 1

        classes = getattr(risk_model, "classes_", None)
        if classes is not None:
            classes_list = [str(item).upper() for item in classes]
            if "1" in classes_list:
                positive_index = classes_list.index("1")
            elif "TRUE" in classes_list:
                positive_index = classes_list.index("TRUE")
            elif "HIGH" in classes_list:
                positive_index = classes_list.index("HIGH")
            elif len(classes_list) == 2:
                positive_index = 1

        probability = float(probabilities[positive_index])
    else:
        prediction = risk_model.predict(model_input)[0]
        probability = 0.8 if int(prediction) == 1 else 0.2

    probability = max(0.01, min(probability, 0.99))
    risk = _map_probability_to_risk(probability)

    return PredictTaskRiskResponse(
        risk=risk,
        probability=round(probability, 4),
        top_factors=_extract_top_factors(payload, probability),
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
