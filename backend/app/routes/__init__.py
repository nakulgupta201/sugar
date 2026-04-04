from app.routes.predict import router as predict_router
from app.routes.health  import router as health_router
from app.routes.model   import router as model_router

__all__ = ["predict_router", "health_router", "model_router"]
