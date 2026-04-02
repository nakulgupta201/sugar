"""
Pytest test suite for DiabetesAI backend.
Uses SQLite in-memory DB and mocked ML predictor.
Run: pytest backend/tests/ -v
"""
import sys
import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# Point to backend dir
sys.path.insert(0, str(Path(__file__).parent.parent))

# Override DB to SQLite in-memory
import os
os.environ["DATABASE_URL"] = "sqlite:///./test_diabetes.db"
os.environ["SECRET_KEY"] = "test-secret-key-32-chars-minimum!!"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"


@pytest.fixture(scope="module")
def client():
    """Test client with mocked ML predictor."""
    # Mock the ML predictor so tests don't need model artifacts
    mock_result = MagicMock()
    mock_result.probability = 23.5
    mock_result.risk_level = "Low"
    mock_result.prediction = 0
    mock_result.model_name = "LightGBM"
    mock_result.top_factors = [
        {"feature": "HbA1c_level", "display_name": "HbA1c Level",
         "shap_value": -0.12, "direction": "decreases"}
    ]
    mock_result.all_shap_values = {"HbA1c_level": -0.12}
    mock_result.model_metrics = {
        "accuracy": 0.97, "precision": 0.85,
        "recall": 0.81, "f1": 0.83, "roc_auc": 0.98
    }

    with patch("predict.predictor") as mock_predictor:
        mock_predictor._loaded = True
        mock_predictor.predict.return_value = mock_result
        mock_predictor.load.return_value = None

        from main import app
        from app.core.database import init_db
        init_db()

        yield TestClient(app)

    # Cleanup SQLite test DB
    test_db = Path("test_diabetes.db")
    if test_db.exists():
        test_db.unlink()


VALID_PAYLOAD = {
    "gender": "male",
    "age": 45,
    "hypertension": 0,
    "heart_disease": 0,
    "smoking_history": "never",
    "bmi": 27.5,
    "HbA1c_level": 5.8,
    "blood_glucose_level": 140,
    "send_email": False,
}


# ── Health Check ────────────────────────────────────────────────────────────
def test_health_check(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "model_loaded" in data


# ── Prediction Enqueue ───────────────────────────────────────────────────────
def test_predict_enqueue(client):
    r = client.post("/api/predict", json=VALID_PAYLOAD)
    assert r.status_code in (202, 200), r.text
    data = r.json()
    assert "job_id" in data
    return data["job_id"]


def test_predict_poll(client):
    # First enqueue
    r1 = client.post("/api/predict", json=VALID_PAYLOAD)
    assert r1.status_code in (202, 200)
    job_id = r1.json()["job_id"]

    # Then poll
    r2 = client.get(f"/api/predict/{job_id}")
    assert r2.status_code == 200
    data = r2.json()
    assert data["job_id"] == job_id
    assert data["status"] in ("pending", "processing", "completed", "failed")


def test_predict_404_for_unknown_job(client):
    r = client.get("/api/predict/nonexistent-job-id")
    assert r.status_code == 404


# ── Validation ───────────────────────────────────────────────────────────────
def test_predict_invalid_gender(client):
    payload = {**VALID_PAYLOAD, "gender": "alien"}
    r = client.post("/api/predict", json=payload)
    assert r.status_code == 422


def test_predict_age_out_of_range(client):
    payload = {**VALID_PAYLOAD, "age": 200}
    r = client.post("/api/predict", json=payload)
    assert r.status_code == 422


def test_predict_bmi_out_of_range(client):
    payload = {**VALID_PAYLOAD, "bmi": 5.0}
    r = client.post("/api/predict", json=payload)
    assert r.status_code == 422


def test_predict_email_required_when_send_email_true(client):
    payload = {**VALID_PAYLOAD, "send_email": True, "email": None}
    r = client.post("/api/predict", json=payload)
    assert r.status_code == 422


# ── Auth ─────────────────────────────────────────────────────────────────────
def test_register_and_login(client):
    # Register
    r_reg = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "StrongPass123!"
    })
    assert r_reg.status_code == 201
    token = r_reg.json()["access_token"]
    assert token

    # Get profile
    r_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r_me.status_code == 200
    assert r_me.json()["email"] == "test@example.com"


def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "Pass123!"}
    client.post("/api/auth/register", json=payload)
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 409


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={
        "email": "user2@example.com", "password": "correct"
    })
    r = client.post("/api/auth/token", data={
        "username": "user2@example.com", "password": "wrong"
    })
    assert r.status_code == 401


def test_history_requires_auth(client):
    r = client.get("/api/history")
    assert r.status_code == 401
