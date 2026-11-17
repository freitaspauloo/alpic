import { useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, ChevronLeft, Minus, Plus, X, Zap } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MenuAction, MenuLabel, menuSurface } from "@/app/menu";
import { Button } from "@/components/motion/button/base";
import { Checkbox } from "@/components/motion/checkbox";
import { Input } from "@/components/motion/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/motion/popover";
import {
  DEFAULT_AGENT,
  money,
  newId,
  useStore,
  type Scenario,
} from "@/data";
import { createScenario, scenarioPromptText, scenariosReady, type SetupEvaluation, type SetupScenario } from "./scenario-editor";
import { radiusSteps, useDesign } from "@/design/theme";
import { EASE_OUT } from "@/lib/ease";
import { useFavicon } from "@/lib/hooks/use-favicon";
import { cn } from "@/lib/utils";
import { HARNESS_CATALOG, PROVIDER_MARK, harnessesFor, modelsFor, type HarnessName, type Provider } from "@/pages/runs/shared";
import { ExperimentComposer, type ComposerDraft, type ComposerTools } from "./composer";

type AgentChoice = { provider: Provider; harness: HarnessName; model: string; fast: boolean };
type SetupAgent = AgentChoice & { id: string };
type ToolVariant = {
  id: string;
  name: string;
  baseline: boolean;
  open: boolean;
  skillId: string | null;
  toolId: string | null;
  mcpId: string | null;
  /** Names of the tools the composer attached to this variant. */
  picked: string[];
};

function createToolVariant(name: string, baseline = false): ToolVariant {
  return { id: newId("tv"), name, baseline, open: true, skillId: null, toolId: null, mcpId: null, picked: [] };
}

function pickedNames(
  picks: ComposerTools,
  skills: { id: string; name: string }[],
  mcpServers: { id: string; name: string }[],
  cli: { id: string; name: string }[],
) {
  const nameOf = (list: { id: string; name: string }[], id: string) => list.find((item) => item.id === id)?.name;
  return [
    ...picks.skillIds.map((id) => nameOf(skills, id)),
    ...picks.mcpIds.map((id) => nameOf(mcpServers, id)),
    ...picks.cliIds.map((id) => nameOf(cli, id)),
  ].filter((item): item is string => Boolean(item));
}

function variantsFor(picks: ComposerTools, prev: ToolVariant[], picked: string[]): ToolVariant[] {
  const current = prev[0];
  if (!picked.length) {
    return [{
      ...(current ?? createToolVariant("No agent tools", true)),
      name: "No agent tools",
      baseline: true,
      skillId: null,
      toolId: null,
      mcpId: null,
      picked: [],
    }];
  }
  return [{
    ...(current ?? createToolVariant(picked.join(", "))),
    name: picked.join(", "),
    baseline: false,
    skillId: picks.skillIds[0] ?? null,
    toolId: picks.cliIds[0] ?? null,
    mcpId: picks.mcpIds[0] ?? null,
    picked,
  }];
}

function agentChoice(provider: Provider, harness?: HarnessName, model?: string, fast = false): AgentChoice {
  const options = harnessesFor(provider);
  const next = options.find((item) => item.name === harness) ?? options[0];
  const models = next.models as readonly string[];
  const nextModel = model && models.includes(model) ? model : models[0];
  return { provider, harness: next.name, model: nextModel, fast };
}

function createAgent(harness: HarnessName = "Claude Code"): SetupAgent {
  const provider = HARNESS_CATALOG.find((item) => item.name === harness)?.provider ?? "Anthropic";
  return { id: newId("ag"), ...agentChoice(provider, harness) };
}

function agentTitle(agent: SetupAgent) {
  return agent.fast ? `${agent.harness} Fast` : agent.harness;
}

