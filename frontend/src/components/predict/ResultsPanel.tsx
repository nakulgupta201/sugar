"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { PredictResult } from "@/types/prediction";
import { RISK_CONFIG } from "@/types/prediction";
import { useI18n } from "@/components/providers/I18nProvider";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from "recharts";
import { RefreshCw, Download, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ──── Radial Progress ─────────────────────────────────────────────────────────
function RadialProgress({ value, color }: { value: number; color: string }) {
  const size = 200;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(value), 200);
    return () => clearTimeout(timer);
  }, [value]);

  const offset = circ - (animated / 100) * circ;

  return (
    <div className="radial-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} style={{ stroke: "hsl(var(--muted))", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
        <circle className="fill" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} style={{ stroke: color, transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 8px ${color}60)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold" style={{ color }}>{value.toFixed(1)}%</span>
      </div>
    </div>
  );
}

// ──── SHAP Bar Chart ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="px-3 py-2 rounded-lg shadow-xl text-xs" style={{ background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))", border: "1px solid hsl(var(--border))" }}>
      <p className="font-bold">{item.display_name}</p>
      <p>SHAP: <span style={{ color: item.shap_value > 0 ? "hsl(0 84% 60%)" : "hsl(142 72% 45%)" }}>
        {item.shap_value > 0 ? "+" : ""}{item.shap_value.toFixed(4)}
      </span></p>
      <p style={{ color: "hsl(var(--muted-foreground))" }}>{item.direction} risk</p>
    </div>
  );
};

// ──── Main Results Panel ──────────────────────────────────────────────────────
export function ResultsPanel({ result, onReset }: { result: PredictResult; onReset: () => void }) {
  const { t } = useI18n();
  const reportRef = useRef<HTMLDivElement>(null);
  const prob = result.probability ?? 0;
  
  // Default to High if missing, for safety
  const riskLabel = result.risk_level ?? "High";
  const risk = RISK_CONFIG[riskLabel] ?? RISK_CONFIG["High"];

  const topFactors = result.top_factors ?? [];
  const shapData = topFactors.map((f: any) => ({
    display_name: f.display_name,
    shap_value:   f.shap_value,
    direction:    f.direction,
    abs_value:    Math.abs(f.shap_value),
  })).sort((a: any, b: any) => b.abs_value - a.abs_value);

  const handleDownloadPDF = async () => {
    window.open(`http://localhost:8000/api/predict/${result.job_id}/pdf`, '_blank');
  };

  const riskMessage = riskLabel === "Low" ? t("results.lowRisk") :
                      riskLabel === "Medium" ? t("results.mediumRisk") :
                      t("results.highRisk");

  return (
    <motion.div
      ref={reportRef}
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* ── Risk Summary Card ── */}
      <div className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-8" style={{ boxShadow: `0 0 60px ${risk.color}25` }}>
        <div className="flex-shrink-0">
          <RadialProgress value={prob} color={risk.color} />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-3" style={{ background: risk.bg, color: risk.color, border: `1px solid ${risk.color}40` }}>
            {risk.emoji} {riskLabel} Risk
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: "hsl(var(--foreground))" }}>
            {riskMessage}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
            {t("results.modelUsed", { model: result.model_name ?? "Ensemble", probability: prob.toFixed(1) })}
            {result.email_sent && ` ${t("results.emailSent")}`}
          </p>

          <div className="flex gap-3 mt-5 justify-center sm:justify-start">
            <button onClick={onReset} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[hsl(var(--border))]" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
              <RefreshCw className="w-4 h-4" /> {t("predict.newAssessment")}
            </button>
            <button onClick={handleDownloadPDF} className="btn-primary flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold">
              <Download className="w-4 h-4" /> {t("predict.downloadPDF")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* SHAP Top Factors */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>{t("results.keyFactors")}</h3>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{t("results.shapSubtitle")}</p>
          </div>

          <div className="space-y-3">
            {shapData.slice(0, 4).map((f: any, i: number) => {
              const isPositive = f.direction === "increases";
              const barColor   = isPositive ? "hsl(0 84% 60%)" : "hsl(142 72% 45%)";
              const maxVal     = Math.max(...shapData.map((x: any) => Math.abs(x.shap_value)));
              const pct        = (Math.abs(f.shap_value) / maxVal) * 100;
              return (
                <motion.div key={f.display_name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{f.display_name}</span>
                    <span className="flex items-center gap-1" style={{ color: barColor }}>
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {f.shap_value > 0 ? "+" : ""}{f.shap_value.toFixed(4)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.08 + 0.3, duration: 0.8 }} className="h-full rounded-full" style={{ background: barColor }} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4" style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shapData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="display_name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={90} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar dataKey="abs_value" radius={[0, 4, 4, 0]}>
                  {shapData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.shap_value > 0 ? "hsl(0 84% 60%)" : "hsl(142 72% 45%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Info */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>{t("results.modelPerformance")}</h3>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              {t("results.modelSelectedBy", { model: result.model_name ?? "Ensemble" })}
            </p>
          </div>
          <div className="rounded-lg p-4 flex gap-2 text-sm" style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}>
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{t("results.autoSelected")}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
        {t("results.medicalDisclaimer")}
      </p>
    </motion.div>
  );
}
