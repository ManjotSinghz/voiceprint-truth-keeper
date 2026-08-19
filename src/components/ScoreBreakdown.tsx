import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { buildBreakdown } from "@/lib/breakdown";

/** Expandable "Why this result?" explainability panel. Mock sub-scores for now. */
export function ScoreBreakdown({ aiProbability }: { aiProbability: number }) {
  const [open, setOpen] = useState(false);
  const scores = buildBreakdown(aiProbability);

  return (
    <div className="mt-5 rounded-lg border border-border bg-card/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 p-3 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium">Why this result?</span>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border p-3">
          {scores.map((s) => {
            const pct = Math.round(s.score * 100);
            const tone = pct >= 65 ? "bg-safe" : pct >= 40 ? "bg-caution" : "bg-danger";
            return (
              <div key={s.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm">{s.label}</p>
                  <span className="font-mono text-xs text-muted-foreground">{pct}/100</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-background/70">
                  <div
                    className={`h-full rounded-full transition-[width] duration-700 ease-out ${tone}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.explain}</p>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">
            Higher bars mean the signal looks more human. Scores are indicative, not proof.
          </p>
        </div>
      )}
    </div>
  );
}
