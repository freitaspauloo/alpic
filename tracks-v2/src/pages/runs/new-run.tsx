import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FolderGit2, Play } from "lucide-react";
import { Page } from "@/app/page-layout";
import { RouterButtonLink } from "@/app/router-link";
import {
  Alert,
  AlertAction,
  AlertClose,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/motion/alert";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { StatefulButton, type ButtonState } from "@/components/motion/button/stateful";
import {
  CARD_TARGET_CLASS,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/motion/card";
import { Checkbox } from "@/components/motion/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/motion/combobox";
import { RadioGroup, RadioGroupItem } from "@/components/motion/radio";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/motion/select";
import { money, useOrgData, useStore } from "@/data";
import { cn } from "@/lib/utils";
import { HARNESS_MODELS, ONE_OFF_COST_CENTS, type Harness } from "./shared";

const NO_REPOSITORY = "none";
const EFFORTS = ["Low", "Medium", "High"] as const;
const HARNESSES: { value: Harness; description: string }[] = [
  { value: "Claude", description: "Anthropic's agent harness." },
  { value: "Codex", description: "OpenAI's agent harness." },
];

export function NewRun() {
  const { orgId, org, repositories } = useOrgData();
  const { createRun } = useStore();
  const navigate = useNavigate();
  const promptId = useId();

  const [prompt, setPrompt] = useState("");
  const [promptError, setPromptError] = useState<string | null>(null);
  const [harness, setHarness] = useState<Harness>("Claude");
  const [model, setModel] = useState<string>(HARNESS_MODELS.Claude[0]);
  const [effort, setEffort] = useState<string>("Medium");
  const [fast, setFast] = useState(false);
  const [repositoryId, setRepositoryId] = useState(repositories[0]?.id ?? NO_REPOSITORY);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<ButtonState>("idle");
  const timers = useRef<number[]>([]);
  // StatefulButton sizes its label on render; re-render once the web font has loaded so it isn't clipped.
  const [, setFontsReady] = useState(false);

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);
  useEffect(() => {
    let alive = true;
    void document.fonts?.ready.then(() => alive && setFontsReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const broke = !org || org.balanceCents <= 0;
  const blocked = Boolean(org?.blocked);
  const repository = repositories.find((item) => item.id === repositoryId);
  const balance = org?.balanceCents ?? 0;

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (state === "loading" || state === "success") return;
    if (!prompt.trim()) {
      setPromptError("Write the prompt the agent should work on.");
      return;
    }
    setError(null);
    setState("loading");
    later(() => {
      const result = createRun({
        orgId,
        experimentId: null,
        executionId: null,
        prompt: prompt.trim(),
        scenario: null,
        agent: harness,
        model,
        harness,
        repository: repository?.name ?? null,
      });
      if (!result.ok) {
        setError(result.error);
        setState("error");
        later(() => setState("idle"), 1600);
        return;
      }
      setState("success");
      later(() => navigate(`/${orgId}/runs/${result.runId}`), 350);
    }, 450);
  };

  return (
    <Page
      title="New run"
      description="Give one agent one prompt, outside any experiment. Nothing judges it."
    >
      <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-4">
          {broke ? (
            <Alert variant="warning">
              <AlertIcon />
              <AlertContent>
                <AlertTitle>Missing to start</AlertTitle>
                <AlertDescription>Your balance is $0. Add funds to start a run.</AlertDescription>
                <AlertAction>
                  <RouterButtonLink to={`/${orgId}/billing`} size="sm" variant="secondary">
                    Add funds
                  </RouterButtonLink>
                </AlertAction>
              </AlertContent>
            </Alert>
          ) : null}
          {blocked && !broke ? (
            <Alert variant="destructive">
              <AlertIcon />
              <AlertContent>
                <AlertTitle>Organization blocked</AlertTitle>
                <AlertDescription>New runs are refused until the organization is unblocked.</AlertDescription>
              </AlertContent>
            </Alert>
          ) : null}
          <Alert variant="destructive" open={Boolean(error)} onOpenChange={(open) => !open && setError(null)}>
            <AlertIcon />
            <AlertContent>
              <AlertTitle>Couldn't start the run</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </AlertContent>
            <AlertClose />
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle as="h2">This run</CardTitle>
              <CardDescription>What the agent should do, in plain language.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              <label htmlFor={promptId} className="px-1 text-sm font-medium text-foreground">
                Prompt
              </label>
              <textarea
                id={promptId}
                value={prompt}
                rows={6}
                autoFocus
                aria-invalid={promptError ? true : undefined}
                aria-describedby={promptError ? `${promptId}-error` : `${promptId}-hint`}
                placeholder="Walk through returning a shipped order and tell me where the flow breaks."
                onChange={(event) => {
                  setPrompt(event.target.value);
                  if (promptError) setPromptError(null);
                }}
                className={cn(
                  "min-h-32 w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring",
                  promptError && "border-destructive focus-visible:ring-destructive/25",
                )}
              />
              <div className="flex items-center justify-between gap-3 px-1 text-xs">
                {promptError ? (
                  <p id={`${promptId}-error`} role="alert" className="text-destructive">
                    {promptError}
                  </p>
                ) : (
                  <p id={`${promptId}-hint`} className="text-muted-foreground">
                    The agent sees exactly this text.
                  </p>
                )}
                <span className="tabular-nums text-muted-foreground">{prompt.trim().length} chars</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Agent</CardTitle>
              <CardDescription>The harness that drives the model, and how hard it tries.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <Field label="Harness">
                <RadioGroup
                  aria-label="Harness"
                  value={harness}
                  onValueChange={(next) => {
                    const value = next as Harness;
                    setHarness(value);
                    setModel(HARNESS_MODELS[value][0]);
                  }}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {HARNESSES.map((item) => (
                    <Card key={item.value} size="compact" interactive selected={harness === item.value}>
                      <CardContent>
                        <RadioGroupItem
                          value={item.value}
                          label={item.value}
                          description={item.description}
                          className={CARD_TARGET_CLASS}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </RadioGroup>
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Model">
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HARNESS_MODELS[harness].map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Effort">
                  <RadioGroup
                    aria-label="Effort"
                    orientation="horizontal"
                    value={effort}
                    onValueChange={setEffort}
                    className="h-10 items-center gap-5"
                  >
                    {EFFORTS.map((item) => (
                      <RadioGroupItem key={item} value={item} label={item} />
                    ))}
                  </RadioGroup>
                </Field>
              </div>

              <Checkbox
                checked={fast}
                onCheckedChange={setFast}
                label="Fast mode"
                description="Answers sooner, with less time spent checking its work."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Repository and agent tools</CardTitle>
              <CardDescription>
                Code the agent checks out before it starts.{" "}
                <Link
                  to={`/${orgId}/library/repositories`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Manage repositories
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Field label="Repository">
                <Combobox value={repositoryId} onValueChange={setRepositoryId}>
                  <ComboboxTrigger>
                    <ComboboxInput aria-label="Repository" placeholder="Find a repository…" />
                  </ComboboxTrigger>
                  <ComboboxContent>
                    <ComboboxList ariaLabel="Repositories">
                      <ComboboxGroup>
                        <ComboboxItem
                          value={NO_REPOSITORY}
                          textValue="No repository"
                          keywords={["none", "empty"]}
                        >
                          <span className="flex flex-col">
                            <span>No repository</span>
                            <span className="text-xs text-muted-foreground">
                              The run starts from an empty directory.
                            </span>
                          </span>
                        </ComboboxItem>
                      </ComboboxGroup>
                      <ComboboxGroup>
                        <ComboboxLabel>Repositories</ComboboxLabel>
                        {repositories.map((item) => (
                          <ComboboxItem
                            key={item.id}
                            value={item.id}
                            textValue={`${item.name}@${item.ref}`}
                            keywords={[item.url]}
                          >
                            <span className="flex items-center gap-2">
                              <FolderGit2 aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                              <span className="font-mono text-xs">
                                {item.name}
                                <span className="text-muted-foreground">@{item.ref}</span>
                              </span>
                            </span>
                          </ComboboxItem>
                        ))}
                      </ComboboxGroup>
                      <ComboboxEmpty>No repository matches.</ComboboxEmpty>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <Card size="compact">
            <CardHeader>
              <CardTitle as="h2">Summary</CardTitle>
              <CardDescription>One-off runs aren't judged.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col divide-y divide-border">
                <SummaryRow label="Agent">{harness}</SummaryRow>
                <SummaryRow label="Model">
                  <span className="font-mono text-xs">{model}</span>
                </SummaryRow>
                <SummaryRow label="Effort">
                  {effort}
                  {fast ? " · Fast" : ""}
                </SummaryRow>
                <SummaryRow label="Repository">
                  {repository ? (
                    <span className="font-mono text-xs">{repository.name}</span>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </SummaryRow>
              </dl>
            </CardContent>
          </Card>

          <Card size="compact" variant="muted">
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">Estimated cost</span>
                <span className="font-medium tabular-nums">{money(ONE_OFF_COST_CENTS)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">Balance after</span>
                {balance < ONE_OFF_COST_CENTS ? (
                  <span className="font-medium text-destructive">Not enough funds</span>
                ) : (
                  <span className="font-medium">
                    <AnimatedNumber
                      value={balance - ONE_OFF_COST_CENTS}
                      format={(cents) => money(Math.round(cents))}
                    />
                  </span>
                )}
              </div>
              <StatefulButton
                type="submit"
                state={state}
                disabled={broke || blocked}
                loadingText="Starting"
                successText="Started"
                errorText="Couldn't start"
                icon={<Play className="size-3.5" />}
                className="mt-1 w-full"
              >
                Start run
              </StatefulButton>
              <RouterButtonLink to={`/${orgId}/runs`} variant="ghost" size="sm" className="w-full">
                Cancel
              </RouterButtonLink>
            </CardContent>
          </Card>
        </aside>
      </form>
    </Page>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="px-1 text-sm font-medium text-foreground">{label}</span>
      {children}
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-foreground">{children}</dd>
    </div>
  );
}
