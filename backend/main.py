"""
FastAPI Application Entry Point — Production-Grade
- Async lifespan: DB init + ML model preload
- Celery / Redis async task queue
- JWT authentication
- Rate limiting
- Full CORS
"""

import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add ml/ to path for direct imports
ML_DIR = Path("/app/ml") if Path("/app/ml").exists() else Path(__file__).resolve().parent.parent / "ml"
sys.path.insert(0, str(ML_DIR))

from app.routes import predict_router, health_router, model_router, auth_router
from app.middleware.logging import LoggingMiddleware
from app.middleware.rate_limit import limiter, rate_limit_handler
from app.core.database import init_db
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB tables + preload ML model. Shutdown: log."""
    logger.info("🚀 DiabetesAI API starting...")

    # Create DB tables (for dev; use Alembic migrations in production)
    try:
        init_db()
        logger.info("✅ Database tables initialised")
    except Exception as e:
        logger.error(f"❌ DB init failed: {e}")

    # Preload ML artifacts
    try:
        from predict import predictor
        predictor.load()
        logger.info("✅ ML model loaded successfully")
    except Exception as e:
        logger.error(f"❌ Failed to load ML model: {e}")
        logger.warning("Server starting without model — /predict will use fallback")

    yield
    logger.info("DiabetesAI API shutting down.")


app = FastAPI(
    title="DiabetesAI — Risk Prediction API",
    description=(
        "Production-grade REST API for diabetes risk prediction "
        "powered by calibrated ensemble ML with SHAP explainability, "
        "async Celery task queue, and JWT authentication."
    ),
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(LoggingMiddleware)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(health_router,  prefix="/api")
app.include_router(auth_router,    prefix="/api")
app.include_router(model_router,   prefix="/api")
app.include_router(predict_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
