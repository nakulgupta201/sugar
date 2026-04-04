import axios from "axios";
import type {
  PredictRequest, JobAccepted, PredictResult, ModelInfo,
} from "@/types/prediction";

// Use relative /api/* — proxied through Next.js to http://backend:8000/api/*
// This avoids CORS entirely and works identically in dev and Docker.
const API_BASE = "/api";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err?.response?.data?.detail;
    throw new Error(detail ?? err?.message ?? "Unknown API error");
  }
);

/** POST /api/predict — Enqueue prediction job (returns job_id immediately) */
export async function enqueuePrediction(body: PredictRequest): Promise<JobAccepted> {
  const { data } = await client.post<JobAccepted>("/predict", body);
  return data;
}

/** GET /api/predict/{job_id} — Poll for result */
export async function pollPrediction(jobId: string): Promise<PredictResult> {
  const { data } = await client.get<PredictResult>(`/predict/${jobId}`);
  return data;
}

/** GET /api/model-info */
export async function getModelInfo(): Promise<ModelInfo> {
  const { data } = await client.get<ModelInfo>("/model-info");
  return data;
}

/** GET /api/health */
export async function healthCheck(): Promise<{ status: string; model_loaded: boolean }> {
  const { data } = await client.get("/health");
  return data;
}
