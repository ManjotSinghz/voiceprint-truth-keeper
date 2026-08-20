import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, AudioLines, History, PhoneCall, Radio, ShieldCheck, Waves } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { communityAlerts } from "@/lib/alerts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VoiceGuard AI — Detect AI-Cloned Voices in Scam Calls" },
      {
        name: "description",
        content:
          "Upload a recording or run a live mic test to check whether a caller's voice is likely AI-generated. Fast, private, mobile-friendly.",
      },
      { property: "og:title", content: "VoiceGuard AI — Detect AI-Cloned Voices" },
      {
        property: "og:description",
        content: "Check whether a caller's voice is likely AI-generated, in seconds.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <AppShell>
      <section className="py-10 text-center sm:py-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" /> Voice cloning defence, in your browser
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Is that really your family member on the call?
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
          Scammers can clone a voice from a few seconds of audio. VoiceGuard AI analyses a recording
          or a live mic sample and tells you how likely it is to be synthetic — before you act on it.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/analyze">Try it now</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/how-it-works">How it works</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            Icon: PhoneCall,
            title: "The problem",
            body: "A cloned voice plus urgency — an accident, an arrest, a payment deadline — is enough to drain a bank account.",
          },
          {
            Icon: Waves,
            title: "The check",
            body: "We look at pitch stability, spectral artifacts, breathing and rhythm — the traces synthesis leaves behind.",
          },
          {
            Icon: Activity,
            title: "The answer",
            body: "A clear confidence score with the signals that drove it, so you can decide in seconds.",
          },
        ].map(({ Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-5">
            <Icon className="size-5 text-primary" />
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Two ways to test</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-4">
            <AudioLines className="size-5 text-primary" />
            <h3 className="mt-2 font-medium">Upload a recording</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Drop an .mp3, .wav or .m4a clip of the call and get a verdict with a waveform view.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <History className="size-5 text-primary" />
            <h3 className="mt-2 font-medium">Live mic test</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Put the call on speaker and capture short 3-second chunks for a rolling verdict.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
