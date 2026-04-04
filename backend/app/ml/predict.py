"""
Inference module — loaded once at backend startup.
Exposes: predict(input_dict) -> PredictionResult
"""

import json
import logging
import numpy as np
import pandas as pd
import joblib
import shap
from pathlib import Path
from dataclasses import dataclass

logger = logging.getLogger(__name__)

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"

RISK_THRESHOLDS = {
    "Low":    (0.0,  0.30),
    "Medium": (0.30, 0.60),
    "High":   (0.60, 1.01),
}

SMOKING_MAP = {
    "never": "never", "no_info": "no_info", "current": "current",
    "former": "former", "ever": "ever", "not_current": "not_current",
}
GENDER_MAP = {"male": "male", "female": "female", "other": "other"}


@dataclass
class PredictionResult:
    probability:     float
    risk_level:      str
    prediction:      int
    model_name:      str
    top_factors:     list
    all_shap_values: dict
    model_metrics:   dict


class DiabetesPredictor:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._loaded = False
        return cls._instance

    def load(self):
        if self._loaded:
            return
        logger.info("Loading ML artifacts…")
        self.model          = joblib.load(ARTIFACTS_DIR / "best_model.pkl")
        self.scaler         = joblib.load(ARTIFACTS_DIR / "scaler.pkl")
        self.encoders       = joblib.load(ARTIFACTS_DIR / "encoders.pkl")

        shap_path = ARTIFACTS_DIR / "shap_explainer.pkl"
        self.shap_explainer = joblib.load(shap_path) if shap_path.exists() else None

        with open(ARTIFACTS_DIR / "metadata.json") as f:
            self.metadata = json.load(f)

        self.feature_order  = self.metadata["feature_order"]
        self.display_names  = self.metadata.get("feature_display_names", {})
        self.model_name     = self.metadata["best_model_name"]
        self.best_metrics   = self.metadata["best_metrics"]
        self._loaded = True
        logger.info(f"✅ Model loaded: {self.model_name}  features={self.feature_order}")

    def _build_features(self, inp: dict) -> np.ndarray:
        """Build and return a 2D numpy array in exact training feature order."""
        row = {}

        # Encode categoricals using saved LabelEncoders
        gender  = GENDER_MAP.get(inp["gender"].lower(), "other")
        smoking = SMOKING_MAP.get(inp["smoking_history"].lower().replace(" ", "_"), "no_info")

        for col, val in [("gender", gender), ("smoking_history", smoking)]:
            le = self.encoders[col]
            if val not in le.classes_:
                val = le.classes_[0]
            row[col] = int(le.transform([val])[0])

        row["age"]                 = float(inp["age"])
        row["bmi"]                 = float(inp["bmi"])
        row["HbA1c_level"]         = float(inp["HbA1c_level"])
        row["blood_glucose_level"] = float(inp["blood_glucose_level"])
        row["hypertension"]        = float(inp["hypertension"])
        row["heart_disease"]       = float(inp["heart_disease"])

        # Derived features — must match train.py exactly
        row["bmi_age_interaction"] = row["bmi"] * row["age"] / 100
        row["glucose_hba1c_ratio"] = row["blood_glucose_level"] / (row["HbA1c_level"] + 1e-5)

        # Assemble in training order as numpy array
        vec = np.array([[row[f] for f in self.feature_order]], dtype=float)

        logger.info(f"[DEBUG] Raw feature vector: {dict(zip(self.feature_order, vec[0]))}")
        return vec

    def predict(self, inp: dict) -> PredictionResult:
        if not self._loaded:
            self.load()

        X = self._build_features(inp)

        # Always scale (scaler is fitted on full feature set)
        X_scaled = self.scaler.transform(X)

        logger.info(f"[DEBUG] Scaled vector[:5]: {X_scaled[0][:5]}")

        prob       = float(self.model.predict_proba(X_scaled)[0][1])
        prediction = int(prob >= 0.5)

        logger.info(f"[DEBUG] Raw probability: {prob:.6f} ({prob*100:.2f}%)")

        risk_level = "Low"
        for level, (lo, hi) in RISK_THRESHOLDS.items():
            if lo <= prob < hi:
                risk_level = level
                break

        # SHAP
        top_factors    = []
        shap_values_arr = {}
        if self.shap_explainer is not None:
            try:
                sv = self.shap_explainer.shap_values(X_scaled)
                if isinstance(sv, list):
                    sv = sv[1]
                if sv.ndim > 1:
                    sv = sv[0]
                shap_values_arr = {self.feature_order[i]: float(sv[i]) for i in range(len(self.feature_order))}
                sorted_factors  = sorted(shap_values_arr.items(), key=lambda x: abs(x[1]), reverse=True)
                top_factors = [
                    {
                        "feature":      k,
                        "display_name": self.display_names.get(k, k),
                        "shap_value":   round(v, 4),
                        "direction":    "increases" if v > 0 else "decreases",
                    }
                    for k, v in sorted_factors[:5]
                ]
            except Exception as e:
                logger.warning(f"SHAP inference failed: {e}")

        return PredictionResult(
            probability=round(prob * 100, 2),
            risk_level=risk_level,
            prediction=prediction,
            model_name=self.model_name,
            top_factors=top_factors,
            all_shap_values={k: round(v, 4) for k, v in shap_values_arr.items()},
            model_metrics=self.best_metrics,
        )

    def model_info(self) -> dict:
        if not self._loaded:
            self.load()
        return {
            "best_model_name":   self.model_name,
            "best_metrics":      self.best_metrics,
            "all_model_metrics": self.metadata.get("all_model_metrics", {}),
            "feature_importance": self.metadata.get("shap_feature_importance", {}),
            "feature_order":     self.feature_order,
            "trained_at":        self.metadata.get("trained_at"),
        }


# Singleton
predictor = DiabetesPredictor()
