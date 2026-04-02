"""
SQLAlchemy ORM Models for Users and Predictions.
Designed for PostgreSQL but falls back to SQLite for dev.
"""
import uuid
import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


def _uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    predictions = relationship("Prediction", back_populates="user", lazy="dynamic")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)

    # Lifecycle
    status = Column(String(20), default="pending", index=True, nullable=False)
    # pending | processing | completed | failed

    # Raw inputs — stored as JSON for drift analysis
    features_json = Column(JSON, nullable=False)

    # Results (populated by Celery worker on completion)
    probability = Column(Float, nullable=True)
    risk_level = Column(String(10), nullable=True)   # Low | Medium | High
    prediction = Column(Integer, nullable=True)       # 0 | 1
    model_name = Column(String(64), nullable=True)
    shap_json = Column(JSON, nullable=True)           # top_factors list

    # Optional email
    send_email = Column(Integer, default=0)           # 0 | 1
    email = Column(String(255), nullable=True)
    email_sent = Column(Integer, default=0)           # 0 | 1

    # Error capture
    error_message = Column(Text, nullable=True)

    # Audit
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="predictions")
