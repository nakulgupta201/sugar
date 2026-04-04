from app.ml.predict import predictor
predictor.load()
print("Model:", predictor.model_name, type(predictor.model).__name__)

inp_low = {"gender":"male","age":25,"hypertension":0,"heart_disease":0,
           "smoking_history":"never","bmi":22.0,"HbA1c_level":4.5,"blood_glucose_level":80}
r = predictor.predict(inp_low)
print(f"LOW-RISK:  prob={r.probability}%  risk={r.risk_level}")

inp_high = {"gender":"male","age":65,"hypertension":1,"heart_disease":1,
            "smoking_history":"current","bmi":38.0,"HbA1c_level":9.5,"blood_glucose_level":280}
r2 = predictor.predict(inp_high)
print(f"HIGH-RISK: prob={r2.probability}%  risk={r2.risk_level}")
