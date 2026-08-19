import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mic, Trash2, Upload } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { clearHistory, loadHistory, type HistoryEntry } from "@/lib/history";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Scan History — VoiceGuard AI" },
      {
        name: "description",
        content: "Review past voice authenticity scans with their confidence scores and timestamps.",
      },
      { property: "og:title", content: "Scan History — VoiceGuard AI" },
      { property: "og:description", content: "Past voice scans, scores and timestamps." },
    ],
  }),
  component: HistoryPage,
});

const verdictStyle = {
  real: "text-safe border-safe/40 bg-safe/10",
  uncertain: "text-caution border-caution/40 bg-caution/10",
  ai: "text-danger border-danger/40 bg-danger/10",
} as const;

const verdictLabel = { real: "Likely Real", uncertain: "Inconclusive", ai: "Likely AI" } as const;

function HistoryPage() {
  const [items, setItems] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const sync = () => setItems(loadHistory());
    sync();
    window.addEventListener("voiceguard:history", sync);
    return () => window.removeEventListener("voiceguard:history", sync);
  }, []);

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Scan history</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stored locally on this device — {items.length} scan{items.length === 1 ? "" : "s"}.
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" onClick={() => clearHistory()}>
            <Trash2 /> Clear
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">No scans yet.</p>
          <Button asChild className="mt-4">
            <Link to="/analyze">Analyze a clip</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="rounded-lg bg-secondary p-2 text-muted-foreground">
                {e.kind === "mic" ? <Mic className="size-4" /> : <Upload className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString()}
                  {e.durationSec ? ` · ${e.durationSec.toFixed(1)}s` : ""}
                  {e.topSignal ? ` · ${e.topSignal}` : ""}
                </p>
              </div>
              <span className="font-mono text-lg">{Math.round(e.aiProbability * 100)}%</span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${verdictStyle[e.verdict]}`}
              >
                {verdictLabel[e.verdict]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
