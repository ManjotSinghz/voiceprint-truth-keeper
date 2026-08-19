import { Download, FileText, Share2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { AnalysisResult } from "@/lib/classifier";

/**
 * Shareable incident report. Renders a summary card and exports it as a PNG
 * drawn on a canvas (no extra dependency). Wire to a server-side PDF later.
 */
export function IncidentReport({ result, clipName }: { result: AnalysisResult; clipName: string }) {
  const [open, setOpen] = useState(false);
  const stamp = useRef(new Date());
  const pct = Math.round(result.aiProbability * 100);
  const when = stamp.current.toLocaleString();

  function download() {
    const c = document.createElement("canvas");
    c.width = 1000;
    c.height = 620;
    const g = c.getContext("2d");
    if (!g) return;

    g.fillStyle = "#0b1220";
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = "#e11d48";
    g.fillRect(0, 0, c.width, 8);

    g.fillStyle = "#93a3b8";
    g.font = "600 22px sans-serif";
    g.fillText("VoiceGuard AI — Incident Report", 56, 84);

    g.fillStyle = "#f8fafc";
    g.font = "700 52px sans-serif";
    g.fillText("Potential AI voice scam", 56, 168);

    g.fillStyle = "#fb7185";
    g.font = "700 120px sans-serif";
    g.fillText(`${pct}%`, 56, 300);
    g.fillStyle = "#93a3b8";
    g.font = "400 22px sans-serif";
    g.fillText("confidence the voice was AI-generated", 56, 340);

    g.fillStyle = "#f8fafc";
    g.font = "400 22px sans-serif";
    g.fillText(`Clip: ${clipName.slice(0, 52)}`, 56, 400);
    g.fillText(`Analyzed: ${when}`, 56, 436);
    g.fillText(`Engine: ${result.source === "backend" ? "connected model" : "demo classifier"}`, 56, 472);

    g.fillStyle = "#93a3b8";
    g.font = "400 18px sans-serif";
    g.fillText("This call was flagged as a potential AI voice scam.", 56, 536);
    g.fillText("Indicative result — verify the caller through a second channel before acting.", 56, 566);

    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `voiceguard-report-${stamp.current.getTime()}.png`;
    a.click();
    toast.success("Report image downloaded");
  }

  async function share() {
    const text = `VoiceGuard AI: this call was flagged as a potential AI voice scam (${pct}% confidence, ${when}).`;
    try {
      if (navigator.share) await navigator.share({ title: "VoiceGuard AI incident report", text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success("Summary copied to clipboard");
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-4 w-full">
          <FileText /> Generate report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Incident report</DialogTitle>
        </DialogHeader>

        <div className="rounded-xl border border-danger/40 bg-danger/10 p-5">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">VoiceGuard AI</p>
          <p className="mt-2 text-xl font-semibold text-danger">Potential AI voice scam</p>
          <p className="mt-4 font-mono text-5xl font-semibold text-danger">{pct}%</p>
          <p className="text-sm text-muted-foreground">confidence the voice was AI-generated</p>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Clip</dt>
              <dd className="truncate">{clipName || "Untitled clip"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Analyzed</dt>
              <dd>{when}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Engine</dt>
              <dd>{result.source === "backend" ? "connected model" : "demo classifier"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            This call was flagged as a potential AI voice scam. Share with family, your bank or the
            cyber-crime helpline.
          </p>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={download}>
            <Download /> Download
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => void share()}>
            <Share2 /> Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
