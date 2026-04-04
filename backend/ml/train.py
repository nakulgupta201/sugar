"""
Diabetes Risk Prediction - ML Training Pipeline
Trains without CalibratedClassifierCV wrapper (fixes 0% probability bug).
Saves: best_model.pkl, scaler.pkl, encoders.pkl, shap_explainer.pkl, metadata.json, metrics.json
Plots: roc_curve.png, confusion_matrix.png, feature_importance.png, shap_summary.png
"""

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
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, classification_report, confusion_matrix, roc_curve
)
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
import optuna

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR      = Path(__file__).parent
DATA_PATH     = BASE_DIR / "data" / "diabetes_prediction_dataset.csv"
ARTIFACTS_DIR = BASE_DIR.parent / "app" / "ml" / "artifacts"
PLOTS_DIR     = ARTIFACTS_DIR / "plots"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
PLOTS_DIR.mkdir(parents=True, exist_ok=True)

CATEGORICAL_COLS = ["gender", "smoking_history"]
NUMERICAL_COLS   = ["age", "bmi", "HbA1c_level", "blood_glucose_level"]
BINARY_COLS      = ["hypertension", "heart_disease"]
TARGET_COL       = "diabetes"
FEATURE_ORDER    = CATEGORICAL_COLS + NUMERICAL_COLS + BINARY_COLS

FEATURE_DISPLAY_NAMES = {
    "gender": "Gender", "smoking_history": "Smoking History",
    "age": "Age", "bmi": "BMI", "HbA1c_level": "HbA1c Level",
    "blood_glucose_level": "Blood Glucose Level",
    "hypertension": "Hypertension", "heart_disease": "Heart Disease",
    "bmi_age_interaction": "BMI × Age", "glucose_hba1c_ratio": "Glucose/HbA1c Ratio",
}

SMOKING_MAP = {"never": "never", "No Info": "no_info", "current": "current",
               "former": "former", "ever": "ever", "not current": "not_current"}
GENDER_MAP  = {"Male": "male", "Female": "female", "Other": "other"}


def load_and_preprocess():
    logger.info(f"Loading dataset: {DATA_PATH}")
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset missing: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    logger.info(f"Raw: {df.shape}  prevalence={df[TARGET_COL].mean():.3f}")
    df["gender"]          = df["gender"].map(GENDER_MAP).fillna("other")
    df["smoking_history"] = df["smoking_history"].map(SMOKING_MAP).fillna("no_info")
    df = df.drop_duplicates()
    for col in NUMERICAL_COLS:
        df[col].fillna(df[col].median(), inplace=True)
    logger.info(f"Clean: {df.shape}")
    return df


def engineer_features(df):
    encoders = {}
    for col in CATEGORICAL_COLS:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le

    df["bmi_age_interaction"] = df["bmi"] * df["age"] / 100
    df["glucose_hba1c_ratio"] = df["blood_glucose_level"] / (df["HbA1c_level"] + 1e-5)

    feature_cols = FEATURE_ORDER + ["bmi_age_interaction", "glucose_hba1c_ratio"]
    X = df[feature_cols].values.astype(float)   # numpy array — no feature-name issues
    y = df[TARGET_COL].values
    logger.info(f"Features ({len(feature_cols)}): {feature_cols}")
    return X, y, encoders, feature_cols


def get_models():
    return {
        "Logistic Regression": LogisticRegression(
            max_iter=2000, class_weight="balanced", solver="lbfgs", C=1.0, random_state=42
        ),
        "Decision Tree": DecisionTreeClassifier(
            max_depth=10, class_weight="balanced", random_state=42
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=200, max_depth=12, class_weight="balanced", n_jobs=-1, random_state=42
        ),
        "XGBoost": XGBClassifier(
            n_estimators=300, max_depth=6, learning_rate=0.05, scale_pos_weight=10,
            eval_metric="logloss", random_state=42, n_jobs=-1
        ),
        "LightGBM": LGBMClassifier(
            n_estimators=300, max_depth=8, learning_rate=0.05,
            class_weight="balanced", random_state=42, n_jobs=-1, verbose=-1
        ),
    }


