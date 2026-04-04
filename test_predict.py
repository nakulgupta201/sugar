import urllib.request
import json
import time

def test():
    payload = {
        "gender": "Male",
        "age": 45,
        "hypertension": 0,
        "heart_disease": 0,
        "smoking_history": "never",
        "bmi": 24.5,
        "HbA1c_level": 5.0,
        "blood_glucose_level": 95,
        "send_email": False,
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request("http://localhost:8000/api/predict", data=data, headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req, timeout=5) as resp:
        job = json.loads(resp.read().decode())
        job_id = job['job_id']
        print(f"Queued: {job_id}")

    for _ in range(15):
        time.sleep(1.5)
        req2 = urllib.request.Request(f"http://localhost:8000/api/predict/{job_id}")
        with urllib.request.urlopen(req2, timeout=5) as r2:
            d = json.loads(r2.read().decode())
            print(f"Status: {d['status']}")
            if d['status'] in ('completed', 'failed'):
                print(json.dumps(d, indent=2))
                return

if __name__ == "__main__":
    test()
