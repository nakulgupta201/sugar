import urllib.request, json
r = urllib.request.urlopen("http://localhost:8000/api/metrics")
m = json.loads(r.read())
print("Best model:", m["best_model"])
print("ROC-AUC:   ", round(m["roc_auc"], 4))
print("Accuracy:  ", round(m["accuracy"]*100, 2), "%")
print("CV Mean:   ", round(m["cv_mean"], 4))
print("Latency:   ", m["latency_ms"], "ms")
print("\nAll models:")
for k,v in m["all_models"].items():
    print(f"  {k:25s} AUC={v['roc_auc']:.4f}  F1={v['f1']:.4f}")

# Verify graph endpoints
for ep in ["roc","confusion","feature","shap"]:
    r2 = urllib.request.urlopen(f"http://localhost:8000/api/graphs/{ep}")
    print(f"  /api/graphs/{ep} -> {r2.status} ({r2.headers.get('Content-Type')})")