function ProviderLogo({ provider }: { provider: Provider }) {
  const favicon = useFavicon(PROVIDER_MARK[provider]);
  if (!favicon.src) return <Bot className="size-4" />;
  return (
    <img
      ref={favicon.ref}
      src={favicon.src}
      alt=""
      width={16}
      height={16}
      referrerPolicy="no-referrer"
      className="size-4 rounded-sm object-contain"
    />
  );
}

const STEPS = [
  { id: "scenario", label: "Scenario" },
  { id: "review", label: "Review" },
] as const;

const CENTS_PER_RUN = 100;

export function ExperimentSetup({ orgId, initial }: { orgId: string; initial?: ComposerDraft }) {
  const navigate = useNavigate();
  const { repositories: allRepositories, skills: allSkills, mcpServers: allMcp, tools: allTools, createExperiment, updateExperiment, launch, setNotice } = useStore();
  const repositories = allRepositories.filter((item) => item.orgId === orgId);
  const skills = allSkills.filter((item) => item.orgId === orgId);
  const mcpServers = allMcp.filter((item) => item.orgId === orgId);
  const tools = allTools.filter((item) => item.orgId === orgId);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [host, setHost] = useState(initial?.host ?? "");
  const [repositoryId, setRepositoryId] = useState<string | null>(initial?.repositoryId ?? null);
  const [branch, setBranch] = useState(initial?.branch ?? "");
  const [scenarios, setScenarios] = useState<SetupScenario[]>(() => [
    createScenario(1, {
      name: initial?.scenarioName ?? "Scenario 1",
      prompt: initial?.prompt ?? "",
    }),
  ]);
  const scenarioIndex = 0;
  const [roster, setRoster] = useState<SetupAgent[]>(() => {
    const named = initial?.agentName === "Claude" ? "Claude Code" : initial?.agentName;
    const harness = HARNESS_CATALOG.find((item) => item.name === named)?.name ?? "Claude Code";
    return [createAgent(harness)];
  });
  const [openAgent, setOpenAgent] = useState<string | null>(null);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [toolVariants, setToolVariants] = useState<ToolVariant[]>(() => [createToolVariant("No agent tools", true)]);
  const [toolPicks, setToolPicks] = useState<ComposerTools>({ skillIds: [], mcpIds: [], cliIds: [], browser: false });
  const [repetition, setRepetition] = useState(1);
  const [spend, setSpend] = useState("1.00");
  const [spendTouched, setSpendTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const product = host.trim() || "acme.com";
  const repository = repositories.find((item) => item.id === repositoryId) ?? null;
  const variants = roster.map((agent) => ({
    key: agent.id,
    agent,
    included: !excluded.includes(agent.id),
  }));
  const included = variants.filter((item) => item.included);
  const scenarioCount = Math.max(scenarios.length, 1);
  const totalRuns = Math.max(included.length, 0) * Math.max(toolVariants.length, 0) * repetition * scenarioCount;
  const suggestedCents = totalRuns * CENTS_PER_RUN;
  const scenarioReady = scenariosReady(scenarios);
  const currentScenario = scenarios[scenarioIndex] ?? scenarios[0];
  const spendDollars = Number(spend.replace(/[$,\s]/g, ""));
  const spendReady = spend.trim().length > 0 && Number.isFinite(spendDollars) && spendDollars >= 0;
  const reduce = useReducedMotion();

  const summary = useMemo(
    () => ({
      name: name.trim() || currentScenario?.name.trim() || "Untitled experiment",
      product,
      repository: repository?.name ?? "No repository",
      scenarios: scenarios.map((item, index) => item.name.trim() || `Scenario ${index + 1}`),
      agents: roster.map((item) => `${item.harness} · ${item.model}${item.fast ? " · Fast" : ""}`),
      tools: toolVariants.map((item) => item.name.trim() || "Agent tools"),
      evaluations: scenarios.flatMap((item) => item.evaluations.map((evaluation, index) => evaluation.name.trim() || `Evaluation ${index + 1}`)),
      files: scenarios.flatMap((item) => item.files),
      runs: totalRuns,
      spend: money(suggestedCents),
    }),
    [name, currentScenario, product, repository, scenarios, roster, toolVariants, totalRuns, suggestedCents],
  );

  const syncSpend = (runs: number) => {
    if (!spendTouched) setSpend((runs * CENTS_PER_RUN / 100).toFixed(2));
  };

  const commitTools = (picks: ComposerTools) => {
    const picked = [
      ...pickedNames(picks, skills, mcpServers, tools),
      ...(picks.browser ? ["Headless Chromium"] : []),
    ];
    const next = variantsFor(picks, toolVariants, picked);
    setToolPicks(picks);
    setToolVariants(next);
    syncSpend(included.length * next.length * repetition * scenarioCount);
  };

  const updateAgent = (id: string, patch: Partial<AgentChoice>) => {
    setRoster((current) => current.map((agent) => {
      if (agent.id !== id) return agent;
      const provider = patch.provider ?? agent.provider;
      return { ...agent, ...agentChoice(provider, patch.harness ?? agent.harness, patch.model ?? agent.model, patch.fast ?? agent.fast) };
    }));
  };

  const addAgent = (choice: AgentChoice) => {
    setRoster((current) => {
      const next = [...current, { id: newId("ag"), ...choice }];
      syncSpend(next.filter((agent) => !excluded.includes(agent.id)).length * Math.max(toolVariants.length, 0) * repetition * scenarioCount);
      return next;
    });
  };

  const removeAgent = (id: string) => {
    setRoster((current) => {
      const next = current.filter((agent) => agent.id !== id);
      syncSpend(next.filter((agent) => !excluded.includes(agent.id)).length * Math.max(toolVariants.length, 0) * repetition * scenarioCount);
      return next;
    });
    setExcluded((current) => current.filter((item) => item !== id));
    if (openAgent === id) setOpenAgent(null);
  };

  const onDraft = (next: ComposerDraft) => {
    setHost(next.host);
    setRepositoryId(next.repositoryId);
    setBranch(next.branch ?? "");
    setScenarios((current) => current.map((item, itemIndex) => itemIndex === scenarioIndex
      ? { ...item, name: next.scenarioName, prompt: next.prompt }
      : item));
    if (error) setError(null);
  };

  const updateEvaluation = (id: string, patch: Partial<SetupEvaluation>) => {
    setScenarios((current) => current.map((item, itemIndex) => itemIndex === scenarioIndex
      ? { ...item, evaluations: item.evaluations.map((evaluation) => evaluation.id === id ? { ...evaluation, ...patch } : evaluation) }
      : item));
  };

  const addEvaluation = () => {
    const evaluation: SetupEvaluation = { id: newId("ev"), name: "", instructions: "", weight: 1, open: true };
    setScenarios((current) => current.map((item, itemIndex) => itemIndex === scenarioIndex
      ? { ...item, evaluations: [...item.evaluations, evaluation] }
      : item));
  };

  const removeEvaluation = (id: string) => {
    setScenarios((current) => current.map((item, itemIndex) => itemIndex === scenarioIndex
      ? { ...item, evaluations: item.evaluations.filter((evaluation) => evaluation.id !== id) }
      : item));
  };

  const stepReady = (index: number) => {
    const id = STEPS[index]?.id;
    if (id === "scenario") return scenarioReady && spendReady;
    return true;
  };

  const go = (index: number) => {
    if (index < 0 || index >= STEPS.length) return;
    setError(null);
    setStep(index);
  };

  const continueStep = () => {
    if (!stepReady(step) || step >= STEPS.length - 1) return;
    setError(null);
    setStep(step + 1);
  };

  const canLaunch = STEPS.every((_, index) => stepReady(index));

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!canLaunch) return;
    if (!scenarioReady) {
      setError("Every scenario needs a prompt, and every evaluation needs judging instructions.");
      setStep(0);
      return;
    }
    if (!roster.length) {
      setError("Pick at least one agent.");
      setStep(0);
      return;
    }
    if (!spendReady) {
      setError("Enter a max spend, like 2.00.");
      setStep(0);
      return;
    }

    const stored: Scenario[] = scenarios.map((item, itemIndex) => ({
      id: item.id,
      name: item.name.trim() || `Scenario ${itemIndex + 1}`,
      prompt: scenarioPromptText(item),
    }));
    const experimentId = createExperiment(orgId, summary.name, stored, {
      agent: {
        name: agentTitle(included[0].agent),
        model: included[0].agent.model,
        harness: included[0].agent.harness,
      },
      repositoryId,
    });
    updateExperiment({
      id: experimentId,
      orgId,
      name: summary.name,
      scenarios: stored,
      agents: included.map((variant) => ({
        id: variant.agent.id,
        name: agentTitle(variant.agent),
        model: variant.agent.model,
        harness: variant.agent.harness,
      })),
      repositoryId,
      runsPerLaunch: totalRuns,
      maxSpendCents: Math.round(spendDollars * 100),
      version: 1,
    });
    const result = launch(experimentId);
    if (!result.ok) {
      setNotice(result.error);
      navigate(`/${orgId}/experiments/${experimentId}`);
      return;
    }
    navigate(`/${orgId}/experiments/${experimentId}`);
  };

  const draft: ComposerDraft = {
    host,
    repositoryId,
    branch,
    scenarioName: currentScenario?.name ?? "Scenario 1",
    prompt: currentScenario?.prompt ?? "",
    agentName: roster[0]?.harness ?? DEFAULT_AGENT.name,
  };
  const meta = `${totalRuns} ${totalRuns === 1 ? "run" : "runs"} · ${money(Math.round((spendReady ? spendDollars : 0) * 100))} max · ${money(CENTS_PER_RUN)} a run`;
  const active = STEPS[step];
  const setRepetitionCount = (value: number) => {
    const next = Math.max(1, value);
    setRepetition(next);
    syncSpend(included.length * Math.max(toolVariants.length, 0) * next * scenarioCount);
  };
  return (
    <div className="flex min-h-full flex-1 flex-col">
    <div className="flex flex-1 flex-col items-center px-6 pt-16">
      <div className="flex w-full max-w-[42rem] flex-col gap-4 pb-8">
        <nav aria-label="Setup steps" className="flex w-full items-start">
          {STEPS.map((item, index) => {
            const current = index === step;
            const done = index < step;
            return (
              <div key={item.id} className="relative flex flex-1 justify-center">
                <button
                  type="button"
                  aria-current={current ? "step" : undefined}
                  onClick={() => go(index)}
                  className="relative z-10 flex flex-col items-center gap-2.5 rounded-[var(--radius-md)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-[var(--radius-md)] text-sm font-medium tabular-nums transition-colors",
                      current && "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-3 ring-offset-background",
                      done && "bg-primary text-primary-foreground",
                      !current && !done && "bg-muted text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className={cn("text-center text-sm font-medium whitespace-nowrap", current || done ? "text-foreground" : "text-muted-foreground")}>
                    {item.label}
                  </span>
                </button>
                {index < STEPS.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-4 right-[calc(-50%+18px)] left-[calc(50%+18px)] h-0.5 -translate-y-1/2 rounded-sm",
                      done ? "bg-primary" : "bg-muted",
                    )}
                  />
                ) : null}
              </div>
            );
          })}
        </nav>

        {active.id === "scenario" ? (
          <div className="mt-20 flex flex-col gap-4">
            <AgentBar
              roster={roster}
              openId={openAgent}
              onOpen={setOpenAgent}
              onChange={updateAgent}
              onAdd={addAgent}
              onRemove={removeAgent}
            />
            <ExperimentComposer
              orgId={orgId}
              value={draft}
              onChange={onDraft}
              onContinue={() => submit()}
              actionLabel="Launch"
              canSubmit={canLaunch}
              showAgent={false}
              source
              promptPlaceholder="Starting message"
              tools={toolPicks}
              onToolsChange={commitTools}
            />
            <div className="flex w-full flex-col gap-2">
              {currentScenario?.evaluations.map((evaluation, evaluationIndex) => (
                <EvaluationLine
                  key={evaluation.id}
                  evaluation={evaluation}
                  index={evaluationIndex}
                  onChange={(patch) => updateEvaluation(evaluation.id, patch)}
                  onRemove={() => removeEvaluation(evaluation.id)}
                />
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={addEvaluation}>
                <Plus className="size-3.5" />
                Add evaluation
              </Button>
            </div>
            {error ? <p role="alert" className="px-2 text-xs text-destructive">{error}</p> : null}
          </div>
        ) : (
        <section aria-labelledby="setup-step-title" className="rounded-[var(--radius-2xl)] bg-card p-4">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="setup-step-title" className="text-sm font-medium text-foreground">
              {active.label}
            </h2>
            <span className="text-xs tabular-nums text-muted-foreground">
              {step + 1} / {STEPS.length}
            </span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.id}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: EASE_OUT }}
              className="flex flex-col gap-3"
            >
              <Input label="Experiment" value={name} onChange={setName} placeholder="Untitled experiment" />
              <dl className="grid gap-3 text-sm">
                <ReviewRow label="Product" value={summary.product} />
                <ReviewRow label="Repository" value={summary.repository} />
                <ReviewRow label="Branch" value={branch.trim() || repository?.ref || "None"} />
                <ReviewRow label="Scenarios" value={summary.scenarios.join(", ") || "None"} />
                <ReviewRow label="Agents" value={summary.agents.join(", ") || "None"} />
                <ReviewRow label="Agent tools" value={summary.tools.join(", ") || "None"} />
                <ReviewRow label="Evaluations" value={summary.evaluations.join(", ") || "None"} />
                <ReviewRow label="Files" value={summary.files.join(", ") || "None"} />
                <ReviewRow label="Runs" value={String(summary.runs)} />
                <ReviewRow label="Max spend" value={money(Math.round((spendReady ? spendDollars : 0) * 100))} />
              </dl>
            </motion.div>
          </AnimatePresence>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" size="sm" disabled={step === 0} onClick={() => go(step - 1)}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" size="sm" disabled={!stepReady(step)} onClick={continueStep}>
                Continue
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">{canLaunch ? "Ready to launch" : "Launch stays off until this is complete."}</span>
            )}
          </div>
        </section>
        )}
      </div>
    </div>
    {active.id === "scenario" ? (
      <div className="@container sticky bottom-0 z-20 mt-auto border-t border-border bg-background/95 px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
        <div
          className="mx-auto flex h-12 w-full max-w-[42rem] flex-wrap items-center gap-x-3 gap-y-2"
          style={{ paddingRight: "max(0px, calc(4.5rem - (100cqw - min(42rem, 100cqw)) / 2))" }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-sm text-muted-foreground">Repetition</span>
            <div className="flex h-8 items-center rounded-[var(--radius-control)] border border-border focus-within:border-foreground/40 focus-within:ring-2 focus-within:ring-ring/40">
              <button
                type="button"
                aria-label="Decrease repetition"
                disabled={repetition <= 1}
                onClick={() => setRepetitionCount(repetition - 1)}
                className="flex size-8 items-center justify-center text-muted-foreground outline-none disabled:opacity-40"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="min-w-4 text-center text-sm tabular-nums text-foreground">{repetition}</span>
              <button
                type="button"
                aria-label="Increase repetition"
                onClick={() => setRepetitionCount(repetition + 1)}
                className="flex size-8 items-center justify-center text-muted-foreground outline-none disabled:opacity-40"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>
          <Input
            label="Max spend"
            aria-label="Max spend"
            value={spend}
            onChange={(value) => {
              setSpendTouched(true);
              setSpend(value);
            }}
            placeholder="2.00"
            className="w-36 max-w-full"
            classNames={{
              root: "flex-row items-center gap-2",
              label: "shrink-0 px-0 font-normal text-muted-foreground",
              field: "h-8 min-w-0 flex-1",
              input: "text-sm leading-5",
            }}
          />
          <p className="min-w-0 text-xs text-muted-foreground sm:ml-auto">{meta}</p>
        </div>
      </div>
    ) : null}
    </div>
  );
}

