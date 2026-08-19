import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How VoiceGuard AI Detects Cloned Voices" },
      {
        name: "description",
        content:
          "A plain-language explanation of the detection approach: spectrogram analysis, MFCC features, and pitch/prosody checks.",
      },
      { property: "og:title", content: "How VoiceGuard AI Works" },
      {
        property: "og:description",
        content: "Spectrograms, MFCC features and prosody analysis explained simply.",
      },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  {
    title: "1. Turn sound into a picture (spectrogram)",
    body: "Audio is sliced into tiny time windows and each window is measured for how much energy sits at each frequency. The result is a heat-map of the voice. Synthetic speech often shows unusually regular bands or a hard cut-off in the high frequencies, because the model that generated it never learned the messy detail of real air moving through a throat.",
  },
  {
    title: "2. Summarise the voice's fingerprint (MFCC)",
    body: "MFCC stands for Mel-Frequency Cepstral Coefficients. In plain terms: a compact set of numbers describing the shape of a voice's tone, weighted the way human hearing perceives sound. Real recordings scatter across a wide range of these values; cloned voices tend to cluster tightly, because the generator keeps returning to the same learned pattern.",
  },
  {
    title: "3. Listen to the melody of speech (pitch & prosody)",
    body: "Humans never hold a perfectly steady pitch. We speed up, trail off, take breaths, stumble on a word. Synthetic voices are smoother than they should be: pitch is too stable, pauses are too even, breath sounds are missing. Measuring that variation is one of the strongest tells.",
  },
  {
    title: "4. Combine the evidence into a score",
    body: "Each signal contributes a weight. The classifier combines them into a single probability that the clip is AI-generated, along with the specific signals that pushed the score up or down — so the verdict is explainable, not a black box.",
  },
];

function HowItWorks() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">How it works</h1>
        <p className="mt-3 text-muted-foreground">
          VoiceGuard AI does not try to recognise <em>who</em> is speaking. It looks for the traces
          that a speech-generation model leaves behind in the audio itself.
        </p>

        <div className="mt-8 space-y-4">
          {steps.map((s) => (
            <article key={s.title} className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-caution/40 bg-caution/10 p-5">
          <h2 className="font-semibold text-caution">Current status of this demo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The interface is complete, but the classification itself is a mock that returns a
            simulated score. The trained model will be served from a backend endpoint, which you can
            point this app at from the Settings page — no other change is needed.
          </p>
        </div>

        <div className="mt-8">
          <Button asChild>
            <Link to="/analyze">Run an analysis</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
