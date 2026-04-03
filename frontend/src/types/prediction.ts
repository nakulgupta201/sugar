// Shared TypeScript types — updated for async job model

export interface PredictRequest {
  gender:              "male" | "female" | "other";
  age:                 number;
  hypertension:        0 | 1;
  heart_disease:       0 | 1;
  smoking_history:     "never" | "former" | "current" | "ever" | "not_current" | "no_info";
  bmi:                 number;
  HbA1c_level:         number;
  blood_glucose_level: number;
  send_email:          boolean;
  email?:              string;
}

/** Returned immediately from POST /api/predict (202) */
export interface JobAccepted {
  job_id:  string;
  status:  "pending";
  message: string;
}

export interface FactorItem {
  feature:      string;
  display_name: string;
  shap_value:   number;
  direction:    "increases" | "decreases";
}

export interface ModelMetrics {
  accuracy:   number;
  precision:  number;
  recall:     number;
  f1:         number;
  roc_auc:    number;
  train_time: number;
}

/** Returned by GET /api/predict/{job_id} */
export interface PredictResult {
  job_id:        string;
  status:        "pending" | "processing" | "completed" | "failed";
  probability?:  number;
  risk_level?:   "Low" | "Medium" | "High";
  prediction?:   0 | 1;
  model_name?:   string;
  top_factors?:  FactorItem[];
  email_sent:    boolean;
  error_message?: string;
  created_at?:   string;
  completed_at?: string;
}

// Keep PredictResponse as alias for backwards compat with ResultsPanel
export type PredictResponse = PredictResult & {
  all_shap_values?: Record<string, number>;
  model_metrics?:   ModelMetrics;
};

export interface HistoryItem {
  job_id:      string;
  status:      string;
  probability: number | null;
  risk_level:  string | null;
  created_at:  string | null;
}

export interface ModelInfo {
  best_model_name:    string;
  best_metrics:       ModelMetrics;
  all_model_metrics:  Record<string, ModelMetrics>;
  feature_importance: Record<string, number>;
  feature_order:      string[];
  trained_at:         string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type:   string;
}

export interface UserProfile {
  id:         string;
  email:      string;
  created_at: string;
}

export type RiskLevel = "Low" | "Medium" | "High";

export const RISK_CONFIG: Record<RiskLevel, { color: string; bg: string; gradient: string; emoji: string; label: string }> = {
  Low:    { color: "hsl(142 72% 45%)", bg: "hsl(142 72% 45% / 0.12)", gradient: "from-emerald-500 to-teal-500",   emoji: "✅", label: "Low Risk" },
  Medium: { color: "hsl(38 100% 50%)",  bg: "hsl(38 100% 50% / 0.12)",  gradient: "from-amber-500 to-orange-500",  emoji: "⚠️", label: "Medium Risk" },
  High:   { color: "hsl(0 84% 60%)",    bg: "hsl(0 84% 60% / 0.12)",    gradient: "from-rose-500 to-red-500",     emoji: "🔴", label: "High Risk" },
};

/** Human-readable SHAP insight generator */
export function shapInsight(factor: FactorItem): string {
  const dir = factor.direction === "increases" ? "increased" : "decreased";
  const magnitude = Math.abs(factor.shap_value);
  const intensity = magnitude > 0.3 ? "significantly" : magnitude > 0.1 ? "moderately" : "slightly";
  return `Your ${factor.display_name} ${intensity} ${dir} your risk.`;
}
