# DiabetesAI — Production-Grade Diabetes Risk Prediction System

A full-stack, production-ready healthcare AI system for diabetes risk prediction with SHAP explainability, featuring:

- **5 ML Models**: Logistic Regression, Decision Tree, Random Forest, XGBoost, LightGBM
- **SHAP Explainability** per prediction
- **FastAPI Backend** with input validation, rate limiting, email reports
- **Next.js Frontend** with 7 themes, animations, charts, and PDF download
- **Docker** support

---

## Project Structure

```
diabetes-risk-predictor/
├── ml/                          # ML training pipeline
│   ├── data/                    # << Place dataset here
│   ├── artifacts/               # Saved model, scaler, encoders
│   ├── plots/                   # SHAP plots (generated)
│   ├── train.py                 # Training script
│   ├── predict.py               # Inference module
│   └── requirements.txt
├── backend/                     # FastAPI API
│   ├── app/
│   │   ├── routes/              # predict, health, model-info
│   │   ├── services/            # email_service
│   │   └── middleware/          # logging, rate_limit
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                    # Next.js 14 + TypeScript
│   ├── src/
│   │   ├── app/                 # pages (/, /predict, /about)
│   │   ├── components/          # Navbar, PredictForm, ResultsPanel
│   │   ├── lib/                 # API client
│   │   └── types/               # TypeScript types
│   ├── Dockerfile
│   └── next.config.ts
└── docker-compose.yml
```

---

## Quick Start

### Step 1: Get the Dataset

Download the **Diabetes Prediction Dataset** from Kaggle:

👉 [https://www.kaggle.com/datasets/iammustafatz/diabetes-prediction-dataset](https://www.kaggle.com/datasets/iammustafatz/diabetes-prediction-dataset)

Place `diabetes_prediction_dataset.csv` in `ml/data/`.

---

### Step 2: Train the ML Model

```bash
cd ml
pip install -r requirements.txt
python train.py
```

This will:
- Train 5 models (LR, DT, RF, XGBoost, LightGBM)
- Evaluate all models on ROC-AUC, F1, Accuracy
- Save best model + SHAP explainer to `ml/artifacts/`
- Generate SHAP plots in `ml/plots/`

---

### Step 3: Start the Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # Configure SMTP if you want emails
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/api/docs

---

### Step 4: Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:3000

---

## API Endpoints

| Method | Endpoint         | Description                            |
|--------|------------------|----------------------------------------|
| GET    | `/api/health`    | Health check + model status            |
| GET    | `/api/model-info`| Best model metrics + feature importance|
| POST   | `/api/predict`   | Predict diabetes risk                  |

### POST /api/predict — Request Body

```json
{
  "gender": "male",
  "age": 45,
  "hypertension": 0,
  "heart_disease": 0,
  "smoking_history": "never",
  "bmi": 27.5,
  "HbA1c_level": 5.8,
  "blood_glucose_level": 140,
  "send_email": false
}
```

### Response

```json
{
  "probability": 18.7,
  "risk_level": "Low",
  "prediction": 0,
  "model_name": "XGBoost",
  "top_factors": [...],
  "model_metrics": { "roc_auc": 0.9812, ... },
  "email_sent": false
}
```

---

## Themes

The UI supports 7 themes, switchable from the navbar:

| Theme         | Description                    |
|---------------|--------------------------------|
| Light         | Clean white professional       |
| Dark          | Dark mode (default)            |
| High Contrast | Accessible black/white         |
| Neon          | Purple/cyan glow               |
| Medical Blue  | Clinical blue palette          |
| Soft Pastel   | Pink/lavender gentle theme     |
| Cyberpunk     | Yellow/black dystopian         |

---

## Docker Deployment

```bash
# Build ML model first (required)
cd ml && python train.py

# Then start everything
docker-compose up --build
```

---

## Email Reports (Optional)

Configure SMTP in `backend/.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
FROM_NAME=DiabetesAI
```

> Use Gmail App Passwords (not your main password).

---

## ⚠️ Medical Disclaimer

This tool is for **educational and informational purposes only**. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional.

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| ML       | Python, scikit-learn, XGBoost, LightGBM, SHAP |
| Backend  | FastAPI, Pydantic v2, uvicorn, slowapi  |
| Frontend | Next.js 14, TypeScript, Framer Motion   |
| Charts   | Recharts                                |
| Deploy   | Docker, Docker Compose                  |
