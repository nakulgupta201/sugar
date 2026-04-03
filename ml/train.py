"""
Diabetes Risk Prediction - ML Training Pipeline
- Multi-model training: LR, DT, RF, XGBoost, LightGBM
- SHAP explainability
- Best model auto-selection via ROC-AUC
- Saves artifacts: model, scaler, encoders, metadata
"""

import os
import json
import time
import warnings
import logging
import joblib
import numpy as np
import pandas as pd
import shap
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from pathlib import Path
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.calibration import CalibratedClassifierCV
import optuna
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report, confusion_matrix
)
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# ─── Paths ─────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "diabetes_prediction_dataset.csv"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
PLOTS_DIR = BASE_DIR / "plots"
PLOTS_DIR.mkdir(parents=True, exist_ok=True)

# ─── Feature Config ─────────────────────────────────────────────────────────
CATEGORICAL_COLS = ["gender", "smoking_history"]
NUMERICAL_COLS   = ["age", "bmi", "HbA1c_level", "blood_glucose_level"]
BINARY_COLS      = ["hypertension", "heart_disease"]
TARGET_COL       = "diabetes"

FEATURE_ORDER = CATEGORICAL_COLS + NUMERICAL_COLS + BINARY_COLS
FEATURE_DISPLAY_NAMES = {
    "gender":             "Gender",
    "smoking_history":    "Smoking History",
    "age":                "Age",
    "bmi":                "BMI",
    "HbA1c_level":        "HbA1c Level",
    "blood_glucose_level":"Blood Glucose Level",
    "hypertension":       "Hypertension",
    "heart_disease":      "Heart Disease",
}

SMOKING_MAP = {
    "never": "never", "No Info": "no_info", "current": "current",
    "former": "former", "ever": "ever", "not current": "not_current"
}
GENDER_MAP = {"Male": "male", "Female": "female", "Other": "other"}


# ─── 1. Data Loading & Preprocessing ────────────────────────────────────────
def load_and_preprocess(path: Path):
    logger.info(f"Loading dataset from {path}")
    if not path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {path}.\n"
            "Please download 'diabetes_prediction_dataset.csv' from Kaggle:\n"
            "  https://www.kaggle.com/datasets/iammustafatz/diabetes-prediction-dataset\n"
            "and place it in ml/data/"
        )

    df = pd.read_csv(path)
    logger.info(f"Raw shape: {df.shape}, diabetes prevalence: {df[TARGET_COL].mean():.3f}")

    # Standardize categorical values
    df["gender"]          = df["gender"].map(GENDER_MAP).fillna("other")
    df["smoking_history"] = df["smoking_history"].map(SMOKING_MAP).fillna("no_info")

    # Drop duplicates
    df = df.drop_duplicates()

    # Handle missing values
    for col in NUMERICAL_COLS:
        if df[col].isnull().any():
            df[col].fillna(df[col].median(), inplace=True)

    logger.info(f"Cleaned shape: {df.shape}")
    return df


# ─── 2. Feature Engineering ──────────────────────────────────────────────────
def engineer_features(df: pd.DataFrame):
    encoders = {}

    # Label-encode categoricals
    for col in CATEGORICAL_COLS:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le

    # Derived features
    df["bmi_age_interaction"] = df["bmi"] * df["age"] / 100
    df["glucose_hba1c_ratio"] = df["blood_glucose_level"] / (df["HbA1c_level"] + 1e-5)

    feature_cols = FEATURE_ORDER + ["bmi_age_interaction", "glucose_hba1c_ratio"]
    X = df[feature_cols]
    y = df[TARGET_COL]

    logger.info(f"Features: {list(X.columns)}")
    return X, y, encoders, feature_cols


