"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Brain, Database, Cpu, ArrowRight, Activity, Shield } from "lucide-react";

const MODELS = [
  { name: "Logistic Regression", type: "Linear",    color: "#6366f1", desc: "Baseline linear model with L2 regularization." },
  { name: "Decision Tree",       type: "Tree",       color: "#8b5cf6", desc: "Interpretable rule-based classifier." },
  { name: "Random Forest",       type: "Ensemble",   color: "#22c55e", desc: "200-tree bagged ensemble with class balancing." },
  { name: "XGBoost",             type: "Boosting",   color: "#f59e0b", desc: "Gradient boosted trees with scale_pos_weight." },
  { name: "LightGBM",            type: "Boosting",   color: "#ec4899", desc: "Fast gradient boosting on leaf-wise trees." },
];

const FEATURES = [
  { name: "Blood Glucose Level",  icon: "🩸", range: "50–400 mg/dL",  importance: "Very High" },
  { name: "HbA1c Level",          icon: "🔬", range: "3.5–15 %",      importance: "Very High" },
  { name: "BMI",                  icon: "⚖️",  range: "10–70 kg/m²",   importance: "High" },
  { name: "Age",                  icon: "📅", range: "1–120 years",   importance: "High" },
  { name: "Hypertension",         icon: "💓", range: "Yes / No",      importance: "Moderate" },
  { name: "Heart Disease",        icon: "❤️", range: "Yes / No",      importance: "Moderate" },
  { name: "Smoking History",      icon: "🚬", range: "6 categories",  importance: "Moderate" },
  { name: "Gender",               icon: "👤", range: "M / F / Other", importance: "Low" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ paddingTop: "4rem", background: "hsl(var(--background))" }}>

      {/* Hero */}
      <section
        className="py-20 relative overflow-hidden"
        style={{ background: "var(--gradient-hero)", borderBottom: "1px solid hsl(var(--border))" }}
      >
        <div className="blob blob-1 w-80 h-80 top-0 right-0 opacity-40" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: "hsl(var(--accent))", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.2)" }}>
              <Brain className="w-3 h-3" /> How the AI Works
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4" style={{ color: "hsl(var(--foreground))" }}>
              About <span className="gradient-text">DiabetesAI</span>
            </h1>
            <p className="text-base max-w-2xl mx-auto" style={{ color: "hsl(var(--muted-foreground))" }}>
              A production-grade machine learning pipeline trained on clinical data,
              delivering transparent and explainable diabetes risk predictions.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-16">

        {/* ML Pipeline */}
        <section>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-extrabold mb-2" style={{ color: "hsl(var(--foreground))" }}>ML Pipeline</h2>
            <p className="text-sm mb-8" style={{ color: "hsl(var(--muted-foreground))" }}>
              Five models are trained and evaluated — the best by ROC-AUC is automatically deployed.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODELS.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="glass-card p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>{m.name}</h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${m.color}20`, color: m.color }}
                  >
                    {m.type}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-extrabold mb-2" style={{ color: "hsl(var(--foreground))" }}>Clinical Features</h2>
            <p className="text-sm mb-8" style={{ color: "hsl(var(--muted-foreground))" }}>
              8 evidence-based clinical inputs used for prediction.
            </p>
          </motion.div>
          <div className="overflow-hidden rounded-xl" style={{ border: "1px solid hsl(var(--border))" }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "hsl(var(--muted))" }}>
                  {["Feature", "Range", "Importance"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: "hsl(var(--muted-foreground))" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f, i) => (
                  <tr
                    key={f.name}
                    style={{ background: i % 2 === 0 ? "hsl(var(--card))" : "hsl(var(--muted) / 0.3)", borderBottom: "1px solid hsl(var(--border))" }}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{f.icon}</span>
                        <span className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{f.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>{f.range}</td>
                    <td className="px-5 py-3">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: f.importance === "Very High" ? "hsl(0 84% 60% / 0.12)" :
                                      f.importance === "High"      ? "hsl(38 100% 50% / 0.12)" :
                                      f.importance === "Moderate"  ? "hsl(246 70% 60% / 0.12)" :
                                                                     "hsl(var(--muted))",
                          color:      f.importance === "Very High" ? "hsl(0 84% 55%)" :
                                      f.importance === "High"      ? "hsl(38 100% 45%)" :
                                      f.importance === "Moderate"  ? "hsl(246 70% 60%)" :
                                                                     "hsl(var(--muted-foreground))",
                        }}
                      >
                        {f.importance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tech Stack */}
        <section>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-extrabold mb-8" style={{ color: "hsl(var(--foreground))" }}>Tech Stack</h2>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Brain,    label: "Machine Learning",  items: ["scikit-learn", "XGBoost", "LightGBM", "SHAP", "SMOTE"],          color: "from-purple-500 to-indigo-500" },
              { icon: Cpu,      label: "Backend API",       items: ["FastAPI", "Uvicorn", "Pydantic v2", "slowapi", "aiosmtplib"],     color: "from-blue-500 to-cyan-500" },
              { icon: Database, label: "Frontend",          items: ["Next.js 14", "TypeScript", "Framer Motion", "Recharts", "Zod"],   color: "from-rose-500 to-pink-500" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(var(--foreground))" }}>{s.label}</h3>
                <ul className="space-y-1">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(var(--primary))" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section>
          <div
            className="glass-card p-6 flex gap-4"
            style={{ border: "1px solid hsl(var(--destructive) / 0.3)", background: "hsl(var(--destructive) / 0.06)" }}
          >
            <Shield className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--destructive))" }} />
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: "hsl(var(--destructive))" }}>Medical Disclaimer</h3>
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                DiabetesAI is an educational and informational tool. Predictions are based on statistical
                patterns in training data and are <strong>not a substitute for professional medical diagnosis</strong>.
                Always consult a qualified physician or endocrinologist for diabetes testing and treatment.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center py-8">
          <Link href="/predict" className="btn-primary inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold">
            Start Your Assessment <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