def train_evaluate(X_train, X_test, y_train, y_test, scaler, feature_cols):
    models  = get_models()
    results = {}

    for name, model in models.items():
        logger.info(f"Training: {name}")
        start = time.time()

        # Always use scaled numpy arrays
        Xtr = scaler.transform(X_train)
        Xte = scaler.transform(X_test)

        model.fit(Xtr, y_train)
        y_pred = model.predict(Xte)
        y_prob = model.predict_proba(Xte)[:, 1]

        cv = cross_val_score(model, scaler.transform(X_train), y_train, cv=5, scoring="roc_auc")

        t0 = time.time()
        for _ in range(100):
            model.predict_proba(Xte[:1])
        lat = (time.time() - t0) / 100 * 1000

        m = {
            "accuracy":   float(accuracy_score(y_test, y_pred)),
            "precision":  float(precision_score(y_test, y_pred, zero_division=0)),
            "recall":     float(recall_score(y_test, y_pred, zero_division=0)),
            "f1":         float(f1_score(y_test, y_pred, zero_division=0)),
            "roc_auc":    float(roc_auc_score(y_test, y_prob)),
            "cv_mean":    float(cv.mean()),
            "cv_std":     float(cv.std()),
            "latency_ms": round(lat, 3),
            "train_time": round(time.time() - start, 2),
        }

        cm = confusion_matrix(y_test, y_pred)
        cr = classification_report(y_test, y_pred)
        logger.info(f"  {name}: AUC={m['roc_auc']:.4f} F1={m['f1']:.4f} Acc={m['accuracy']:.4f} CV={m['cv_mean']:.4f}±{m['cv_std']:.4f} Lat={m['latency_ms']:.2f}ms")
        logger.info(f"  CM:\n{cm}")
        logger.info(f"  Report:\n{cr}")

        results[name] = {
            "model": model, "metrics": m,
            "y_prob": y_prob, "y_pred": y_pred, "cm": cm,
        }

    return results


def generate_graphs(results, best_name, feature_cols, y_test):
    sns.set_theme(style="darkgrid")
    colors = ["#6366f1","#ec4899","#14b8a6","#f59e0b","#10b981"]

    # ROC Curve
    fig, ax = plt.subplots(figsize=(9, 7))
    for i, (name, info) in enumerate(results.items()):
        fpr, tpr, _ = roc_curve(y_test, info["y_prob"])
        ax.plot(fpr, tpr, lw=2.5, color=colors[i % len(colors)],
                label=f"{name} (AUC={info['metrics']['roc_auc']:.4f})")
    ax.plot([0,1],[0,1],"k--",lw=1,alpha=0.5)
    ax.set_xlabel("False Positive Rate", fontsize=13)
    ax.set_ylabel("True Positive Rate", fontsize=13)
    ax.set_title("ROC Curves — All Models", fontsize=15, fontweight="bold")
    ax.legend(loc="lower right", fontsize=10)
    fig.tight_layout()
    fig.savefig(PLOTS_DIR / "roc_curve.png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved roc_curve.png")

    # Confusion Matrix
    cm = results[best_name]["cm"]
    fig, ax = plt.subplots(figsize=(7, 6))
    sns.heatmap(cm, annot=True, fmt="d", cmap="YlOrRd",
                xticklabels=["No Diabetes","Diabetes"],
                yticklabels=["No Diabetes","Diabetes"],
                linewidths=1, linecolor="white", ax=ax, annot_kws={"size":16})
    ax.set_xlabel("Predicted", fontsize=13)
    ax.set_ylabel("Actual", fontsize=13)
    ax.set_title(f"Confusion Matrix — {best_name}", fontsize=14, fontweight="bold")
    fig.tight_layout()
    fig.savefig(PLOTS_DIR / "confusion_matrix.png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved confusion_matrix.png")

    # Feature Importance
    best_model = results[best_name]["model"]
    if hasattr(best_model, "feature_importances_"):
        importances = best_model.feature_importances_
    elif hasattr(best_model, "coef_"):
        importances = np.abs(best_model.coef_[0])
    else:
        importances = np.ones(len(feature_cols))

    dn = [FEATURE_DISPLAY_NAMES.get(f, f) for f in feature_cols]
    idx = np.argsort(importances)
    fig, ax = plt.subplots(figsize=(10, 7))
    bars = ax.barh([dn[i] for i in idx], importances[idx],
                   color=plt.cm.viridis(np.linspace(0.3, 0.9, len(feature_cols))))
    ax.set_xlabel("Importance", fontsize=13)
    ax.set_title(f"Feature Importance — {best_name}", fontsize=14, fontweight="bold")
    ax.bar_label(bars, fmt="%.4f", padding=3, fontsize=9)
    fig.tight_layout()
    fig.savefig(PLOTS_DIR / "feature_importance.png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved feature_importance.png")