# ─── 3. Model Definitions & Tuning ─────────────────────────────────────────────
def optimize_lgbm(X_train, y_train):
    logger.info("Starting Optuna tuning for LightGBM...")
    def objective(trial):
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 100, 500),
            "max_depth": trial.suggest_int("max_depth", 3, 12),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
            "class_weight": "balanced",
            "random_state": 42,
            "n_jobs": -1,
            "verbose": -1
        }
        model = LGBMClassifier(**params)
        scores = cross_val_score(model, X_train, y_train, cv=3, scoring="roc_auc")
        return scores.mean()

    study = optuna.create_study(direction="maximize")
    optuna.logging.set_verbosity(optuna.logging.WARNING)
    study.optimize(objective, n_trials=10) # 10 trials for brevity, expand in prod
    logger.info(f"Best LGBM params: {study.best_params}")
    return LGBMClassifier(**study.best_params, class_weight="balanced", random_state=42, n_jobs=-1, verbose=-1)

def get_models(X_train_res, y_train_res):
    # Retrieve base models (tuned and default)
    lgbm_tuned = optimize_lgbm(X_train_res, y_train_res)
    
    base_models = {
        "Logistic Regression": LogisticRegression(
            max_iter=1000, class_weight="balanced", solver="lbfgs", C=0.5, random_state=42
        ),
        "Decision Tree": DecisionTreeClassifier(
            max_depth=10, class_weight="balanced", random_state=42
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=200, max_depth=12, class_weight="balanced",
            n_jobs=-1, random_state=42
        ),
        "XGBoost": XGBClassifier(
            n_estimators=300, max_depth=6, learning_rate=0.05,
            scale_pos_weight=10, use_label_encoder=False,
            eval_metric="logloss", random_state=42, n_jobs=-1
        ),
        "LightGBM": lgbm_tuned,
    }
    
    # Wrap in CalibratedClassifierCV
    calibrated_models = {}
    for name, model in base_models.items():
        calibrated_models[name] = CalibratedClassifierCV(model, method='isotonic', cv=3)
        
    return calibrated_models


# ─── 4. Training & Evaluation ────────────────────────────────────────────────
def train_and_evaluate(X_train, X_test, y_train, y_test, models, scaler):
    results = {}

    for name, model in models.items():
        logger.info(f"Training: {name}")
        start = time.time()

        # Scale for LR only
        if name == "Logistic Regression":
            Xtr = scaler.transform(X_train)
            Xte = scaler.transform(X_test)
        else:
            Xtr, Xte = X_train, X_test

        model.fit(Xtr, y_train)
        y_pred = model.predict(Xte)
        y_prob = model.predict_proba(Xte)[:, 1]

        metrics = {
            "accuracy":  accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred, zero_division=0),
            "recall":    recall_score(y_test, y_pred, zero_division=0),
            "f1":        f1_score(y_test, y_pred, zero_division=0),
            "roc_auc":   roc_auc_score(y_test, y_prob),
            "train_time": round(time.time() - start, 2),
        }
        results[name] = {"model": model, "metrics": metrics}
        logger.info(
            f"  {name}: AUC={metrics['roc_auc']:.4f} | "
            f"F1={metrics['f1']:.4f} | Acc={metrics['accuracy']:.4f}"
        )

    return results


# ─── 5. SHAP Explainability ──────────────────────────────────────────────────
def compute_shap(model, X_sample, feature_names, model_name, plots_dir):
    logger.info(f"Computing SHAP for {model_name}...")
    try:
        # Extract base estimator from CalibratedClassifierCV for SHAP
        base_model = getattr(model, "calibrated_classifiers_")[0].estimator
        
        if model_name in ["Random Forest", "XGBoost", "LightGBM", "Decision Tree"]:
            explainer = shap.TreeExplainer(base_model)
        else:
            explainer = shap.LinearExplainer(base_model, X_sample, feature_perturbation="interventional")

        shap_values = explainer.shap_values(X_sample)

        # For binary classification some models return list
        if isinstance(shap_values, list):
            shap_values = shap_values[1]

        mean_abs_shap = np.abs(shap_values).mean(axis=0)
        importance = dict(zip(feature_names, [float(v) for v in mean_abs_shap]))

        # Save beeswarm plot
        plt.figure(figsize=(10, 6))
        shap.summary_plot(shap_values, X_sample, feature_names=feature_names, show=False)
        plt.tight_layout()
        plt.savefig(plots_dir / f"shap_{model_name.replace(' ', '_').lower()}.png", dpi=120)
        plt.close()

        return importance, explainer

    except Exception as e:
        logger.warning(f"SHAP failed for {model_name}: {e}")
        return {}, None


