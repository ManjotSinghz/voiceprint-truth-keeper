import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, PhoneCall, Square, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CallSimulation } from "@/components/CallSimulation";
import { IncidentReport } from "@/components/IncidentReport";
import { ResultCard } from "@/components/ResultCard";
import { TrustedProfiles } from "@/components/TrustedProfiles";
import { extractPeaks, Waveform } from "@/components/Waveform";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { analyzeAudio, getEndpoint, type AnalysisResult } from "@/lib/classifier";
import { saveEntry } from "@/lib/history";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze a Voice — VoiceGuard AI" },
      {
        name: "description",
        content:
          "Upload a call recording or record a live mic sample to check whether the voice is likely AI-generated.",
      },
      { property: "og:title", content: "Analyze a Voice — VoiceGuard AI" },
      { property: "og:description", content: "Upload or record audio and get a confidence score." },
    ],
  }),
  component: AnalyzePage,
});

const CHUNK_MS = 3000;

function AnalyzePage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [clipName, setClipName] = useState("");
  const [recording, setRecording] = useState(false);
  const [chunkCount, setChunkCount] = useState(0);
  const [engine, setEngine] = useState("mock classifier");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stoppingRef = useRef(false);

  useEffect(() => {
    setEngine(getEndpoint() || "mock classifier");
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function runAnalysis(blob: Blob, name: string, kind: "upload" | "mic") {
    setBusy(true);
    setClipName(name);
    try {
      const [{ peaks: p, duration }, res] = await Promise.all([
        extractPeaks(blob),
        analyzeAudio(blob, name),
      ]);
      setPeaks(p);
      setResult(res);
      saveEntry(res, { name, kind, durationSec: duration || undefined });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      stoppingRef.current = false;
      setChunkCount(0);
      setRecording(true);

      const recordChunk = () => {
        if (stoppingRef.current || !streamRef.current) return;
        const rec = new MediaRecorder(streamRef.current);
        recorderRef.current = rec;
        const parts: Blob[] = [];
        rec.ondataavailable = (e) => e.data.size > 0 && parts.push(e.data);
        rec.onstop = async () => {
          const blob = new Blob(parts, { type: rec.mimeType || "audio/webm" });
          if (blob.size > 0) {
            setChunkCount((c) => c + 1);
            await runAnalysis(blob, `Live mic chunk ${new Date().toLocaleTimeString()}`, "mic");
          }
          if (!stoppingRef.current) recordChunk();
        };
        rec.start();
        setTimeout(() => rec.state !== "inactive" && rec.stop(), CHUNK_MS);
      };

      recordChunk();
    } catch {
      toast.error("Microphone access denied or unavailable.");
      setRecording(false);
    }
  }

  function stopRecording() {
    stoppingRef.current = true;
    setRecording(false);
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Analyze a voice</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Engine: <span className="text-foreground">{engine}</span>
          </p>

          <Tabs defaultValue="upload" className="mt-6">
            <TabsList className="w-full">
              <TabsTrigger value="upload" className="flex-1">
                <Upload className="size-4" /> Upload
              </TabsTrigger>
              <TabsTrigger value="mic" className="flex-1">
                <Mic className="size-4" /> Live mic test
              </TabsTrigger>
              <TabsTrigger value="call" className="flex-1">
                <PhoneCall className="size-4" /> Simulate call
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center transition-colors hover:border-primary/60">
                <Upload className="size-6 text-primary" />
                <span className="mt-3 font-medium">Choose an audio file</span>
                <span className="mt-1 text-xs text-muted-foreground">.mp3, .wav or .m4a</span>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void runAnalysis(file, file.name, "upload");
                    e.target.value = "";
                  }}
                />
              </label>
            </TabsContent>

            <TabsContent value="mic">
              <div className="mt-4 rounded-xl border border-border bg-card p-8 text-center">
                <div
                  className={`mx-auto flex size-20 items-center justify-center rounded-full border ${
                    recording ? "animate-pulse border-danger/50 bg-danger/15" : "border-border bg-secondary"
                  }`}
                >
                  <Mic className={`size-8 ${recording ? "text-danger" : "text-primary"}`} />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {recording
                    ? `Recording in ${CHUNK_MS / 1000}s chunks — ${chunkCount} analysed`
                    : "Put the call on speaker, then capture short chunks for a rolling verdict."}
                </p>
                <Button
                  className="mt-4"
                  variant={recording ? "destructive" : "default"}
                  onClick={() => (recording ? stopRecording() : void startRecording())}
                >
                  {recording ? (
                    <>
                      <Square /> Stop
                    </>
                  ) : (
                    <>
                      <Mic /> Start live test
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="call">
              <CallSimulation />
            </TabsContent>
          </Tabs>

          {(peaks.length > 0 || busy) && (
            <div className="mt-6 rounded-xl border border-border bg-card p-5">
              <p className="truncate text-sm font-medium">{clipName || "Analyzing…"}</p>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Waveform</p>
                  <Waveform peaks={peaks} />
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Spectrogram (illustrative)</p>
                  <Waveform peaks={peaks} variant="spectrogram" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 lg:pt-16">
          {busy && (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" /> Analysing pitch, spectrum and
              prosody…
            </div>
          )}
          {!busy && result && (
            <div>
              <ResultCard result={result} />
              {result.verdict === "ai" && <IncidentReport result={result} clipName={clipName} />}
            </div>
          )}
          {!busy && !result && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Your result will appear here.
            </div>
          )}

          <TrustedProfiles
            currentClip={
              result ? { name: clipName, aiProbability: result.aiProbability } : undefined
            }
          />
        </div>
      </div>
    </AppShell>
  );
}
