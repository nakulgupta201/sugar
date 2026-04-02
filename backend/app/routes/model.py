"""
GET /api/model-info — Model details and feature importance
"""

import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException

ML_DIR = Path(__file__).parent.parent.parent.parent.parent / "ml"
sys.path.insert(0, str(ML_DIR))

router = APIRouter(tags=["Model"])


@router.get("/model-info", summary="Get model metadata and feature importance")
async def model_info():
    try:
        from predict import predictor
        return predictor.model_info()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Model not available: {e}")
