import { ExpandingArrowButton } from "@/components/motion/expanding-arrow-button";
import { useState } from "react";
import { HoldActionButton } from "@/components/motion/hold-action-button";
import { SlideActionButton } from "@/components/motion/slide-action-button";
export function ExpandingArrowButtonPreview() {
  return (
    <div className="flex items-center justify-center">
      <ExpandingArrowButton>Book a demo</ExpandingArrowButton>
    </div>
  );
}

export function HoldActionButtonPreview() {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <HoldActionButton
        onHoldComplete={() => {
          setConfirmed(true);
          window.setTimeout(() => setConfirmed(false), 1800);
        }}
      >
        Hold for vertical fill
      </HoldActionButton>
      <HoldActionButton
        type="horizontal"
        onHoldComplete={() => {
          setConfirmed(true);
          window.setTimeout(() => setConfirmed(false), 1800);
        }}
      >
        Hold for horizontal fill
      </HoldActionButton>
      <p className="h-4 text-xs text-muted-foreground" aria-live="polite">
        {confirmed ? "Action confirmed" : "Release early to cancel"}
      </p>
    </div>
  );
}

export function SlideActionButtonPreview() {
  const [continued, setContinued] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      <SlideActionButton
        completeLabel="Ready"
        onComplete={() => {
          setContinued(true);
          window.setTimeout(() => setContinued(false), 1800);
        }}
      >
        Slide to continue
      </SlideActionButton>
      <p className="h-4 text-xs text-muted-foreground" aria-live="polite">
        {continued ? "Action completed" : "Drag the arrow to the end"}
      </p>
    </div>
  );
}

