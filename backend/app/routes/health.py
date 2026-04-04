"""
GET /api/health — Health check
"""

import sys
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel

ML_DIR = Path(__file__).parent.parent.parent.parent.parent / "ml"
sys.path.insert(0, str(ML_DIR))

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str


@router.get("/health", response_model=HealthResponse, summary="API health check")
async def health():
    try:
        from app.ml.predict import predictor
        model_loaded = predictor._loaded
    except Exception:
        model_loaded = False

    return HealthResponse(status="ok", model_loaded=model_loaded, version="1.0.0")
