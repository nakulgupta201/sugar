import axios from "axios";
import type {
  PredictRequest, JobAccepted, PredictResult,
  ModelInfo, AuthTokenResponse, UserProfile, HistoryItem,
} from "@/types/prediction";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Inject auth token from localStorage on every request
client.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("diabetes_ai_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err?.response?.data?.detail;
    throw new Error(detail ?? err?.message ?? "Unknown API error");
  }
);

/** POST /predict — Enqueue prediction job (returns job_id immediately) */
export async function enqueuePrediction(body: PredictRequest): Promise<JobAccepted> {
  const { data } = await client.post<JobAccepted>("/predict", body);
  return data;
}

/** GET /predict/{job_id} — Poll for result */
export async function pollPrediction(jobId: string): Promise<PredictResult> {
  const { data } = await client.get<PredictResult>(`/predict/${jobId}`);
  return data;
}

/** GET /model-info */
export async function getModelInfo(): Promise<ModelInfo> {
  const { data } = await client.get<ModelInfo>("/model-info");
  return data;
}

/** GET /health */
export async function healthCheck(): Promise<{ status: string; model_loaded: boolean }> {
  const { data } = await client.get("/health");
  return data;
}

/** POST /auth/register */
export async function register(email: string, password: string): Promise<AuthTokenResponse> {
  const { data } = await client.post<AuthTokenResponse>("/auth/register", { email, password });
  return data;
}

/** POST /auth/token (login) */
export async function login(email: string, password: string): Promise<AuthTokenResponse> {
  const params = new URLSearchParams();
  params.append("username", email);
  params.append("password", password);
  const { data } = await client.post<AuthTokenResponse>("/auth/token", params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

/** GET /auth/me */
export async function getMe(): Promise<UserProfile> {
  const { data } = await client.get<UserProfile>("/auth/me");
  return data;
}

/** GET /history */
export async function getHistory(limit = 20): Promise<HistoryItem[]> {
  const { data } = await client.get<HistoryItem[]>(`/history?limit=${limit}`);
  return data;
}
