import logging
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

logger = logging.getLogger(__name__)

vectorizer = None
classifier = None
risk_model = None
risk_preprocessor = None
RISK_FEATURE_COLUMNS = [
    "due_in_days",
    "recent_activity_count",
    "task_frequency",
    "project_historical_risk_rate",
]

def load_models() -> None:
    global vectorizer, classifier, risk_model, risk_preprocessor

    logger.info("Loading classifier model from %s", CLASSIFIER_PATH)
    logger.info("Loading TF-IDF vectorizer from %s", TFIDF_PATH)

    if not CLASSIFIER_PATH.exists() or not TFIDF_PATH.exists():
        missing_paths = [
            str(path)
            for path in (CLASSIFIER_PATH, TFIDF_PATH)
            if not path.exists()
        ]
        logger.error("Missing classifier artifacts: %s", ", ".join(missing_paths))
        raise RuntimeError(f"Missing model files: {', '.join(missing_paths)}")

    classifier = joblib.load(CLASSIFIER_PATH)
    vectorizer = joblib.load(TFIDF_PATH)
    logger.info("Classifier artifacts loaded successfully")

    if ML_RISK_MODEL_ENABLED:
        logger.info("Risk model loading is enabled")
        if RISK_MODEL_PATH.exists():
            logger.info("Loading risk model from %s", RISK_MODEL_PATH)
            risk_model = joblib.load(RISK_MODEL_PATH)
            if RISK_PREPROCESSOR_PATH.exists():
                logger.info("Loading risk preprocessor from %s", RISK_PREPROCESSOR_PATH)
                risk_preprocessor = joblib.load(RISK_PREPROCESSOR_PATH)
            else:
                logger.warning("Risk preprocessor artifact not found at %s", RISK_PREPROCESSOR_PATH)

            # Validate saved preprocessing contract against runtime feature schema.
            if risk_preprocessor is not None:
                schema = getattr(risk_preprocessor, "feature_names_in_", None)
                if schema is not None:
                    if list(schema) != RISK_FEATURE_COLUMNS:
                        logger.error(
                            "Risk preprocessor feature schema mismatch: expected %s, got %s",
                            RISK_FEATURE_COLUMNS,
                            list(schema),
                        )
                        raise RuntimeError(
                            "Risk preprocessor feature schema mismatch. "
                            f"Expected {RISK_FEATURE_COLUMNS}, got {list(schema)}"
                        )
                logger.info("Risk preprocessor schema check passed")
            logger.info("Risk model artifacts loaded successfully")
        elif not ML_RISK_FALLBACK_ENABLED:
            logger.error(
                "Risk model file missing at %s and fallback is disabled",
                RISK_MODEL_PATH,
            )
            raise RuntimeError(
                f"Missing risk model file at {RISK_MODEL_PATH} while fallback is disabled"
            )
        else:
            logger.warning(
                "Risk model file missing at %s; fallback prediction will be used",
                RISK_MODEL_PATH,
            )
    elif ML_RISK_FALLBACK_ENABLED:
        logger.warning("Risk model loading is disabled; fallback prediction will be used")


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

    if payload.due_in_days is not None and payload.due_in_days <= 2:
        factors.append("deadline_very_close")

    if payload.recent_activity_count <= 0:
        factors.append("no_recent_activity")
    elif payload.recent_activity_count < 3:
        factors.append("low_recent_activity")

    if payload.task_frequency is not None:
        if payload.task_frequency <= 0:
            factors.append("no_task_activity")
        elif payload.task_frequency < 0.1:
            factors.append("low_task_frequency")

    if payload.project_historical_risk_rate is not None and payload.project_historical_risk_rate >= 0.5:
        factors.append("project_high_historical_risk")

    if probability >= ML_RISK_THRESHOLD_HIGH:
        factors.append("model_high_probability")

    if not factors:
        factors.append("baseline_task_risk")

    return factors


def _fallback_predict_task_risk(payload: PredictTaskRiskRequest) -> PredictTaskRiskResponse:
    factors: list[str] = []
    probability = 0.15

    if payload.due_in_days is not None and payload.due_in_days <= 2:
        probability += 0.12
        factors.append("deadline_very_close")

    if payload.recent_activity_count <= 0:
        probability += 0.2
        factors.append("no_recent_activity")
    elif payload.recent_activity_count < 3:
        probability += 0.1
        factors.append("low_recent_activity")

    if payload.task_frequency is not None:
        if payload.task_frequency <= 0:
            probability += 0.2
            factors.append("no_task_activity")
        elif payload.task_frequency < 0.1:
            probability += 0.1
            factors.append("low_task_frequency")

    if payload.project_historical_risk_rate is not None and payload.project_historical_risk_rate > 0:
        probability += min(payload.project_historical_risk_rate, 1.0) * 0.25
        factors.append("project_historical_risk")

    probability = max(0.01, min(probability, 0.99))
    risk = _map_probability_to_risk(probability)

    if not factors:
        factors = ["baseline_task_risk"]

    logger.info(
        "Task risk prediction completed using fallback source: risk=%s probability=%s",
        risk,
        round(probability, 4),
    )

    return PredictTaskRiskResponse(
        risk=risk,
        probability=round(probability, 4),
        top_factors=factors,
        source="fallback",
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


def _model_predict_task_risk(payload: PredictTaskRiskRequest) -> PredictTaskRiskResponse:
    if risk_model is None:
        logger.error("Risk model prediction requested but no model is loaded")
        raise RuntimeError("Risk model is not loaded")

    feature_frame = pd.DataFrame(
        [
            {
                "due_in_days": payload.due_in_days,
                "recent_activity_count": payload.recent_activity_count,
                "task_frequency": payload.task_frequency,
                "project_historical_risk_rate": payload.project_historical_risk_rate,
            }
        ]
    )[RISK_FEATURE_COLUMNS]

    model_input = feature_frame
    model_has_internal_preprocessor = (
        hasattr(risk_model, "named_steps")
        and isinstance(getattr(risk_model, "named_steps", None), dict)
        and "preprocessor" in risk_model.named_steps
    )

    if not model_has_internal_preprocessor and risk_preprocessor is not None:
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

    logger.info(
        "Task risk prediction completed using model source: risk=%s probability=%s",
        risk,
        round(probability, 4),
    )

    return PredictTaskRiskResponse(
        risk=risk,
        probability=round(probability, 4),
        top_factors=_extract_top_factors(payload, probability),
        source="model",
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
