/**
 * Trusted Voice Profiles (MOCK "voice fingerprint" comparison).
 *
 * A user saves a label ("Mom's voice") against a clip they already analyzed.
 * We store a small numeric fingerprint derived from the clip; later clips are
 * compared against it to produce a similarity percentage.
 *
 * Replace `fingerprintOf` / `similarity` with real speaker-embedding cosine
 * similarity from the backend when the model is connected.
 */

export interface VoiceProfile {
  id: string;
  label: string;
  clipName: string;
  createdAt: string;
  fingerprint: number; // 0..1 mock embedding scalar
}

const KEY = "voiceguard.profiles";

export function fingerprintOf(clipName: string, aiProbability: number): number {
  let h = 0;
  for (const ch of clipName) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return (h / 9973) * 0.6 + (1 - aiProbability) * 0.4;
}

/** Mock similarity: closer fingerprints => higher match. */
export function similarity(a: number, b: number): number {
  return Math.max(0, Math.min(1, 1 - Math.abs(a - b) * 1.35));
}

export function loadProfiles(): VoiceProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VoiceProfile[]) : [];
  } catch {
    return [];
  }
}

export function saveProfile(p: Omit<VoiceProfile, "id" | "createdAt">): VoiceProfile {
  const entry: VoiceProfile = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const next = [entry, ...loadProfiles()].slice(0, 20);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("voiceguard:profiles"));
  return entry;
}

export function removeProfile(id: string) {
  const next = loadProfiles().filter((p) => p.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("voiceguard:profiles"));
}
