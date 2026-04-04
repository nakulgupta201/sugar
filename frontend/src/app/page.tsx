"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import {
  Activity, Brain, Shield, Zap, BarChart2, ChevronRight,
  CheckCircle, Star, ArrowRight, HeartPulse
} from "lucide-react";

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const STAGGER: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

const FEATURES = [
  {
    icon: Brain,
    title: "5 ML Models",
    desc: "Ensemble of Logistic Regression, Decision Tree, Random Forest, XGBoost, and LightGBM.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: BarChart2,
    title: "SHAP Explainability",
    desc: "Understand exactly which health factors drive your risk score with transparent AI.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Shield,
    title: "High Accuracy",
    desc: "Models evaluated on ROC-AUC, F1, precision & recall. Best model auto-selected.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Zap,
    title: "Instant Results",
    desc: "Sub-100ms inference latency. Real-time probability scoring.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: HeartPulse,
    title: "Clinical Inputs",
    desc: "Covers 8 evidence-based clinical features: HbA1c, glucose, BMI, and more.",
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: Activity,
    title: "Email Report",
    desc: "Receive a detailed HTML report with risk level and top contributing factors.",
    color: "from-violet-500 to-purple-500",
  },
];

const STATS = [
  { value: "97.8%",  label: "Model Accuracy" },
  { value: "0.98",   label: "ROC-AUC Score" },
  { value: "<100ms", label: "Inference Speed" },
  { value: "8",      label: "Health Features" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Enter Health Data",   desc: "Fill in your clinical health parameters in the intuitive form." },
  { step: "02", title: "AI Analysis",         desc: "Our ensemble model processes your data and computes risk probability." },
  { step: "03", title: "Explained Results",   desc: "See your risk level with SHAP-powered factor explanations." },
  { step: "04", title: "Get Your Report",     desc: "Optionally receive a detailed PDF/email report for your records." },
];

export default function HomePage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen" 
      style={{ paddingTop: "4rem" }}
    >

      {/* ── HERO ── */}
      <section
        className="relative min-h-[92vh] flex items-center overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        {/* Animated blobs */}
        <div className="blob blob-1 w-96 h-96 top-10 left-10 opacity-60" />
        <div className="blob blob-2 w-80 h-80 bottom-20 right-20 opacity-50" />
        <div className="blob blob-3 w-64 h-64 top-1/3 right-1/3 opacity-40" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <motion.div
            variants={STAGGER}
            initial="hidden"
            animate="show"
            className="max-w-4xl"
          >
            {/* Pill badge */}
            <motion.div variants={FADE_UP} className="mb-6">
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium"
                style={{
                  background: "hsl(var(--accent))",
                  color: "hsl(var(--primary))",
                  border: "1px solid hsl(var(--primary) / 0.3)",
                }}
              >
                <Activity className="w-3.5 h-3.5" />
                AI-Powered Healthcare
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "hsl(var(--primary))" }}
                />
              </span>
            </motion.div>

            <motion.h1
              variants={FADE_UP}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6"
              style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.03em" }}
            >
              Know Your{" "}
              <span className="gradient-text">Diabetes Risk</span>
              <br /> Before It Knows You
            </motion.h1>

            <motion.p
              variants={FADE_UP}
              className="text-lg sm:text-xl max-w-2xl leading-relaxed mb-10"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              State-of-the-art ensemble ML models analyze 8 clinical health parameters
              to deliver instant, explainable diabetes risk predictions — with
              SHAP-powered transparency you can trust.
            </motion.p>

            <motion.div variants={FADE_UP} className="flex flex-wrap gap-4">
              <Link href="/predict" className="btn-primary inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold">
                Check My Risk <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all"
                style={{
                  background: "hsl(var(--muted))",
                  color: "hsl(var(--foreground))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                How It Works <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Trust signals */}
            <motion.div variants={FADE_UP} className="flex flex-wrap gap-6 mt-12">
              {["No signup required", "100% private", "Instant results", "Clinically relevant"].map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  <CheckCircle className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Floating card */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="hidden lg:block absolute right-6 top-1/2 -translate-y-1/2 w-80 glass-card p-6"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "hsl(142 72% 45% / 0.15)" }}>
                <Activity className="w-4 h-4" style={{ color: "hsl(142 72% 45%)" }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Risk Level</p>
                <p className="text-sm font-bold" style={{ color: "hsl(142 72% 45%)" }}>Low Risk</p>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                <span>Probability</span><span className="font-bold" style={{ color: "hsl(var(--foreground))" }}>12.4%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "12.4%" }}
                  transition={{ delay: 0.8, duration: 1.2 }}
                  className="h-full rounded-full"
                  style={{ background: "hsl(142 72% 45%)" }}
                />
              </div>
            </div>
            <p className="text-xs font-semibold mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Top Factors</p>
            {[
              { label: "Blood Glucose",  val: "Normal", color: "hsl(142 72% 45%)" },
              { label: "HbA1c Level",    val: "Normal", color: "hsl(142 72% 45%)" },
              { label: "BMI",            val: "Slight ↑", color: "hsl(38 100% 50%)" },
            ].map((f) => (
              <div key={f.label} className="flex justify-between py-1.5 text-xs border-b" style={{ borderColor: "hsl(var(--border))" }}>
                <span style={{ color: "hsl(var(--muted-foreground))" }}>{f.label}</span>
                <span className="font-semibold" style={{ color: f.color }}>{f.val}</span>
              </div>
            ))}
            <p className="text-xs mt-3" style={{ color: "hsl(var(--muted-foreground))" }}>
              Model: <span style={{ color: "hsl(var(--primary))" }}>XGBoost</span> &nbsp;· AUC 0.9812
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16" style={{ background: "hsl(var(--card))", borderTop: "1px solid hsl(var(--border))", borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl sm:text-4xl font-extrabold gradient-text">{s.value}</p>
                <p className="text-sm mt-1 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24" style={{ background: "hsl(var(--background))" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: "hsl(var(--foreground))" }}>
              Built for <span className="gradient-text">Accuracy & Transparency</span>
            </h2>
            <p className="max-w-2xl mx-auto text-base" style={{ color: "hsl(var(--muted-foreground))" }}>
              Every prediction comes with a detailed explanation so you understand exactly why your risk level is what it is.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="glass-card p-6 group"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24" style={{ background: "hsl(var(--card))" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: "hsl(var(--foreground))" }}>
              How It <span className="gradient-text">Works</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative glass-card p-6"
              >
                <div
                  className="text-5xl font-black mb-4 opacity-10"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  {step.step}
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>{step.title}</h3>
                <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="blob blob-1 w-80 h-80 top-0 right-0 opacity-50" />
        <div className="blob blob-2 w-64 h-64 bottom-0 left-0 opacity-40" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: "hsl(var(--foreground))" }}>
              Take Control of Your <span className="gradient-text">Health Today</span>
            </h2>
            <p className="mb-8 text-base" style={{ color: "hsl(var(--muted-foreground))" }}>
              It only takes 60 seconds. No account needed. Your data is never stored.
            </p>
            <Link href="/predict" className="btn-primary inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-bold">
              Start Free Assessment <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              ⚠️ For informational purposes only. Not a substitute for medical advice.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 text-center text-sm"
        style={{
          background: "hsl(var(--card))",
          color: "hsl(var(--muted-foreground))",
          borderTop: "1px solid hsl(var(--border))",
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
          <span className="font-bold gradient-text">DiabetesAI</span>
        </div>
        <p>© 2026 DiabetesAI · Built with Next.js + FastAPI + XGBoost</p>
      </footer>
    </motion.div>
  );
}
