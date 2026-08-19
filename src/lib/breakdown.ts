/**
 * Explainability breakdown (MOCK).
 *
 * Derives four plain-language sub-scores from the overall AI probability so the
 * result never looks like a black box. Values are deterministic for a given
 * probability so the UI stays stable across re-renders.
 *
 * When the real backend lands, return these four numbers from the model and
 * replace `buildBreakdown` with a straight mapping of the API response.
 */

export interface SubScore {
  key: string;
  label: string;
  /** 0..1 — higher means MORE human/natural. */
  score: number;
  explain: string;
}

function seeded(p: number, salt: number): number {
  const x = Math.sin((p * 1000 + salt) * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function buildBreakdown(aiProbability: number): SubScore[] {
  const human = 1 - aiProbability;
  const jitter = (salt: number) => (seeded(aiProbability, salt) - 0.5) * 0.22;
  const clamp = (v: number) => Math.max(0.03, Math.min(0.99, v));

  return [
    {
      key: "pitch",
      label: "Pitch naturalness",
      score: clamp(human + jitter(1)),
      explain: "How much the voice pitch drifts. Real people never hold a perfectly steady tone.",
    },
    {
      key: "spectral",
      label: "Spectral artifacts",
      score: clamp(human + jitter(2)),
      explain: "Checks the high frequencies for the regular banding that synthesis engines leave behind.",
    },
    {
      key: "prosody",
      label: "Voice rhythm & prosody",
      score: clamp(human + jitter(3)),
      explain: "Looks at pauses, emphasis and pace — machines repeat patterns, humans vary them.",
    },
    {
      key: "noise",
      label: "Background noise consistency",
      score: clamp(human + jitter(4)),
      explain: "A genuine call carries steady room tone and breath; cloned audio is often too clean.",
    },
  ];
}
