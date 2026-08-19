import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { AnalysisResult } from "@/lib/classifier";

const styles = {
  real: {
    label: "Likely Real",
    ring: "border-safe/50 bg-safe/10",
    text: "text-safe",
    bar: "bg-safe",
    Icon: CheckCircle2,
    blurb: "Signals look consistent with a genuine human recording.",
  },
  uncertain: {
    label: "Inconclusive",
    ring: "border-caution/50 bg-caution/10",
    text: "text-caution",
    bar: "bg-caution",
    Icon: AlertTriangle,
    blurb: "Mixed signals. Verify the caller through a second channel.",
  },
  ai: {
    label: "Likely AI-generated",
    ring: "border-danger/50 bg-danger/10",
    text: "text-danger",
    bar: "bg-danger",
    Icon: ShieldAlert,
    blurb: "Synthetic-speech markers detected. Treat this call as suspicious.",
  },
} as const;

export function ResultCard({ result }: { result: AnalysisResult }) {
  const s = styles[result.verdict];
  const pct = Math.round(result.aiProbability * 100);

  return (
    <div className={`rounded-xl border p-5 ${s.ring}`}>
      <div className="flex items-start gap-3">
        <s.Icon className={`mt-0.5 size-6 shrink-0 ${s.text}`} />
        <div className="min-w-0">
          <p className={`text-lg font-semibold ${s.text}`}>{s.label}</p>
          <p className="text-sm text-muted-foreground">{s.blurb}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Confidence it is AI-generated</span>
          <span className={`font-mono text-2xl font-semibold ${s.text}`}>{pct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background/70">
          <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Contributing signals
        </p>
        {result.signals.map((sig) => (
          <div key={sig.label} className="rounded-lg border border-border bg-card/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{sig.label}</p>
              <span className="font-mono text-xs text-muted-foreground">
                {Math.round(sig.weight * 100)}%
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{sig.detail}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Engine: {result.source === "backend" ? "connected backend model" : "mock demo classifier"}
      </p>
    </div>
  );
}
