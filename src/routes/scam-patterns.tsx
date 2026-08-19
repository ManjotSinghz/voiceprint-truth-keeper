import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ShieldQuestion } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { scamPatterns } from "@/lib/scam-patterns";

export const Route = createFileRoute("/scam-patterns")({
  head: () => ({
    meta: [
      { title: "Common AI Voice Scam Patterns — VoiceGuard AI" },
      {
        name: "description",
        content:
          "A library of common AI voice-cloning scams — fake relatives, bank alerts, CEO transfers — with the red flags to watch for on each call.",
      },
      { property: "og:title", content: "Common AI Voice Scam Patterns" },
      {
        property: "og:description",
        content: "Learn the typical AI voice scam scripts and the red flags that give them away.",
      },
    ],
  }),
  component: ScamPatternsPage,
});

function ScamPatternsPage() {
  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Common scam patterns</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Detection helps after the call starts. Recognising the script helps before it does. These
          are the AI voice-cloning scenarios reported most often.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {scamPatterns.map((p) => (
          <article key={p.id} className="rounded-xl border border-border bg-card p-5">
            <ShieldQuestion className="size-5 text-primary" />
            <h2 className="mt-3 font-semibold">{p.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
            <p className="mt-4 flex items-center gap-1.5 text-xs font-medium tracking-wide text-caution uppercase">
              <AlertTriangle className="size-3.5" /> Red flags
            </p>
            <ul className="mt-2 space-y-1.5">
              {p.redFlags.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-caution" />
                  {f}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <p className="mt-8 rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
        Golden rule: hang up and call the person back on a number you already have saved. No genuine
        bank, employer or police officer loses anything if you verify first.
      </p>
    </AppShell>
  );
}
