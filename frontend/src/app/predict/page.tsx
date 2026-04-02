"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PredictForm } from "@/components/predict/PredictForm";
import { ResultsPanel } from "@/components/predict/ResultsPanel";
import type { PredictResponse } from "@/types/prediction";
import { Activity } from "lucide-react";

export default function PredictPage() {
  const [result, setResult] = useState<PredictResponse | null>(null);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ paddingTop: "4rem", background: "var(--gradient-hero)" }}
    >
      {/* Blobs */}
      <div className="blob blob-1 w-96 h-96 top-20 -left-20 opacity-40" />
      <div className="blob blob-2 w-72 h-72 bottom-20 -right-10 opacity-30" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{
              background: "hsl(var(--accent))",
              color: "hsl(var(--primary))",
              border: "1px solid hsl(var(--primary) / 0.25)",
            }}
          >
            <Activity className="w-3 h-3" />
            AI-Powered Assessment
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2" style={{ color: "hsl(var(--foreground))" }}>
            {result ? "Your Risk Assessment" : "Diabetes Risk Predictor"}
          </h1>
          <p className="text-sm max-w-md mx-auto" style={{ color: "hsl(var(--muted-foreground))" }}>
            {result
              ? "Here are your personalized results with AI-powered explanations."
              : "Fill in your health information below. It takes less than 60 seconds."}
          </p>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35 }}
            >
              <ResultsPanel result={result} onReset={() => setResult(null)} />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35 }}
            >
              <PredictForm onResult={setResult} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