def compute_shap(model, X_scaled_sample, feature_cols, model_name):
    logger.info(f"Computing SHAP for {model_name}...")
    try:
        if model_name in ["Random Forest","XGBoost","LightGBM","Decision Tree"]:
            explainer = shap.TreeExplainer(model)
        else:
            explainer = shap.LinearExplainer(model, X_scaled_sample,
                                              feature_perturbation="interventional")

        sv = explainer.shap_values(X_scaled_sample)
        if isinstance(sv, list):
            sv = sv[1]

        mean_abs = np.abs(sv).mean(axis=0)
        importance = dict(zip(feature_cols, [float(v) for v in mean_abs]))

        fig, ax = plt.subplots(figsize=(10, 7))
        shap.summary_plot(sv, X_scaled_sample, feature_names=feature_cols, show=False, plot_size=None)
        plt.title(f"SHAP Summary — {model_name}", fontsize=13, fontweight="bold")
        plt.tight_layout()
        plt.savefig(PLOTS_DIR / "shap_summary.png", dpi=150, bbox_inches="tight")
        plt.close()
        logger.info("Saved shap_summary.png")

        return importance, explainer

    except Exception as e:
        logger.warning(f"SHAP failed: {e}")
        return {}, None


def main():
    logger.info("=" * 60)
    logger.info(" DiabetesAI ML Pipeline — Starting")
    logger.info("=" * 60)

    df = load_and_preprocess()
    X, y, encoders, feature_cols = engineer_features(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    logger.info(f"Train: {X_train.shape}  Test: {X_test.shape}")

    logger.info("Applying SMOTE...")
    smote = SMOTE(random_state=42)
    X_train_res, y_train_res = smote.fit_resample(X_train, y_train)

    # Scaler fitted on resampled training data
    scaler = StandardScaler()
    scaler.fit(X_train_res)

    results = train_evaluate(X_train_res, X_test, y_train_res, y_test, scaler, feature_cols)

    best_name  = max(results, key=lambda n: results[n]["metrics"]["roc_auc"])
    best_model = results[best_name]["model"]
    logger.info(f"\n✅ Best: {best_name} AUC={results[best_name]['metrics']['roc_auc']:.4f}")

    generate_graphs(results, best_name, feature_cols, y_test)

    # SHAP on scaled test sample
    X_test_scaled = scaler.transform(X_test)
    idx_sample    = np.random.RandomState(42).choice(len(X_test_scaled), min(500, len(X_test_scaled)), replace=False)
    X_shap_sample = X_test_scaled[idx_sample]

    shap_importance, shap_explainer = compute_shap(best_model, X_shap_sample, feature_cols, best_name)

    # Save artifacts
    joblib.dump(best_model, ARTIFACTS_DIR / "best_model.pkl")
    joblib.dump(scaler,     ARTIFACTS_DIR / "scaler.pkl")
    joblib.dump(encoders,   ARTIFACTS_DIR / "encoders.pkl")
    if shap_explainer is not None:
        joblib.dump(shap_explainer, ARTIFACTS_DIR / "shap_explainer.pkl")

    all_metrics  = {n: info["metrics"] for n, info in results.items()}
    best_metrics = results[best_name]["metrics"]

    metadata = {
        "best_model_name":       best_name,
        "feature_order":         feature_cols,
        "feature_display_names": FEATURE_DISPLAY_NAMES,
        "categorical_cols":      CATEGORICAL_COLS,
        "numerical_cols":        NUMERICAL_COLS,
        "binary_cols":           BINARY_COLS,
        "best_metrics":          best_metrics,
        "all_model_metrics":     all_metrics,
        "shap_feature_importance": shap_importance,
        "trained_at":            pd.Timestamp.now().isoformat(),
    }
    with open(ARTIFACTS_DIR / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    metrics_out = {
        "best_model": best_name,
        "accuracy":   best_metrics["accuracy"],
        "roc_auc":    best_metrics["roc_auc"],
        "precision":  best_metrics["precision"],
        "recall":     best_metrics["recall"],
        "f1":         best_metrics["f1"],
        "cv_mean":    best_metrics["cv_mean"],
        "cv_std":     best_metrics["cv_std"],
        "latency_ms": best_metrics["latency_ms"],
        "all_models": all_metrics,
        "trained_at": metadata["trained_at"],
    }
    with open(ARTIFACTS_DIR / "metrics.json", "w") as f:
        json.dump(metrics_out, f, indent=2)

    logger.info(f"All artifacts saved → {ARTIFACTS_DIR}")
    logger.info("\n" + "=" * 60)
    logger.info(" Model Performance Summary")
    logger.info("=" * 60)
    for n, info in sorted(results.items(), key=lambda x: x[1]["metrics"]["roc_auc"], reverse=True):
        m      = info["metrics"]
        marker = " ← BEST" if n == best_name else ""
        logger.info(f"  {n:25s} AUC={m['roc_auc']:.4f} F1={m['f1']:.4f} Acc={m['accuracy']:.4f}{marker}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
