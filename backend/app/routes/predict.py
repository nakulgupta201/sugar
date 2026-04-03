"""
POST /api/predict     — Enqueue prediction job, return job_id (202)
GET  /api/predict/{id} — Poll for result (200 when completed)
GET  /api/history      — Fetch past predictions (authenticated or session)
"""
import uuid
import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_optional_user
from app.models.prediction import Prediction, User
from app.middleware.rate_limit import limiter

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Prediction"])


# ─── Request Schema ───────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    gender:              str   = Field(..., examples=["male"])
    age:                 float = Field(..., ge=1, le=120, examples=[45])
    hypertension:        int   = Field(..., ge=0, le=1, examples=[0])
    heart_disease:       int   = Field(..., ge=0, le=1, examples=[0])
    smoking_history:     str   = Field(..., examples=["never"])
    bmi:                 float = Field(..., ge=10.0, le=70.0, examples=[27.5])
    HbA1c_level:         float = Field(..., ge=3.5, le=15.0, examples=[5.8])
    blood_glucose_level: float = Field(..., ge=50.0, le=400.0, examples=[140])
    send_email:          bool  = Field(False)
    email:               Optional[str] = Field(None, examples=["user@example.com"])

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v):
        allowed = {"male", "female", "other"}
        if v.lower() not in allowed:
            raise ValueError(f"gender must be one of {allowed}")
        return v.lower()

    @field_validator("smoking_history")
    @classmethod
    def validate_smoking(cls, v):
        allowed = {"never", "former", "current", "ever", "not_current", "no_info"}
        v_norm = v.lower().replace(" ", "_")
        if v_norm not in allowed:
            raise ValueError(f"smoking_history must be one of {allowed}")
        return v_norm

    @model_validator(mode="after")
    def check_email_required(self):
        if self.send_email and not self.email:
            raise ValueError("email is required when send_email is True")
        return self


# ─── Response Schemas ──────────────────────────────────────────────────────────
class JobAccepted(BaseModel):
    job_id:  str
    status:  str = "pending"
    message: str = "Prediction queued. Poll /api/predict/{job_id} for results."


class FactorItem(BaseModel):
    feature:      str
    display_name: str
    shap_value:   float
    direction:    str


class PredictResult(BaseModel):
    job_id:          str
    status:          str
    probability:     Optional[float]    = None
    risk_level:      Optional[str]      = None
    prediction:      Optional[int]      = None
    model_name:      Optional[str]      = None
    top_factors:     Optional[List[FactorItem]] = None
    email_sent:      bool               = False
    error_message:   Optional[str]      = None
    created_at:      Optional[str]      = None
    completed_at:    Optional[str]      = None


class HistoryItem(BaseModel):
    job_id:       str
    status:       str
    probability:  Optional[float]
    risk_level:   Optional[str]
    created_at:   Optional[str]


# ─── Helpers ──────────────────────────────────────────────────────────────────
def _row_to_result(row: Prediction) -> PredictResult:
    factors = None
    if row.shap_json:
        try:
            factors = [FactorItem(**f) for f in row.shap_json]
        except Exception:
            factors = None

    return PredictResult(
        job_id=row.id,
        status=row.status,
        probability=row.probability,
        risk_level=row.risk_level,
        prediction=row.prediction,
        model_name=row.model_name,
        top_factors=factors,
        email_sent=bool(row.email_sent),
        error_message=row.error_message,
        created_at=row.created_at.isoformat() if row.created_at else None,
        completed_at=row.completed_at.isoformat() if row.completed_at else None,
    )


# ─── POST /predict ─────────────────────────────────────────────────────────────
@router.post("/predict", response_model=JobAccepted, status_code=202,
             summary="Enqueue a diabetes risk prediction")
@limiter.limit("30/minute")
async def enqueue_prediction(
    request: Request,
    body: PredictRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Accepts patient health data, stores a pending Prediction row,
    dispatches it to the Celery worker queue, and immediately returns
    a job_id. The client should poll GET /api/predict/{job_id}.
    """
    features = body.model_dump(exclude={"send_email", "email"})

    row = Prediction(
        id=str(uuid.uuid4()),
        user_id=current_user.id if current_user else None,
        status="pending",
        features_json=features,
        send_email=int(body.send_email),
        email=body.email if body.send_email else None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    # Dispatch to Celery — non-blocking
    try:
        from app.worker import run_prediction
        run_prediction.delay(row.id)
    except Exception as e:
        # If Celery/Redis unavailable, fall back to synchronous inference
        logger.warning(f"Celery unavailable ({e}), running synchronous inference")
        await _run_sync_fallback(row, features, body, db)

    return JobAccepted(job_id=row.id)


async def _run_sync_fallback(row: Prediction, features: dict, body: PredictRequest, db: Session):
    """Synchronous fallback when Celery is not available."""
    import sys
    from pathlib import Path
    ML_DIR = Path(__file__).parent.parent.parent.parent / "ml"
    sys.path.insert(0, str(ML_DIR))
    import datetime

    try:
        from predict import predictor
        if not predictor._loaded:
            predictor.load()

        result = predictor.predict(features)
        row.probability = result.probability
        row.risk_level = result.risk_level
        row.prediction = result.prediction
        row.model_name = result.model_name
        row.shap_json = result.top_factors
        row.status = "completed"
        row.completed_at = datetime.datetime.utcnow()

        if body.send_email and body.email:
            try:
                from app.services.email_service import send_prediction_email
                await send_prediction_email(body.email, result)
                row.email_sent = 1
            except Exception as e:
                logger.warning(f"Email send failed: {e}")

    except Exception as exc:
        row.status = "failed"
        row.error_message = str(exc)
        row.completed_at = datetime.datetime.utcnow()

    db.commit()


# ─── GET /predict/{job_id} ────────────────────────────────────────────────────
@router.get("/predict/{job_id}", response_model=PredictResult,
            summary="Poll for prediction result")
async def get_prediction(
    job_id: str,
    db: Session = Depends(get_db),
):
    row = db.query(Prediction).filter(Prediction.id == job_id).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    return _row_to_result(row)


# ─── GET /history ─────────────────────────────────────────────────────────────
@router.get("/history", response_model=List[HistoryItem],
            summary="Fetch authenticated user's prediction history")
async def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user),
    limit: int = 20,
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Login required to view history")

    rows = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        HistoryItem(
            job_id=r.id,
            status=r.status,
            probability=r.probability,
            risk_level=r.risk_level,
            created_at=r.created_at.isoformat() if r.created_at else None,
        )
        for r in rows
    ]