const INSTRUCTIONS_MAX = 128;

function fitInstructions(field: HTMLTextAreaElement) {
  field.style.height = "auto";
  field.style.height = `${Math.min(field.scrollHeight, INSTRUCTIONS_MAX)}px`;
}

function EvaluationLine({
  evaluation,
  index,
  onChange,
  onRemove,
}: {
  evaluation: SetupEvaluation;
  index: number;
  onChange: (patch: Partial<SetupEvaluation>) => void;
  onRemove: () => void;
}) {
  const title = evaluation.name.trim() || `Evaluation ${index + 1}`;
  const instructions = evaluation.instructions.trim();
  const [nameOpen, setNameOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  return (
    <div className="flex w-full items-start gap-1">
      {nameOpen ? (
        <input
          autoFocus
          aria-label={`${title} name`}
          value={evaluation.name}
          placeholder={title}
          onChange={(event) => onChange({ name: event.target.value })}
          onBlur={() => setNameOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
          className="h-8 w-36 shrink-0 bg-transparent px-1 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      ) : (
        <button type="button" onClick={() => setNameOpen(true)} className="flex h-8 shrink-0 items-center px-1 text-left text-sm font-medium text-foreground">
          {title}
        </button>
      )}
      {instructionsOpen ? (
        <InstructionsField
          value={evaluation.instructions}
          onChange={(next) => onChange({ instructions: next })}
          onClose={() => setInstructionsOpen(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setInstructionsOpen(true)}
          className={cn(
            "max-h-32 min-h-8 min-w-0 flex-1 overflow-y-auto px-1 py-1.5 text-left text-sm leading-5 whitespace-pre-wrap",
            instructions ? "text-foreground" : "text-muted-foreground/60",
          )}
        >
          {instructions || "Judging instructions"}
        </button>
      )}
      <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${title}`} onClick={onRemove}>
        <X className="size-3.5" />
      </Button>
    </div>
  );
}

function InstructionsField({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  const field = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    fitInstructions(el);
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);
  return (
    <textarea
      ref={field}
      aria-label="Judging instructions"
      rows={1}
      value={value}
      placeholder="Judging instructions"
      onChange={(event) => {
        onChange(event.target.value);
        fitInstructions(event.currentTarget);
      }}
      onBlur={onClose}
      className="max-h-32 min-h-8 w-full min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-1.5 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground/60"
    />
  );
}

function AgentBar({
  roster,
  openId,
  onOpen,
  onChange,
  onAdd,
  onRemove,
}: {
  roster: SetupAgent[];
  openId: string | null;
  onOpen: (id: string | null) => void;
  onChange: (id: string, patch: Partial<SetupAgent>) => void;
  onAdd: (choice: AgentChoice) => void;
  onRemove: (id: string) => void;
}) {
  const design = useDesign();
  const radius = Math.round(radiusSteps(design.radius).xl);
  const [step, setStep] = useState<AgentStep>("model");
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {roster.map((agent) => (
        <div key={agent.id} className="relative inline-flex max-w-full">
        <Popover open={openId === agent.id} onOpenChange={(open) => { if (open) setStep("model"); onOpen(open ? agent.id : null); }} side="bottom" align="start" panelRadius={radius}>
          <PopoverTrigger>
            <Button type="button" variant="outline" size="sm" aria-label={agentTitle(agent)} className="h-8 gap-1.5 rounded-full pr-8 pl-2.5">
              <ProviderLogo provider={agent.provider} />
              {agent.fast ? <Zap className="size-3.5" aria-hidden="true" /> : null}
              <span className="max-w-36 truncate font-mono font-normal text-muted-foreground">{agent.model}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className={cn("flex w-96 max-w-none flex-col gap-3 p-3", menuSurface)}>
            <AgentFields value={agent} step={step} onStep={setStep} onChange={(next) => onChange(agent.id, next)} />
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Remove ${agentTitle(agent)}`}
          onClick={() => onRemove(agent.id)}
          className="absolute top-1/2 right-1 size-6 -translate-y-1/2 rounded-full"
        >
          <X className="size-3.5" />
        </Button>
        </div>
      ))}
      <AddAgent radius={radius} onAdd={onAdd} />
    </div>
  );
}

