from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from schemas import ClassifyRequest, ClassifyResponse, PredictTaskRiskRequest, PredictTaskRiskResponse
from config import (VALID_LABELS, ML_RISK_MODEL_ENABLED, ML_RISK_FALLBACK_ENABLED)
import ml_engine
from ml_engine import load_models, clean_text, _model_predict_task_risk, _fallback_predict_task_risk
import os
from dotenv import load_dotenv
import subprocess
from fastapi import status

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        load_models()
    except Exception as e:
        raise RuntimeError(f"Failed to load models: {str(e)}")
    yield

load_dotenv()

app = FastAPI(title="Taskora ML Service", lifespan=lifespan)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "message is required and cannot be empty",
            "errors": exc.errors(),
        },
    )

@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "models": {
            "classifier_loaded": ml_engine.classifier is not None,
            "vectorizer_loaded": ml_engine.vectorizer is not None,
            "risk_model_enabled": ML_RISK_MODEL_ENABLED,
            "risk_model_loaded": ml_engine.risk_model is not None,
            "risk_fallback_enabled": ML_RISK_FALLBACK_ENABLED,
        },
    }


@app.post("/classify", response_model=ClassifyResponse)
def classify(payload: ClassifyRequest) -> ClassifyResponse:
    normalized_message = clean_text(payload.message)

    if not normalized_message:
        raise HTTPException(status_code=422, detail="message is required and cannot be empty")

    transformed_text = ml_engine.vectorizer.transform([normalized_message])
    print(f"Transformed text shape: {transformed_text.shape}")
    probabilities = ml_engine.classifier.predict_proba(transformed_text)[0]
    print(f"Predicted probabilities: {probabilities}")

    predicted_index = int(probabilities.argmax())
    predicted_label = str(ml_engine.classifier.classes_[predicted_index])
    confidence = float(probabilities[predicted_index])

    if predicted_label not in VALID_LABELS:
        raise ValueError("Model returned unsupported label")

    return ClassifyResponse(label=predicted_label, confidence=confidence)


@app.post("/predict-task-risk", response_model=PredictTaskRiskResponse)
def predict_task_risk(payload: PredictTaskRiskRequest) -> PredictTaskRiskResponse:
    if ML_RISK_MODEL_ENABLED and ml_engine.risk_model is not None:
        try:
            return _model_predict_task_risk(payload)
        except Exception:
            if not ML_RISK_FALLBACK_ENABLED:
                raise HTTPException(
                    status_code=503,
                    detail="Risk model inference failed and fallback is disabled",
                )

    return _fallback_predict_task_risk(payload)


@app.post("/retrain-risk-model")
def retrain_risk_model() -> dict:
    """Trigger an end-to-end retrain of the risk model.

    This runs the training script found at `training/train_risk_model.py`, captures
    stdout/stderr and reloads the models into memory on success. For safety this
    endpoint is gatekept by the `ML_ALLOW_RETRAIN` env var which must be set to
    the string "true" to allow retraining.
    """
    allow = os.environ.get("ML_ALLOW_RETRAIN", "false").lower() == "true"
    if not allow:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Retrain disabled")

    script_path = os.path.join(os.path.dirname(__file__), "training", "train_risk_model.py")
    if not os.path.exists(script_path):
        raise HTTPException(status_code=500, detail="Training script not found")

    try:
        proc = subprocess.run(
            ["python", script_path],
            capture_output=True,
            text=True,
            check=False,
            cwd=os.path.dirname(__file__),
        )

        result = {
            "returncode": proc.returncode,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
        }

        if proc.returncode != 0:
            raise HTTPException(status_code=500, detail={"message": "Training failed", "result": result})

        # Reload models after successful training
        try:
            load_models()
        except Exception as e:
            raise HTTPException(status_code=500, detail={"message": "Failed to reload models", "error": str(e), "train_result": result})

        return {"status": "ok", "train_result": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
