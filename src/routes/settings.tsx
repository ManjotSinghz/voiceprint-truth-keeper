import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getEndpoint, setEndpoint } from "@/lib/classifier";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings & Model Endpoint — VoiceGuard AI" },
      {
        name: "description",
        content: "Configure the backend model endpoint used for voice authenticity classification.",
      },
      { property: "og:title", content: "Settings — VoiceGuard AI" },
      { property: "og:description", content: "Point the app at your own model API." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    const v = getEndpoint();
    setUrl(v);
    setSaved(v);
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your own model when it is ready. Until then the app uses the mock classifier.
        </p>

        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <Label htmlFor="endpoint">Backend model endpoint</Label>
          <Input
            id="endpoint"
            className="mt-2"
            placeholder="https://your-api.example.com/predict"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Leave empty to keep using the mock classifier.
          </p>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => {
                setEndpoint(url);
                setSaved(url.trim());
                toast.success(url.trim() ? "Endpoint saved" : "Endpoint cleared — using mock");
              }}
            >
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEndpoint("");
                setUrl("");
                setSaved("");
                toast.success("Reverted to mock classifier");
              }}
            >
              Use mock
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Active engine:{" "}
            <span className="font-medium text-foreground">{saved ? saved : "mock classifier"}</span>
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">Expected API contract</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The app sends <code className="font-mono">POST multipart/form-data</code> with a{" "}
            <code className="font-mono">file</code> field and expects JSON:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-background/70 p-4 font-mono text-xs text-muted-foreground">
            {`{
  "aiProbability": 0.78,
  "signals": [
    { "label": "Unnatural pitch consistency",
      "detail": "Pitch variance below human range",
      "weight": 0.62 }
  ]
}`}
          </pre>
          <p className="mt-3 text-xs text-muted-foreground">
            Your Flask/FastAPI service must allow CORS from this origin.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
