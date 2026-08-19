import { useMemo } from "react";

interface Props {
  peaks: number[];
  variant?: "wave" | "spectrogram";
  className?: string;
}

/** Purely visual waveform / spectrogram rendering of sampled peaks. */
export function Waveform({ peaks, variant = "wave", className }: Props) {
  const bars = useMemo(() => (peaks.length ? peaks : Array.from({ length: 64 }, () => 0.05)), [peaks]);

  if (variant === "spectrogram") {
    return (
      <div className={`flex h-28 items-end gap-px overflow-hidden rounded-lg bg-background/60 p-1 ${className ?? ""}`}>
        {bars.map((p, i) => (
          <div key={i} className="flex h-full flex-1 flex-col-reverse gap-px">
            {Array.from({ length: 8 }).map((_, row) => {
              const intensity = Math.max(0, p * 1.6 - row * 0.16);
              return (
                <div
                  key={row}
                  className="flex-1 rounded-[1px] bg-primary"
                  style={{ opacity: Math.min(0.95, intensity) }}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex h-28 items-center gap-[2px] rounded-lg bg-background/60 px-2 ${className ?? ""}`}>
      {bars.map((p, i) => (
        <div
          key={i}
          className="flex-1 rounded-full bg-primary/80"
          style={{ height: `${Math.max(3, Math.min(100, p * 100))}%` }}
        />
      ))}
    </div>
  );
}

/** Decode an audio blob into normalized peak samples for visualization. */
export async function extractPeaks(blob: Blob, buckets = 72): Promise<{ peaks: number[]; duration: number }> {
  const AudioCtx =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return { peaks: [], duration: 0 };
  const ctx = new AudioCtx();
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    const data = buf.getChannelData(0);
    const size = Math.floor(data.length / buckets) || 1;
    const peaks: number[] = [];
    let max = 0.0001;
    for (let i = 0; i < buckets; i++) {
      let peak = 0;
      for (let j = 0; j < size; j++) peak = Math.max(peak, Math.abs(data[i * size + j] ?? 0));
      max = Math.max(max, peak);
      peaks.push(peak);
    }
    return { peaks: peaks.map((p) => p / max), duration: buf.duration };
  } catch {
    return { peaks: [], duration: 0 };
  } finally {
    void ctx.close();
  }
}
