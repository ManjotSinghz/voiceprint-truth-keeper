import { PhoneCall, PhoneOff, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verdictFor, type Verdict } from "@/lib/classifier";
import { saveEntry } from "@/lib/history";

/**
 * Real-time call simulation (MOCK).
 * Simulates a live incoming call whose audio is "streamed" to the classifier:
 * the confidence meter re-scores every TICK_MS. When a real streaming backend
 * exists, replace `nextProbability` with the value pushed from the socket.
 */
const TICK_MS = 2500;
const CALL_SECONDS = 30;

function nextProbability(prev: number, drift: number) {
  const p = prev + drift + (Math.random() - 0.5) * 0.12;
  return Math.max(0.02, Math.min(0.98, p));
}

const verdictMeta: Record<Verdict, { label: string; text: string; bar: string; Icon: typeof ShieldCheck }> = {
  real: { label: "Voice looks genuine", text: "text-safe", bar: "bg-safe", Icon: ShieldCheck },
  uncertain: { label: "Inconclusive — stay careful", text: "text-caution", bar: "bg-caution", Icon: TriangleAlert },
  ai: { label: "Likely AI-generated voice", text: "text-danger", bar: "bg-danger", Icon: ShieldAlert },
};

export function CallSimulation() {
  const [caller, setCaller] = useState("Mom");
  const [number, setNumber] = useState("+91 98xxx 12345");
  const [live, setLive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [prob, setProb] = useState(0.3);
  const [ticks, setTicks] = useState(0);
  const [ended, setEnded] = useState(false);
  const driftRef = useRef(0);

  useEffect(() => {
    if (!live) return;
    const clock = setInterval(() => setElapsed((e) => e + 1), 1000);
    const scorer = setInterval(() => {
      setProb((p) => nextProbability(p, driftRef.current));
      setTicks((t) => t + 1);
    }, TICK_MS);
    return () => {
      clearInterval(clock);
      clearInterval(scorer);
    };
  }, [live]);

  useEffect(() => {
    if (live && elapsed >= CALL_SECONDS) end();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, live]);

  function start() {
    driftRef.current = (Math.random() - 0.35) * 0.09; // some calls trend synthetic, some don't
    setProb(0.25 + Math.random() * 0.2);
    setElapsed(0);
    setTicks(0);
    setEnded(false);
    setLive(true);
  }

  function end() {
    if (!live) return;
    setLive(false);
    setEnded(true);
    saveEntry(
      { aiProbability: prob, verdict: verdictFor(prob), signals: [], source: "mock" },
      { name: `Simulated call — ${caller || "Unknown"}`, kind: "mic", durationSec: elapsed },
    );
  }

  const pct = Math.round(prob * 100);
  const meta = verdictMeta[verdictFor(prob)];

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-6">
      {!live && !ended && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Set up a demo caller, then watch VoiceGuard score the call continuously while it runs.
          </p>
          <Input value={caller} onChange={(e) => setCaller(e.target.value)} placeholder="Caller name" />
          <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Caller number" />
          <Button className="w-full" onClick={start}>
            <PhoneCall /> Start simulated call
          </Button>
        </div>
      )}

      {(live || ended) && (
        <div className="text-center">
          <div
            className={`mx-auto flex size-20 items-center justify-center rounded-full border text-xl font-semibold ${
              live ? "animate-pulse border-primary/50 bg-primary/10 text-primary" : "border-border bg-secondary"
            }`}
          >
            {(caller || "?").slice(0, 1).toUpperCase()}
          </div>
          <p className="mt-3 text-lg font-semibold">{caller || "Unknown caller"}</p>
          <p className="text-sm text-muted-foreground">{number || "Number withheld"}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {live ? "Incoming call · " : "Call ended · "}
            {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
          </p>

          <div className="mt-6 text-left">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">
                Live AI confidence · {ticks} check{ticks === 1 ? "" : "s"}
              </span>
              <span className={`font-mono text-2xl font-semibold ${meta.text}`}>{pct}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background/70">
              <div
                className={`h-full rounded-full transition-[width] duration-1000 ease-out ${meta.bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className={`mt-3 flex items-center gap-2 text-sm ${meta.text}`}>
              <meta.Icon className="size-4" /> {meta.label}
            </div>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-background/70">
              <div
                className="h-full rounded-full bg-primary/60 transition-[width] duration-1000 ease-linear"
                style={{ width: `${Math.min(100, (elapsed / CALL_SECONDS) * 100)}%` }}
              />
            </div>
          </div>

          <Button
            className="mt-5"
            variant={live ? "destructive" : "outline"}
            onClick={() => (live ? end() : start())}
          >
            {live ? (
              <>
                <PhoneOff /> End call
              </>
            ) : (
              <>
                <PhoneCall /> Run another simulation
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
