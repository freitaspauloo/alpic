import { ArrowUpRight, Sparkles, ArrowRight, Download, Trash2 } from "lucide-react";
import { MetallicButton, Button, type ButtonState, StatefulButton, MagneticButton } from "@/components/motion/button";
import { useState } from "react";
export function ButtonMetallicPreview() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 px-6 py-10">
      <MetallicButton>
        Continue
        <ArrowUpRight className="size-4" />
      </MetallicButton>
      <MetallicButton size="sm">
        <Sparkles className="size-3.5" />
        Generate
      </MetallicButton>
      <MetallicButton size="icon" aria-label="Magic tools">
        <Sparkles className="size-4" />
      </MetallicButton>
    </div>
  );
}

export function ButtonBasePreview() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" size="md">
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="md">
          <Download className="h-4 w-4" />
          Download
        </Button>
        <Button variant="outline" size="md">Outline</Button>
        <Button variant="ghost" size="md">Ghost</Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary" size="md">Medium</Button>
        <Button variant="primary" size="lg">Large</Button>
        <Button variant="secondary" size="icon" aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" size="md" ripple>Ripple</Button>
        <Button variant="outline" size="md" ripple>Tap me</Button>
      </div>
    </div>
  );
}

export function ButtonStatefulPreview() {
  const [okState, setOkState] = useState<ButtonState>("idle");
  const [errState, setErrState] = useState<ButtonState>("idle");

  const run = (target: "ok" | "err") => {
    const setter = target === "ok" ? setOkState : setErrState;
    setter("loading");
    setTimeout(() => {
      setter(target === "ok" ? "success" : "error");
      setTimeout(() => setter("idle"), 1800);
    }, 1400);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <StatefulButton
        state={okState}
        variant="primary"
        size="md"
        onClick={() => run("ok")}
        loadingText="Saving"
        successText="Saved"
        icon={<ArrowRight className="h-4 w-4" />}
      >
        Save changes
      </StatefulButton>
      <StatefulButton
        state={errState}
        variant="secondary"
        size="md"
        onClick={() => run("err")}
        loadingText="Submitting"
        errorText="Failed"
      >
        Submit
      </StatefulButton>
    </div>
  );
}

export function ButtonMagneticPreview() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <MagneticButton variant="primary" size="md" strength={0.35}>
        Hover me
        <ArrowRight className="h-4 w-4" />
      </MagneticButton>
      <MagneticButton variant="secondary" size="md" strength={0.25}>
        Subtle pull
      </MagneticButton>
      <MagneticButton variant="outline" size="md" strength={0.5}>
        Strong pull
      </MagneticButton>
    </div>
  );
}

