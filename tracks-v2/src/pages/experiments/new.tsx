import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Globe } from "lucide-react";
import { Page } from "@/app/page-layout";
import { RouterButtonLink } from "@/app/router-link";
import { Button } from "@/components/motion/button/base";
import { CARD_TARGET_CLASS, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/motion/card";
import { Input } from "@/components/motion/input";
import { RadioGroup, RadioGroupItem } from "@/components/motion/radio";
import { DEFAULT_AGENT, SCENARIO_STARTERS, newId, useOrgData, useStore, type Scenario } from "@/data";
import { cn } from "@/lib/utils";

const DEFAULT_HOST = "acme.com";

function scenarioTitle(prompt: string, starterName: string | null) {
  if (starterName) return starterName;
  const line = prompt.trim().split(/[.\n]/)[0]?.trim() ?? "";
  if (!line) return "Untitled experiment";
  return line.length > 48 ? `${line.slice(0, 48).trimEnd()}…` : line;
}

export function NewExperimentPage() {
  const { orgId } = useOrgData();
  const { createExperiment, setNotice } = useStore();
  const navigate = useNavigate();
  const promptId = useId();
  const [host, setHost] = useState("");
  const [prompt, setPrompt] = useState("");
  const [starterLabel, setStarterLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const product = host.trim() || DEFAULT_HOST;
  const starter = SCENARIO_STARTERS.find((item) => item.label === starterLabel) ?? null;

  const chooseStarter = (label: string) => {
    const next = SCENARIO_STARTERS.find((item) => item.label === label);
    if (!next) return;
    setStarterLabel(label);
    setPrompt(next.prompt.replaceAll("{website}", product));
    setError(null);
  };

  const onHost = (value: string) => {
    const nextHost = value.trim() || DEFAULT_HOST;
    setHost(value);
    if (starter) setPrompt(starter.prompt.replaceAll("{website}", nextHost));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = prompt.trim();
    if (!text) {
      setError("Describe what the agent should do.");
      return;
    }
    const scenario: Scenario = {
      id: newId("sc"),
      name: scenarioTitle(text, starter?.name ?? null),
      prompt: text,
    };
    const id = createExperiment(orgId, scenario.name, [scenario]);
    setNotice("Experiment created. Claude will run this scenario.");
    navigate(`/${orgId}/experiments/${id}`);
  };

  return (
    <Page
      title="New experiment"
      description="Describe one thing an agent should be able to do in your product. Tracks writes it as a scenario and runs Claude against it."
    >
      <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Product</CardTitle>
              <CardDescription>The site the agent has to use.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                label="Website"
                value={host}
                onChange={onHost}
                placeholder={DEFAULT_HOST}
                leftIcon={<Globe />}
                autoFocus
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Scenario</CardTitle>
              <CardDescription>What the agent should do, in plain language. This is the only scenario.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              <label htmlFor={promptId} className="px-1 text-sm font-medium text-foreground">
                Prompt
              </label>
              <textarea
                id={promptId}
                value={prompt}
                rows={6}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${promptId}-error` : `${promptId}-hint`}
                placeholder={`Find the published prices on ${product}, including any mandatory fees.`}
                onChange={(event) => {
                  setPrompt(event.target.value);
                  setStarterLabel("");
                  if (error) setError(null);
                }}
                className={cn(
                  "min-h-32 w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring",
                  error && "border-destructive focus-visible:ring-destructive/25",
                )}
              />
              {error ? (
                <p id={`${promptId}-error`} role="alert" className="px-1 text-xs text-destructive">
                  {error}
                </p>
              ) : (
                <p id={`${promptId}-hint`} className="px-1 text-xs text-muted-foreground">
                  Claude sees exactly this text.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Or start from a question</CardTitle>
              <CardDescription>Tracks fills the prompt for {product}. You can still edit it.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                aria-label="Starter question"
                value={starterLabel}
                onValueChange={chooseStarter}
                className="grid gap-3 sm:grid-cols-2"
              >
                {SCENARIO_STARTERS.map((item) => (
                  <Card key={item.label} size="compact" interactive selected={starterLabel === item.label}>
                    <CardContent>
                      <RadioGroupItem value={item.label} label={item.name} className={CARD_TARGET_CLASS} />
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <Card size="compact" variant="muted">
            <CardHeader>
              <CardTitle as="h2">This experiment</CardTitle>
              <CardDescription>One scenario, judged when you launch it.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <dl className="flex flex-col divide-y divide-border text-sm">
                <div className="flex items-baseline justify-between gap-3 py-2 first:pt-0">
                  <dt className="text-muted-foreground">Product</dt>
                  <dd className="truncate font-mono text-xs">{product}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="text-muted-foreground">Scenario</dt>
                  <dd className="truncate">{starter?.name ?? "Custom"}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2 last:pb-0">
                  <dt className="text-muted-foreground">Agent</dt>
                  <dd>
                    {DEFAULT_AGENT.name}
                    <span className="text-muted-foreground"> · {DEFAULT_AGENT.model}</span>
                  </dd>
                </div>
              </dl>
              <Button type="submit" className="mt-1 w-full">
                Start experiment
              </Button>
              <RouterButtonLink to={`/${orgId}/experiments`} variant="ghost" size="sm" className="w-full">
                Cancel
              </RouterButtonLink>
            </CardContent>
          </Card>
        </aside>
      </form>
    </Page>
  );
}
