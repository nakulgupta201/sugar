"""
GET /api/model-info           — Model metadata + SHAP importance
GET /api/metrics              — Best-model evaluation metrics (metrics.json)
GET /api/debug/model          — Live model load debug info
GET /api/graphs/roc           — ROC curve PNG
GET /api/graphs/confusion     — Confusion matrix PNG
GET /api/graphs/feature       — Feature importance PNG  (also /api/graphs/feature-importance)
GET /api/graphs/shap          — SHAP summary PNG
GET /api/metrics/roc          — ROC curve PNG  (alias)
GET /api/metrics/confusion    — Confusion matrix PNG  (alias)
GET /api/metrics/feature-importance — Feature importance PNG  (alias)
GET /api/metrics/shap         — SHAP PNG  (alias)
"""

import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(tags=["Model"])

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent.parent / "app" / "ml" / "artifacts"
PLOTS_DIR     = ARTIFACTS_DIR / "plots"


# ── helpers ─────────────────────────────────────────────────────────────────
def _png(filename: str) -> FileResponse:
    path = PLOTS_DIR / filename
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"{filename} not found — run training first: docker exec <backend> python ml/train.py"
        )
    return FileResponse(path=path, media_type="image/png", headers={"Cache-Control": "no-cache"})


# ── model info ───────────────────────────────────────────────────────────────
@router.get("/model-info", summary="Model metadata and feature importance")
async def model_info():
    try:
        from app.ml.predict import predictor
        if not predictor._loaded:
            predictor.load()
        return predictor.model_info()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Model not available: {e}")


# ── debug ────────────────────────────────────────────────────────────────────
@router.get("/debug/model", summary="Model load status and expected features")
async def debug_model():
    try:
        from app.ml.predict import predictor
        if not predictor._loaded:
            predictor.load()
        return {
            "model_loaded":      True,
            "model_type":        type(predictor.model).__name__,
            "model_name":        predictor.model_name,
            "features_expected": predictor.feature_order,
            "feature_count":     len(predictor.feature_order),
            "trained_at":        predictor.metadata.get("trained_at"),
            "best_roc_auc":      predictor.best_metrics.get("roc_auc"),
        }
    except Exception as e:
        return {"model_loaded": False, "error": str(e)}


# ── metrics JSON ────────────────────────────────────────────────────────────
@router.get("/metrics", summary="Best-model evaluation metrics")
async def get_metrics():
    path = ARTIFACTS_DIR / "metrics.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="metrics.json missing — run train.py")
    with open(path) as f:
        return json.load(f)


# ── graph images (primary routes) ───────────────────────────────────────────
@router.get("/graphs/roc",            summary="ROC curve image")
async def graph_roc():           return _png("roc_curve.png")

@router.get("/graphs/confusion",      summary="Confusion matrix image")
async def graph_confusion():     return _png("confusion_matrix.png")

@router.get("/graphs/feature",        summary="Feature importance image")
@router.get("/graphs/feature-importance", summary="Feature importance image (alias)")
async def graph_feature():       return _png("feature_importance.png")

@router.get("/graphs/shap",           summary="SHAP summary image")
async def graph_shap():          return _png("shap_summary.png")


# ── graph images (alias routes matching the task spec) ───────────────────────
@router.get("/metrics/roc",                 summary="ROC curve (alias)")
async def metrics_roc():               return _png("roc_curve.png")

@router.get("/metrics/confusion",           summary="Confusion matrix (alias)")
async def metrics_confusion():         return _png("confusion_matrix.png")

@router.get("/metrics/feature-importance",  summary="Feature importance (alias)")
async def metrics_feature():           return _png("feature_importance.png")

@router.get("/metrics/shap",                summary="SHAP summary (alias)")
async def metrics_shap():              return _png("shap_summary.png")
