"""
Celery worker task: run_prediction
- Pulls job from Redis queue
- Runs ML inference (blocking, safely isolated in worker process)
- Updates PostgreSQL with result / error
- Sends email if requested
"""
import sys
import datetime
import logging
from pathlib import Path

from app.core.celery_app import celery
from app.core.database import SessionLocal
from app.models.prediction import Prediction

logger = logging.getLogger(__name__)


@celery.task(name="app.worker.run_prediction", bind=True, max_retries=2)
def run_prediction(self, prediction_id: str):
    """
    Execute diabetes risk inference for a given DB prediction row.
    Updates status: pending → processing → completed | failed
    """
    db = SessionLocal()
    try:
        # 1. Fetch row
        row = db.query(Prediction).filter(Prediction.id == prediction_id).first()
        if not row:
            logger.error(f"Prediction {prediction_id} not found in DB")
            return

        # 2. Mark processing
        row.status = "processing"
        db.commit()

        # 3. Load predictor (singleton; already warm on worker startup)
        from app.ml.predict import predictor
        if not predictor._loaded:
            predictor.load()

        # 4. Run inference
        features = row.features_json
        result = predictor.predict(features)

        # 5. Persist results
        row.probability = result.probability
        row.risk_level = result.risk_level
        row.prediction = result.prediction
        row.model_name = result.model_name
        row.shap_json = result.top_factors
        row.status = "completed"
        row.completed_at = datetime.datetime.utcnow()
        db.commit()

        # 6. Optional email & PDF GEN
        pdf_path = None
        try:
            from app.services.pdf_generator import generate_pdf_report
            pdf_path = generate_pdf_report(prediction_id, result)
        except Exception as e:
            logger.warning(f"PDF generation failed: {e}")

        if row.send_email and row.email:
            try:
                import asyncio
                from app.services.email_service import send_prediction_email
                asyncio.run(send_prediction_email(row.email, result, pdf_path=pdf_path))
                row.email_sent = 1
                db.commit()
            except Exception as e:
                logger.warning(f"Email failed for {prediction_id}: {e}")

        logger.info(f"Prediction {prediction_id} completed — {result.risk_level} ({result.probability:.1f}%)")

    except Exception as exc:
        logger.exception(f"Prediction {prediction_id} failed: {exc}")
        try:
            row = db.query(Prediction).filter(Prediction.id == prediction_id).first()
            if row:
                row.status = "failed"
                row.error_message = str(exc)
                row.completed_at = datetime.datetime.utcnow()
                db.commit()
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=5)
    finally:
        db.close()