type AgentStep = "harness" | "model";

function AddAgent({ radius, onAdd }: { radius: number; onAdd: (choice: AgentChoice) => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<AgentStep>("harness");
  const [draft, setDraft] = useState<AgentChoice>(() => agentChoice("Anthropic"));
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraft(agentChoice("Anthropic"));
          setStep("harness");
        }
        setOpen(next);
      }}
      side="bottom"
      align="start"
      panelRadius={radius}
    >
      <PopoverTrigger>
        <Button type="button" variant="ghost" size="sm">
          <Plus className="size-3.5" />
          Add agent
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("flex w-96 max-w-none flex-col gap-3 p-3", menuSurface)}>
        <AgentFields value={draft} step={step} onStep={setStep} onChange={setDraft} />
        {step === "model" ? (
          <Button type="button" size="sm" onClick={() => { onAdd(draft); setOpen(false); }}>
            Add
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function AgentFields({
  value,
  step,
  onStep,
  onChange,
}: {
  value: AgentChoice;
  step: AgentStep;
  onStep: (step: AgentStep) => void;
  onChange: (next: AgentChoice) => void;
}) {
  const models = modelsFor(value.provider, value.harness);
  if (step === "harness") {
    return (
      <div className="flex flex-col">
        <MenuLabel>Provider</MenuLabel>
        <div role="listbox" aria-label="Provider" className="grid grid-cols-2 gap-1">
          {HARNESS_CATALOG.map((item) => {
            const selected = item.name === value.harness;
            return (
              <button
                key={item.name}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(agentChoice(item.provider, item.name, value.model, value.fast));
                  onStep("model");
                }}
                className={cn(
                  "flex min-w-0 flex-col items-start gap-1 rounded-lg px-2.5 py-2 text-left outline-none transition-colors hover:bg-muted focus-visible:bg-muted",
                  selected ? "bg-muted text-foreground" : "text-muted-foreground",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <ProviderLogo provider={item.provider} />
                  <span className="text-sm text-foreground">{item.name}</span>
                </span>
                <span className="text-xs leading-4 text-muted-foreground">{item.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <>
      <Button type="button" variant="ghost" size="sm" aria-label="Back to harness" onClick={() => onStep("harness")} className="self-start px-2">
        <ChevronLeft className="size-3.5" />
        {value.harness}
      </Button>
      <div className="flex flex-col gap-1">
        <MenuLabel>Model</MenuLabel>
        {models.map((model) => (
          <MenuAction
            key={model}
            active={value.model === model}
            trailing={value.fast && value.model === model ? <Zap className="size-3.5" aria-hidden="true" /> : null}
            onSelect={() => onChange({ ...value, model })}
          >
            <span className="font-mono">{model}</span>
          </MenuAction>
        ))}
      </div>
      <Checkbox
        checked={value.fast}
        onCheckedChange={(fast) => onChange({ ...value, fast })}
        label="Fast"
        className="px-2.5"
      />
    </>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 border-b border-border pb-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
