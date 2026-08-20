/**
 * Real (heuristic) acoustic feature extraction.
 *
 * This runs entirely in the browser on the decoded PCM data — no random values.
 * It measures four properties that reliably differ between recorded human speech
 * and synthesised/cloned speech, and turns them into 0..1 "human-ness" scores.
 *
 * When a real ML backend is configured in Settings, `analyzeAudio` uses that
 * instead and these heuristics are skipped.
 */

export interface AcousticFeatures {
  /** frames-per-second envelope of the signal */
  durationSec: number;
  /** relative std-dev of the estimated fundamental frequency (0 = perfectly flat) */
  pitchVariation: number;
  /** median f0 in Hz (0 when unvoiced/undetectable) */
  medianF0: number;
  /** high-band (fast-changing) energy over total energy */
  highBandRatio: number;
  /** how much the high-band ratio itself varies between frames */
  highBandStability: number;
  /** relative std-dev of the loudness envelope */
  envelopeVariation: number;
  /** share of frames that are near-silent (pauses / breaths) */
  pauseRatio: number;
  /** RMS of the quietest frames — the room-tone / noise floor */
  noiseFloor: number;
  /** how much the noise floor drifts across the clip */
  noiseFloorVariation: number;
}

const FRAME = 1024;

function std(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const v = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(v);
}

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
}

/** Autocorrelation pitch estimate for one frame. Returns Hz or 0 when unvoiced. */
function estimateF0(frame: Float32Array, sampleRate: number): number {
  const minHz = 70;
  const maxHz = 400;
  const minLag = Math.floor(sampleRate / maxHz);
  const maxLag = Math.min(Math.floor(sampleRate / minHz), frame.length - 1);

  let rms = 0;
  for (let i = 0; i < frame.length; i++) rms += frame[i]! * frame[i]!;
  rms = Math.sqrt(rms / frame.length);
  if (rms < 0.01) return 0;

  let bestLag = 0;
  let bestCorr = 0;
  let energy0 = 0;
  for (let i = 0; i < frame.length; i++) energy0 += frame[i]! * frame[i]!;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i + lag < frame.length; i++) corr += frame[i]! * frame[i + lag]!;
    const norm = corr / (energy0 || 1);
    if (norm > bestCorr) {
      bestCorr = norm;
      bestLag = lag;
    }
  }
  if (bestCorr < 0.3 || !bestLag) return 0;
  return sampleRate / bestLag;
}

export async function extractFeatures(blob: Blob): Promise<AcousticFeatures> {
  const Ctx =
    (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  const ctx = new Ctx();
  const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  void ctx.close();

  const f0s: number[] = [];
  const rmsList: number[] = [];
  const highRatios: number[] = [];

  for (let start = 0; start + FRAME <= data.length; start += FRAME) {
    const frame = data.subarray(start, start + FRAME);

    let energy = 0;
    let diffEnergy = 0;
    for (let i = 0; i < frame.length; i++) {
      energy += frame[i]! * frame[i]!;
      if (i > 0) {
        const d = frame[i]! - frame[i - 1]!;
        diffEnergy += d * d;
      }
    }
    const rms = Math.sqrt(energy / frame.length);
    rmsList.push(rms);

    if (rms > 0.01) {
      // first-difference energy ratio ≈ share of high-frequency content
      highRatios.push(Math.min(4, diffEnergy / (energy || 1e-9)) / 4);
      const f0 = estimateF0(frame as Float32Array, sampleRate);
      if (f0 > 0) f0s.push(f0);
    }
  }

  const peak = Math.max(...rmsList, 1e-9);
  const loudFrames = rmsList.filter((r) => r > peak * 0.15);
  const quietFrames = [...rmsList].sort((a, b) => a - b).slice(0, Math.max(1, Math.floor(rmsList.length * 0.15)));

  const f0Mean = mean(f0s) || 1;
  const halfway = Math.floor(quietFrames.length / 2) || 1;

  return {
    durationSec: buffer.duration,
    pitchVariation: f0s.length > 3 ? std(f0s) / f0Mean : 0,
    medianF0: median(f0s),
    highBandRatio: mean(highRatios),
    highBandStability: highRatios.length > 3 ? std(highRatios) / (mean(highRatios) || 1) : 0,
    envelopeVariation: loudFrames.length > 3 ? std(loudFrames) / (mean(loudFrames) || 1) : 0,
    pauseRatio: rmsList.length ? rmsList.filter((r) => r < peak * 0.08).length / rmsList.length : 0,
    noiseFloor: mean(quietFrames),
    noiseFloorVariation:
      quietFrames.length > 3
        ? Math.abs(mean(quietFrames.slice(0, halfway)) - mean(quietFrames.slice(halfway))) /
          (mean(quietFrames) || 1e-6)
        : 0,
  };
}

/** Map a measurement onto 0..1 where `good` scores 1 and `bad` scores 0. */
function ramp(value: number, bad: number, good: number): number {
  const t = (value - bad) / (good - bad);
  return Math.max(0, Math.min(1, t));
}

export interface FeatureScore {
  key: string;
  label: string;
  /** 0..1 — higher means MORE human/natural */
  score: number;
  explain: string;
  detail: string;
}

/** Turn raw measurements into the four explainability sub-scores. */
export function scoreFeatures(f: AcousticFeatures): FeatureScore[] {
  // Human speech pitch typically varies 8–35% around its mean; TTS sits much lower.
  const pitch = ramp(f.pitchVariation, 0.03, 0.16);
  // Synthesis leaves either a scrubbed or a very uniform high band.
  const spectral = Math.min(1, ramp(f.highBandStability, 0.12, 0.45) * 0.7 + ramp(f.highBandRatio, 0.02, 0.12) * 0.3);
  // Humans vary loudness and take irregular pauses.
  const prosody = Math.min(1, ramp(f.envelopeVariation, 0.12, 0.45) * 0.6 + ramp(f.pauseRatio, 0.02, 0.18) * 0.4);
  // A genuine recording carries a real, slightly drifting room-tone floor.
  const noise = Math.min(1, ramp(f.noiseFloor, 0.0005, 0.008) * 0.6 + ramp(f.noiseFloorVariation, 0.02, 0.3) * 0.4);

  return [
    {
      key: "pitch",
      label: "Pitch naturalness",
      score: pitch,
      explain: "How much the voice pitch drifts. Real people never hold a perfectly steady tone.",
      detail: `Measured pitch drift ${(f.pitchVariation * 100).toFixed(1)}% around ${Math.round(f.medianF0)} Hz.`,
    },
    {
      key: "spectral",
      label: "Spectral artifacts",
      score: spectral,
      explain: "Checks the high frequencies for the regular banding synthesis engines leave behind.",
      detail: `High-band energy ${(f.highBandRatio * 100).toFixed(1)}%, frame-to-frame variation ${(
        f.highBandStability * 100
      ).toFixed(0)}%.`,
    },
    {
      key: "prosody",
      label: "Voice rhythm & prosody",
      score: prosody,
      explain: "Looks at pauses, emphasis and pace — machines repeat patterns, humans vary them.",
      detail: `Loudness variation ${(f.envelopeVariation * 100).toFixed(0)}%, pauses ${(f.pauseRatio * 100).toFixed(
        0,
      )}% of the clip.`,
    },
    {
      key: "noise",
      label: "Background noise consistency",
      score: noise,
      explain: "A genuine call carries steady room tone and breath; cloned audio is often too clean.",
      detail: `Noise floor ${(f.noiseFloor * 1000).toFixed(2)}‰ with ${(f.noiseFloorVariation * 100).toFixed(
        0,
      )}% drift.`,
    },
  ];
}
