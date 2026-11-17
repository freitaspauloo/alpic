import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/motion/radio";
export function RadioPreview() {
  const [plan, setPlan] = useState("pro");

  return (
    <RadioGroup value={plan} onValueChange={setPlan} className="min-w-48">
      <RadioGroupItem value="starter" label="Starter, free" />
      <RadioGroupItem value="pro" label="Pro, $12/mo" />
      <RadioGroupItem value="team" label="Team, $29/mo" />
      <RadioGroupItem value="legacy" label="Legacy plan" disabled />
    </RadioGroup>
  );
}

export function RadioDescriptionPreview() {
  const [schedule, setSchedule] = useState("once");

  return (
    <RadioGroup value={schedule} onValueChange={setSchedule} className="w-full max-w-64">
      <RadioGroupItem
        value="once"
        label="Run once"
        description="Runs a single time, right now."
      />
      <RadioGroupItem
        value="schedule"
        label="Run on a schedule"
        description="Repeats on a set interval until stopped."
      />
      <RadioGroupItem
        value="trigger"
        label="Run on a trigger"
        description="Waits for an event before it starts."
      />
      <RadioGroupItem
        value="manual"
        label="Manual approval"
        description="Not available on your plan."
        disabled
      />
    </RadioGroup>
  );
}

