import { BadgeCheck, Trash2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fingerprintOf,
  loadProfiles,
  removeProfile,
  saveProfile,
  similarity,
  type VoiceProfile,
} from "@/lib/profiles";

/**
 * Trusted Voice Profiles — mock "voice fingerprint" matching.
 * Profiles live in localStorage; similarity is a placeholder computation.
 */
export function TrustedProfiles({
  currentClip,
}: {
  currentClip?: { name: string; aiProbability: number } | undefined;
}) {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [label, setLabel] = useState("");

  useEffect(() => {
    const sync = () => setProfiles(loadProfiles());
    sync();
    window.addEventListener("voiceguard:profiles", sync);
    return () => window.removeEventListener("voiceguard:profiles", sync);
  }, []);

  const currentPrint = currentClip ? fingerprintOf(currentClip.name, currentClip.aiProbability) : null;

  function add() {
    if (!currentClip || !label.trim()) return;
    saveProfile({
      label: label.trim(),
      clipName: currentClip.name,
      fingerprint: fingerprintOf(currentClip.name, currentClip.aiProbability),
    });
    setLabel("");
    toast.success("Voice profile saved");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <BadgeCheck className="size-5 text-primary" />
        <h2 className="font-semibold">Trusted voice profiles</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Save a known voice, then every new clip is compared against it as a voice fingerprint match.
      </p>

      {currentClip ? (
        <div className="mt-4 flex gap-2">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Mom's voice"
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Button onClick={add} disabled={!label.trim()}>
            <UserPlus /> Save
          </Button>
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
          Analyze a clip first to save it as a trusted profile.
        </p>
      )}

      <div className="mt-4 space-y-2">
        {profiles.length === 0 && (
          <p className="text-xs text-muted-foreground">No profiles saved yet.</p>
        )}
        {profiles.map((p) => {
          const match = currentPrint === null ? null : Math.round(similarity(currentPrint, p.fingerprint) * 100);
          const tone = match === null ? "" : match >= 70 ? "text-safe" : match >= 40 ? "text-caution" : "text-danger";
          return (
            <div key={p.id} className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.label}</p>
                  <p className="truncate text-xs text-muted-foreground">from {p.clipName}</p>
                </div>
                <div className="flex items-center gap-2">
                  {match !== null && (
                    <span className={`font-mono text-sm font-semibold ${tone}`}>{match}%</span>
                  )}
                  <button
                    type="button"
                    aria-label={`Delete ${p.label}`}
                    onClick={() => removeProfile(p.id)}
                    className="text-muted-foreground transition-colors hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              {match !== null && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background/70">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                    style={{ width: `${match}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
