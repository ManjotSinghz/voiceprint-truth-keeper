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

/** Weighted mix of the four measured sub-scores → probability the voice is synthetic. */
const WEIGHTS: Record<string, number> = { pitch: 0.3, spectral: 0.25, prosody: 0.25, noise: 0.2 };

const AI_COPY: Record<string, { label: string }> = {
  pitch: { label: "Unnatural pitch consistency" },
  spectral: { label: "Spectral artifacts in high frequencies" },
  prosody: { label: "Flat prosody and missing pauses" },
  noise: { label: "Missing room tone and breath" },
};

const REAL_COPY: Record<string, { label: string }> = {
  pitch: { label: "Natural pitch variation" },
  spectral: { label: "Clean, organic high-band behaviour" },
  prosody: { label: "Organic rhythm with natural pauses" },
  noise: { label: "Breath and room tone present" },
};

function localAnalyze(scores: ReturnType<typeof scoreFeatures>): AnalysisResult {
  let total = 0;
  let weightSum = 0;
  for (const s of scores) {
    const w = WEIGHTS[s.key] ?? 0.25;
    total += s.score * w;
    weightSum += w;
  }
  const humanScore = weightSum ? total / weightSum : 0.5;
  const aiProbability = Math.max(0.02, Math.min(0.98, 1 - humanScore));

  // Signals are the measurements themselves, ordered by how strongly they pushed
  // the verdict — so the explanation always matches the score.
  const signals: Signal[] = [...scores]
    .map((s) => {
      const towardsAi = 1 - s.score;
      const copy = towardsAi >= 0.5 ? AI_COPY[s.key]! : REAL_COPY[s.key]!;
      return {
        label: copy.label,
        detail: s.detail,
        weight: towardsAi >= 0.5 ? towardsAi : s.score,
        sortKey: Math.abs(s.score - 0.5),
      };
    })
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(({ sortKey: _sortKey, ...rest }) => rest);

  return {
    aiProbability,
    verdict: verdictFor(aiProbability),
    signals,
    source: "mock",
    breakdown: scores,
  };
}

/** Analyze an audio blob. Uses the configured backend when present, else local heuristics. */
export async function analyzeAudio(blob: Blob, filename: string): Promise<AnalysisResult> {
  const endpoint = getEndpoint();

  if (!endpoint) {
    const features = await extractFeatures(blob);
    if (features.durationSec < 0.4) {
      throw new Error("Clip is too short to analyse — record at least 1 second of speech.");
    }
    return localAnalyze(scoreFeatures(features));
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
