from pathlib import Path
import re
from typing import Final

import joblib
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator


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
MODELS_DIR = BASE_DIR / "models"
CLASSIFIER_PATH = MODELS_DIR / "taskora_classifier.pkl"
TFIDF_PATH = MODELS_DIR / "taskora_tfidf.pkl"


def clean_text(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s']", '', text)
    text = re.sub(r'\d+', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


class ClassifyRequest(BaseModel):
    message: str

    @field_validator("message")
    @classmethod
    def message_must_not_be_empty(cls, value: str) -> str:
        if value is None or not value.strip():
            raise ValueError("message is required and cannot be empty")
        return value


class ClassifyResponse(BaseModel):
    label: str
    confidence: float


app = FastAPI(title="Taskora ML Service")

vectorizer = None
classifier = None


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "message is required and cannot be empty",
            "errors": exc.errors(),
        },
    )


@app.on_event("startup")
def load_models() -> None:
    global vectorizer, classifier

    if not CLASSIFIER_PATH.exists() or not TFIDF_PATH.exists():
        missing_paths = [
            str(path)
            for path in (CLASSIFIER_PATH, TFIDF_PATH)
            if not path.exists()
        ]
        raise RuntimeError(f"Missing model files: {', '.join(missing_paths)}")

    classifier = joblib.load(CLASSIFIER_PATH)
    vectorizer = joblib.load(TFIDF_PATH)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/classify", response_model=ClassifyResponse)
def classify(payload: ClassifyRequest) -> ClassifyResponse:
    normalized_message = clean_text(payload.message)

    if not normalized_message:
        raise HTTPException(status_code=422, detail="message is required and cannot be empty")

    transformed_text = vectorizer.transform([normalized_message])
    probabilities = classifier.predict_proba(transformed_text)[0]

    predicted_index = int(probabilities.argmax())
    predicted_label = str(classifier.classes_[predicted_index])
    confidence = float(probabilities[predicted_index])

    if predicted_label not in VALID_LABELS:
        raise ValueError("Model returned unsupported label")

    return ClassifyResponse(label=predicted_label, confidence=confidence)
