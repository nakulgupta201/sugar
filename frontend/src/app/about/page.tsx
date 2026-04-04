"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart2, Cpu, Zap, Target, TrendingUp, Layers,
  Activity, RefreshCw, AlertCircle
} from "lucide-react";

// All API calls use relative paths — proxied through Next.js to the backend
const API = "";

interface Metrics {
  best_model: string;
  accuracy: number;
  roc_auc: number;
  precision: number;
  recall: number;
  f1: number;
  cv_mean: number;
  cv_std: number;
  latency_ms: number;
  all_models: Record<string, {
    accuracy: number; roc_auc: number; f1: number; cv_mean: number; latency_ms: number;
  }>;
  trained_at: string;
}

function MetricCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className="glass-card p-6 flex gap-4 items-start"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}22`, border: `1px solid ${color}44` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          {label}
        </p>
        <p className="text-2xl font-extrabold" style={{ color: "hsl(var(--foreground))" }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

function GraphCard({ title, src, caption }: { title: string; src: string; caption: string }) {
  const [err, setErr] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card overflow-hidden"
    >
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>{title}</h3>
        <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{caption}</p>
      </div>
      <div className="bg-[hsl(var(--muted)/0.4)] mx-4 mb-4 rounded-lg overflow-hidden min-h-[220px] flex items-center justify-center">
        {err ? (
          <div className="text-center py-10 px-4">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" style={{ color: "hsl(var(--muted-foreground))" }} />
            <p className="text-sm opacity-60" style={{ color: "hsl(var(--muted-foreground))" }}>
              Image not yet generated. Run training to produce this graph.
            </p>
          </div>
        ) : (
          <img
            src={src}
            alt={title}
            className="w-full h-auto object-contain"
            onError={() => setErr(true)}
          />
        )}
      </div>
    </motion.div>
  );
}

export default function AboutPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/metrics");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMetrics(await res.json());
    } catch (e: any) {
      setError(e.message || "Failed to fetch metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, []);

  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen pt-20 pb-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-14">

        {/* Hero */}
        <section className="text-center pt-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-4"
              style={{ background: "hsl(var(--accent))", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.3)" }}
            >
              <BarChart2 className="w-3.5 h-3.5" /> Model Performance Dashboard
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4" style={{ color: "hsl(var(--foreground))" }}>
              About <span className="gradient-text">DiabetesAI</span>
            </h1>
            <p className="max-w-2xl mx-auto text-base" style={{ color: "hsl(var(--muted-foreground))" }}>
              A production-grade ensemble ML system trained on 100k+ clinical records.
              Results shown below are live metrics from the trained model.
            </p>
          </motion.div>
        </section>

        {/* Metrics */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
              Live Model Metrics
            </h2>
            <button
              onClick={fetchMetrics}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="glass-card p-6 h-28 animate-pulse" style={{ background: "hsl(var(--muted))" }} />
              ))}
            </div>
          )}

          {error && (
            <div
              className="rounded-xl p-5 border flex items-center gap-3"
              style={{ background: "hsl(var(--destructive) / 0.1)", borderColor: "hsl(var(--destructive) / 0.3)" }}
            >
              <AlertCircle className="w-5 h-5 shrink-0" style={{ color: "hsl(var(--destructive))" }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: "hsl(var(--destructive))" }}>Could not load live metrics</p>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Backend may still be starting up. Try refreshing in a moment.
                </p>
              </div>
            </div>
          )}

          {metrics && !loading && (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <MetricCard icon={Target}   label="Accuracy"   value={pct(metrics.accuracy)}  color="#6366f1" />
                <MetricCard icon={TrendingUp} label="ROC-AUC"  value={metrics.roc_auc.toFixed(4)} color="#ec4899" />
                <MetricCard icon={Layers}   label="F1 Score"   value={metrics.f1.toFixed(4)}   color="#14b8a6" />
                <MetricCard icon={Activity} label="CV Score"   value={`${metrics.cv_mean.toFixed(4)} ± ${metrics.cv_std.toFixed(4)}`} color="#f59e0b" />
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon={Target}   label="Precision"  value={pct(metrics.precision)}  color="#0ea5e9" />
                <MetricCard icon={Target}   label="Recall"     value={pct(metrics.recall)}      color="#10b981" />
                <MetricCard icon={Zap}      label="Latency"    value={`${metrics.latency_ms.toFixed(2)} ms`} sub="Single inference" color="#8b5cf6" />
                <MetricCard icon={Cpu}      label="Best Model" value={metrics.best_model}       color="#f97316" />
              </div>

              {/* Per-model table */}
              <div className="mt-8 glass-card overflow-hidden">
                <div className="px-5 pt-5 pb-3">
                  <h3 className="font-bold" style={{ color: "hsl(var(--foreground))" }}>All Model Comparison</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "hsl(var(--muted))", borderBottom: "1px solid hsl(var(--border))" }}>
                        {["Model", "Accuracy", "ROC-AUC", "F1", "CV AUC", "Latency (ms)"].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(metrics.all_models)
                        .sort((a, b) => b[1].roc_auc - a[1].roc_auc)
                        .map(([name, m]) => (
                          <tr
                            key={name}
                            style={{
                              borderBottom: "1px solid hsl(var(--border))",
                              background: name === metrics.best_model ? "hsl(var(--accent))" : "transparent"
                            }}
                          >
                            <td className="px-4 py-3 font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                              {name} {name === metrics.best_model && <span className="text-[10px] font-bold ml-1 px-1.5 py-0.5 rounded" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>BEST</span>}
                            </td>
                            <td className="px-4 py-3" style={{ color: "hsl(var(--foreground))" }}>{pct(m.accuracy)}</td>
                            <td className="px-4 py-3 font-bold" style={{ color: "hsl(var(--primary))" }}>{m.roc_auc.toFixed(4)}</td>
                            <td className="px-4 py-3" style={{ color: "hsl(var(--foreground))" }}>{m.f1.toFixed(4)}</td>
                            <td className="px-4 py-3" style={{ color: "hsl(var(--foreground))" }}>{m.cv_mean.toFixed(4)}</td>
                            <td className="px-4 py-3" style={{ color: "hsl(var(--foreground))" }}>{m.latency_ms?.toFixed(2) ?? "—"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <p className="px-5 pb-4 pt-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Trained: {new Date(metrics.trained_at).toLocaleString()}
                </p>
              </div>
            </>
          )}
        </section>

        {/* Graphs */}
        <section>
          <h2 className="text-xl font-bold mb-6" style={{ color: "hsl(var(--foreground))" }}>
            Training Visualizations
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
          <GraphCard
              title="ROC Curve — All Models"
              src="/api/graphs/roc"
              caption="True positive vs false positive rate across all classifiers"
            />
            <GraphCard
              title="Confusion Matrix"
              src="/api/graphs/confusion"
              caption="Predicted vs actual diabetes labels for the best model"
            />
            <GraphCard
              title="Feature Importance"
              src="/api/graphs/feature"
              caption="Which clinical features drive the prediction most"
            />
            <GraphCard
              title="SHAP Summary"
              src="/api/graphs/shap"
              caption="SHAP beeswarm showing per-feature impact on prediction output"
            />
          </div>
        </section>

        {/* Tech Stack */}
        <section className="glass-card p-8">
          <h2 className="text-xl font-bold mb-6" style={{ color: "hsl(var(--foreground))" }}>
            Tech Stack
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { cat: "ML Models", items: ["Logistic Regression", "Decision Tree", "Random Forest", "XGBoost", "LightGBM"] },
              { cat: "Explainability", items: ["SHAP TreeExplainer", "Feature Importance", "SMOTE Resampling", "Optuna Tuning", "5-Fold CV"] },
              { cat: "Backend", items: ["FastAPI", "Celery + Redis", "SQLAlchemy", "PostgreSQL", "ReportLab PDF"] },
              { cat: "Frontend", items: ["Next.js 14", "TypeScript", "Framer Motion", "Tailwind CSS", "react-hot-toast"] },
              { cat: "Infrastructure", items: ["Docker Compose", "Named Volumes", "CORS Middleware", "Rate Limiting", "SMTP Email"] },
              { cat: "Data", items: ["100k+ clinical records", "8 features", "Real Kaggle dataset", "SMOTE balancing", "Isotonic calibration"] },
            ].map(({ cat, items }) => (
              <div key={cat} className="rounded-xl p-4" style={{ background: "hsl(var(--muted))" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--primary))" }}>{cat}</p>
                <ul className="space-y-1">
                  {items.map(item => (
                    <li key={item} className="text-sm flex items-center gap-2" style={{ color: "hsl(var(--foreground))" }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "hsl(var(--primary))" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

      </div>
    </motion.div>
  );
}