# ─── 6. Save Artifacts ───────────────────────────────────────────────────────
def save_artifacts(best_name, best_model, scaler, encoders, feature_cols,
                   results, shap_importance, shap_explainer, artifacts_dir):
    joblib.dump(best_model,     artifacts_dir / "best_model.pkl")
    joblib.dump(scaler,         artifacts_dir / "scaler.pkl")
    joblib.dump(encoders,       artifacts_dir / "encoders.pkl")
    joblib.dump(shap_explainer, artifacts_dir / "shap_explainer.pkl")

    # Serialize metrics for all models
    all_metrics = {
        name: {k: v for k, v in info["metrics"].items()}
        for name, info in results.items()
    }

    metadata = {
        "best_model_name": best_name,
        "feature_order":   feature_cols,
        "feature_display_names": FEATURE_DISPLAY_NAMES,
        "categorical_cols": CATEGORICAL_COLS,
        "numerical_cols":   NUMERICAL_COLS,
        "binary_cols":      BINARY_COLS,
        "best_metrics":     results[best_name]["metrics"],
        "all_model_metrics": all_metrics,
        "shap_feature_importance": shap_importance,
        "trained_at": pd.Timestamp.now().isoformat(),
    }

    with open(artifacts_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Artifacts saved to {artifacts_dir}")


# ─── 7. Main ─────────────────────────────────────────────────────────────────
def main():
    logger.info("=" * 60)
    logger.info(" Diabetes Risk ML Pipeline — Starting")
    logger.info("=" * 60)

    # 1. Load & clean
    df = load_and_preprocess(DATA_PATH)

    # 2. Feature Engineering
    X, y, encoders, feature_cols = engineer_features(df)

    # 3. Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    logger.info(f"Train: {X_train.shape}, Test: {X_test.shape}")

    # 4. SMOTE oversampling
    logger.info("Applying SMOTE for class imbalance...")
    smote = SMOTE(random_state=42)
    X_train_res, y_train_res = smote.fit_resample(X_train, y_train)

    # 5. Scale (fit on resampled)
    scaler = StandardScaler()
    scaler.fit(X_train_res)

    # 6. Train all models (with Optuna tuning on LGBM inside)
    models = get_models(X_train_res, y_train_res)
    results = train_and_evaluate(X_train_res, X_test, y_train_res, y_test, models, scaler)

    # 7. Select best by ROC-AUC
    best_name = max(results, key=lambda n: results[n]["metrics"]["roc_auc"])
    best_model = results[best_name]["model"]
    logger.info(f"\nBest model: {best_name} (AUC={results[best_name]['metrics']['roc_auc']:.4f})")

    # 8. SHAP on best model
    X_sample = X_test.sample(min(500, len(X_test)), random_state=42)
    if best_name == "Logistic Regression":
        X_sample_scaled = pd.DataFrame(scaler.transform(X_sample), columns=feature_cols)
    else:
        X_sample_scaled = X_sample

    shap_importance, shap_explainer = compute_shap(
        best_model, X_sample_scaled, feature_cols, best_name, PLOTS_DIR
    )

    # 9. Save
    save_artifacts(
        best_name, best_model, scaler, encoders, feature_cols,
        results, shap_importance, shap_explainer, ARTIFACTS_DIR
    )

    # 10. Summary
    logger.info("\n" + "=" * 60)
    logger.info(" Model Performance Summary")
    logger.info("=" * 60)
    for name, info in sorted(results.items(), key=lambda x: x[1]["metrics"]["roc_auc"], reverse=True):
        m = info["metrics"]
        marker = " ← BEST" if name == best_name else ""
        logger.info(
            f"{name:25s} | AUC: {m['roc_auc']:.4f} | F1: {m['f1']:.4f} | "
            f"Acc: {m['accuracy']:.4f}{marker}"
        )

    return metadata if 'metadata' in dir() else {}


if __name__ == "__main__":
    main()
