from pydantic import BaseModel, field_validator

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

class PredictTaskRiskRequest(BaseModel):
    task_id: str
    due_in_days: float | None = None
    recent_activity_count: int = 0
    task_frequency: float | None = None
    project_historical_risk_rate: float | None = None

class PredictTaskRiskResponse(BaseModel):
    risk: str
    probability: float
    top_factors: list[str]
    source: str
    generated_at: str
