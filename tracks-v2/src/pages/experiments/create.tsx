import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Globe } from "lucide-react";
import { Button } from "@/components/motion/button/base";
import { Card, CARD_TARGET_CLASS } from "@/components/motion/card";
import {
  CenterMorphModal,
  CenterMorphModalClose,
  CenterMorphModalContent,
} from "@/components/motion/center-morph-modal";
import { Checkbox } from "@/components/motion/checkbox";
import { Input } from "@/components/motion/input";
import { SCENARIO_STARTERS, newId, useOrgData, useStore, type Scenario } from "@/data";
import { plural } from "./shared";

/** "From scratch": name it, then fill in scenarios and agents on the edit page. */
export function NewExperimentModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { createExperiment, setNotice } = useStore();
  const { orgId } = useOrgData();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setError(null);
    }
  }, [open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Name the experiment.");
      return;
    }
    const id = createExperiment(orgId, name, []);
    setNotice("Experiment created. Add its scenarios and agents.");
    onOpenChange(false);
    navigate(`/${orgId}/experiments/${id}/edit`);
  };

  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel="New experiment" className="max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-1 pr-8">
            <h2 className="text-lg font-semibold text-foreground">New experiment</h2>
            <p className="text-sm text-muted-foreground">From scratch. You’ll add scenarios and agents next.</p>
          </div>
          <Input
            label="Name"
            value={name}
            onChange={(value) => {
              setName(value);
              setError(null);
            }}
            placeholder="Untitled experiment"
            error={error ?? undefined}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <CenterMorphModalClose>
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
            </CenterMorphModalClose>
            <Button type="submit" size="sm">
              Create
            </Button>
          </div>
        </form>
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
}

const DEFAULT_HOST = "your-business.com";

function excerpt(text: string, max = 96) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** "From a document": pick starter questions about a website; each becomes one scenario. */
export function FromDocumentModal({
  open,
  onOpenChange,
  initialPicked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Starter labels to preselect, e.g. the chip the user clicked in the empty state. */
  initialPicked: string[];
}) {
  const { createExperiment, setNotice } = useStore();
  const { orgId } = useOrgData();
  const navigate = useNavigate();
  const [website, setWebsite] = useState("");
  const [picked, setPicked] = useState<string[]>(initialPicked);

  useEffect(() => {
    if (open) {
      setWebsite("");
      setPicked(initialPicked);
    }
    // Reset only when the modal opens, not whenever the parent passes a new array.
  }, [open]);

  const host = website.trim() || DEFAULT_HOST;
  const toggle = (label: string) =>
    setPicked((current) => (current.includes(label) ? current.filter((item) => item !== label) : [...current, label]));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const chosen = SCENARIO_STARTERS.filter((starter) => picked.includes(starter.label));
    if (!chosen.length) return;
    const scenarios: Scenario[] = chosen.map((starter) => ({
      id: newId("sc"),
      name: starter.name,
      prompt: starter.prompt.replaceAll("{website}", host),
    }));
    const id = createExperiment(orgId, chosen[0]?.name ?? "Untitled experiment", scenarios);
    setNotice(`Experiment created with ${plural(scenarios.length, "scenario")}.`);
    onOpenChange(false);
    navigate(`/${orgId}/experiments/${id}`);
  };

  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel="Import scenarios from a document" className="max-w-2xl">
        <form onSubmit={submit} className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-1 pr-8">
            <h2 className="text-lg font-semibold text-foreground">Import scenarios from a document</h2>
            <p className="text-sm text-muted-foreground">
              Pick the questions to ask about a website. Tracks writes one scenario for each.
            </p>
          </div>
          <Input
            label="Website"
            value={website}
            onChange={setWebsite}
            placeholder={DEFAULT_HOST}
            leftIcon={<Globe />}
            autoFocus
          />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 px-1 text-sm font-medium text-foreground">Questions</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {SCENARIO_STARTERS.map((starter) => {
                const selected = picked.includes(starter.label);
                return (
                  <Card key={starter.label} size="compact" interactive selected={selected} className="gap-0">
                    <div className="px-4">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggle(starter.label)}
                        label={starter.name}
                        description={excerpt(starter.prompt.replaceAll("{website}", host))}
                        className={CARD_TARGET_CLASS}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </fieldset>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {picked.length ? plural(picked.length, "scenario") : "Pick at least one question."}
            </p>
            <div className="flex gap-2">
              <CenterMorphModalClose>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
              </CenterMorphModalClose>
              <Button type="submit" size="sm" disabled={!picked.length}>
                Create experiment
              </Button>
            </div>
          </div>
        </form>
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
}
