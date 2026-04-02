"""
Database session & engine configuration using SQLAlchemy 2.0 async-compatible style.
Supports PostgreSQL in production, SQLite for local dev/testing.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./diabetes_dev.db")

# SQLite: disable same-thread check; Postgres: connection pool
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency — yields a DB session and closes it after request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables (called at app startup for dev; use Alembic in prod)."""
    from app.models.prediction import User, Prediction  # noqa: F401
    Base.metadata.create_all(bind=engine)
