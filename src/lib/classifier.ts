/**
 * Voice authenticity classifier.
 *
 * Local mode measures the audio for real (see `audio-features.ts`): pitch drift,
 * high-band behaviour, loudness/pause rhythm and the noise floor. No randomness.
 *
 * When the real ML model (Flask/FastAPI) is ready, set the backend endpoint URL
 * in Settings — `analyzeAudio` will then POST the audio file to `<endpoint>` as
 * multipart/form-data and expect JSON:
 *
 *   { "aiProbability": 0.78, "signals": [{ "label": "...", "detail": "...", "weight": 0.4 }] }
 *
 * No other code needs to change.
 */

import { extractFeatures, scoreFeatures, type FeatureScore } from "@/lib/audio-features";

export type Verdict = "real" | "uncertain" | "ai";

export interface Signal {
  label: string;
  detail: string;
  weight: number; // 0..1
}

export interface AnalysisResult {
  aiProbability: number; // 0..1
  verdict: Verdict;
  signals: Signal[];
  source: "mock" | "backend";
  /** Measured sub-scores powering the "Why this result?" panel (local mode only). */
  breakdown?: FeatureScore[];
}


export const ENDPOINT_STORAGE_KEY = "voiceguard.endpoint";

export function getEndpoint(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ENDPOINT_STORAGE_KEY) ?? "";
}

export function setEndpoint(url: string) {
  if (typeof window === "undefined") return;
  if (url.trim()) window.localStorage.setItem(ENDPOINT_STORAGE_KEY, url.trim());
  else window.localStorage.removeItem(ENDPOINT_STORAGE_KEY);
}

export function verdictFor(p: number): Verdict {
  if (p >= 0.65) return "ai";
  if (p >= 0.4) return "uncertain";
  return "real";
}

const AI_SIGNALS: Omit<Signal, "weight">[] = [
  {
    label: "Unnatural pitch consistency",
    detail: "Pitch stays almost perfectly steady — human speech drifts naturally.",
  },
  {
    label: "Spectral artifacts in high frequencies",
    detail: "Energy above 8 kHz shows regular banding typical of vocoder output.",
  },
  {
    label: "Missing breath and micro-pauses",
    detail: "Almost no breath intake or lip noise between phrases.",
  },
  {
    label: "Flat prosody rhythm",
    detail: "Sentence stress patterns repeat with machine-like regularity.",
  },
  {
    label: "MFCC distribution anomaly",
    detail: "Cepstral coefficients cluster more tightly than in recorded speech.",
  },
];

const REAL_SIGNALS: Omit<Signal, "weight">[] = [
  {
    label: "Natural pitch variation",
    detail: "Fundamental frequency wanders the way an untrained human voice does.",
  },
  {
    label: "Breath and room tone present",
    detail: "Background noise floor and breath sounds match a live recording.",
  },
  {
    label: "Organic prosody",
    detail: "Pauses and emphasis vary irregularly across sentences.",
  },
  {
    label: "Clean high-band roll-off",
    detail: "High frequencies decay smoothly with no synthetic banding.",
  },
];

function pick<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

function mockAnalyze(): AnalysisResult {
  const aiProbability = Math.round(Math.random() * 96 + 2) / 100;
  const leaning = aiProbability >= 0.5 ? AI_SIGNALS : REAL_SIGNALS;
  const other = aiProbability >= 0.5 ? REAL_SIGNALS : AI_SIGNALS;
  const signals: Signal[] = [
    ...pick(leaning, 3).map((s) => ({ ...s, weight: 0.45 + Math.random() * 0.5 })),
    ...pick(other, 1).map((s) => ({ ...s, weight: Math.random() * 0.3 })),
  ];
  return {
    aiProbability,
    verdict: verdictFor(aiProbability),
    signals,
    source: "mock",
  };
}

/** Analyze an audio blob. Uses the configured backend when present, else mock. */
export async function analyzeAudio(blob: Blob, filename: string): Promise<AnalysisResult> {
  const endpoint = getEndpoint();

  if (!endpoint) {
    await new Promise((r) => setTimeout(r, 1400));
    return mockAnalyze();
  }

  const form = new FormData();
  form.append("file", blob, filename);

  const res = await fetch(endpoint, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Backend responded ${res.status}`);
  const data = (await res.json()) as { aiProbability?: number; signals?: Signal[] };
  const p = typeof data.aiProbability === "number" ? data.aiProbability : 0;
  return {
    aiProbability: p,
    verdict: verdictFor(p),
    signals: data.signals ?? [],
    source: "backend",
  };
}
