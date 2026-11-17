import { useState, useEffect } from "react";
import { TextScramble } from "@/components/motion/text-scramble";
import { ChromaticTextReveal } from "@/components/motion/chromatic-text-reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { TextShimmer } from "@/components/motion/text-shimmer";
import { TextCascade } from "@/components/motion/text-cascade";
const PHRASES = [
  "Inspecting the repository",
  "Running the checks",
  "Preparing the update",
];

export function TextScramblePreview() {
  const [index, setIndex] = useState(0);

  return (
    <div className="flex w-full flex-col items-center gap-8 text-center">
      <TextScramble
        text={PHRASES[index]}
        className="font-mono text-xl font-medium text-foreground"
      />

      <button
        type="button"
        onClick={() => setIndex((current) => (current + 1) % PHRASES.length)}
        className="inline-flex h-9 items-center rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground press hover:border-(--color-border-strong)"
      >
        Next phrase
      </button>
    </div>
  );
}

export function ChromaticTextRevealPreview() {
  return (
    // The sentence never wraps, so it has to be sized against the space it
    // actually gets — the surrounding column, not the viewport.
    <div className="@container flex w-full justify-center">
      <ChromaticTextReveal
        prefix="Motion that feels"
        words={["natural.", "intentional.", "alive."]}
        startOnView={false}
        className="shrink-0 font-medium tracking-[-0.04em] text-foreground [font-size:clamp(1.25rem,7.8cqw,3rem)]"
      />
    </div>
  );
}

export function TextRevealPreview() {
  const [key, setKey] = useState(0);
  return (
    <div className="flex w-full flex-col items-center gap-8 text-center">
      <div key={key} className="flex flex-col gap-2">
        <TextReveal
          as="h2"
          text={["Motion that feels", "considered."]}
          className="text-balance text-4xl font-semibold leading-[0.95] tracking-[-0.04em] text-foreground sm:text-5xl"
        />
        <TextReveal
          text="Word by word, with a soft blur."
          delay={0.9}
          stagger={0.05}
          blur={6}
          yOffset="20%"
          className="text-sm text-muted-foreground"
        />
      </div>

      <button
        type="button"
        onClick={() => setKey((k) => k + 1)}
        className="inline-flex h-9 items-center rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground press hover:border-(--color-border-strong)"
      >
        Replay
      </button>
    </div>
  );
}

export function TextShimmerPreview() {
  return (
    <div className="flex flex-col gap-4">
      <TextShimmer className="text-3xl font-semibold">Loading projects…</TextShimmer>
      <TextShimmer duration={1.5} className="text-sm">Faster shimmer</TextShimmer>
    </div>
  );
}

const CASCADE_PHRASES = ["Install skills", "Open settings", "Ship updates"];

export function TextCascadePreview() {
  const [phrase, setPhrase] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPhrase((p) => (p + 1) % CASCADE_PHRASES.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex w-full justify-center">
      <p className="text-lg font-medium text-foreground">
        <TextCascade text={CASCADE_PHRASES[phrase] ?? CASCADE_PHRASES[0]} />
      </p>
    </div>
  );
}

