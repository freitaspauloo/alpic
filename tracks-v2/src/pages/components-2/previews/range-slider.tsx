import { InlineSlider } from "@/components/motion/range-slider-inline";
import { useState } from "react";
import { RangeSlider } from "@/components/motion/range-slider";
import { FluidSlider } from "@/components/motion/range-slider-fluid";
import { WaveSlider } from "@/components/motion/range-slider-wave";
import { BubbleSlider } from "@/components/motion/range-slider-bubble";
import { RulerSlider } from "@/components/motion/range-slider-ruler";
export function InlineSliderPreview() {
  return (
    <div className="w-full max-w-sm">
      <InlineSlider
        defaultValue={48}
        min={8}
        max={128}
        step={8}
        label="Icon size"
        aria-label="Icon size"
        formatValueText={(value) => `${value} pixels`}
      />
    </div>
  );
}

export function RangeSliderPreview() {
  const [value, setValue] = useState(40);

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Drag the handle</span>
        <span className="tabular-nums text-foreground">{value}</span>
      </div>
      <RangeSlider value={value} onValueChange={setValue} step={5} aria-label="Value" />
    </div>
  );
}

export function RangeSliderFluidPreview() {
  const [value, setValue] = useState(35);

  return (
    <div className="w-full max-w-sm">
      <FluidSlider
        value={value}
        onValueChange={setValue}
        label="Brightness"
        aria-label="Brightness"
      />
    </div>
  );
}

export function RangeSliderWavePreview() {
  const [value, setValue] = useState(45);

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Gain</span>
        <span className="tabular-nums text-foreground">{value}</span>
      </div>
      <WaveSlider value={value} onValueChange={setValue} aria-label="Gain" />
    </div>
  );
}

export function RangeSliderBubblePreview() {
  const [value, setValue] = useState(28);

  return (
    <div className="flex w-full max-w-sm flex-col gap-1">
      <span className="text-sm text-muted-foreground">Drag fast and the bubble leans</span>
      <BubbleSlider value={value} onValueChange={setValue} aria-label="Value" />
    </div>
  );
}

export function RangeSliderRulerPreview() {
  const [value, setValue] = useState(72.5);

  return (
    <div className="w-full max-w-sm">
      <RulerSlider
        value={value}
        onValueChange={setValue}
        min={40}
        max={120}
        step={0.5}
        gap={12}
        majorEvery={10}
        unit="kg"
        aria-label="Weight"
      />
    </div>
  );
}

