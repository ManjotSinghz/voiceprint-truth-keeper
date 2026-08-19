import type { AnalysisResult, Verdict } from "./classifier";

export interface HistoryEntry {
  id: string;
  name: string;
  kind: "upload" | "mic";
  createdAt: string;
  durationSec?: number | undefined;
  aiProbability: number;
  verdict: Verdict;
  topSignal?: string | undefined;
  source: "mock" | "backend";
}

const KEY = "voiceguard.history";

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveEntry(
  result: AnalysisResult,
  meta: { name: string; kind: HistoryEntry["kind"]; durationSec?: number | undefined },
): HistoryEntry {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    name: meta.name,
    kind: meta.kind,
    createdAt: new Date().toISOString(),
    durationSec: meta.durationSec,
    aiProbability: result.aiProbability,
    verdict: result.verdict,
    topSignal: [...result.signals].sort((a, b) => b.weight - a.weight)[0]?.label,
    source: result.source,
  };
  const next = [entry, ...loadHistory()].slice(0, 100);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("voiceguard:history"));
  return entry;
}

export function clearHistory() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("voiceguard:history"));
}
