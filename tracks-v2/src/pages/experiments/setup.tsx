import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, ChevronLeft, Copy, Pencil, Plus, Trash2, X, Zap } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MenuAction, MenuLabel } from "@/app/menu";
import {
  AdaptiveStepper,
  AdaptiveStepperDecrement,
  AdaptiveStepperIncrement,
  AdaptiveStepperValue,
} from "@/components/motion/adaptive-stepper";
import { Button } from "@/components/motion/button/base";
import { Checkbox } from "@/components/motion/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/motion/select";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Card } from "@/components/motion/card";
import { Collapsible, CollapsibleIndicator, CollapsibleTrigger } from "@/components/motion/collapsible";
import { Switch } from "@/components/motion/switch";
import { Input } from "@/components/motion/input";
import { MorphPopover, MorphPopoverContent, MorphPopoverTrigger } from "@/components/motion/popover-morph";
import {
  DEFAULT_AGENT,
  money,
  newId,
  useStore,
  type CommandLineTool,
  type McpServer,
  type Scenario,
  type Skill,
} from "@/data";
import { createScenario, scenarioPromptText, scenariosReady, type SetupEvaluation, type SetupScenario } from "./scenario-editor";
import { radiusSteps, useDesign } from "@/design/theme";
import { EASE_OUT } from "@/lib/ease";
import { useFavicon } from "@/lib/hooks/use-favicon";
import { cn } from "@/lib/utils";
import { HARNESS_CATALOG, PROVIDER_MARK, harnessesFor, modelsFor, type HarnessName, type Provider } from "@/pages/runs/shared";
import { ExperimentComposer, type ComposerDraft, type ComposerTools, type ToolCoverage } from "./composer";

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
  browser: boolean;
  /** Names of the tools the composer attached to this variant. */
  picked: string[];
};

const BASELINE_COPY = "Runs with no skill, MCP server or command-line tool, to compare the other agent tools against.";
const NONE = "none";

function createToolVariant(name: string, baseline = false): ToolVariant {
  return { id: newId("tv"), name, baseline, open: true, skillId: null, toolId: null, mcpId: null, browser: false, picked: [] };
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

function variantsFor(picks: ComposerTools, coverage: ToolCoverage, prev: ToolVariant[], picked: string[]): ToolVariant[] {
  const baselinePrev = prev.find((item) => item.baseline);
  const withPrev = prev.find((item) => !item.baseline);
  const baseline: ToolVariant = {
    ...(baselinePrev ?? createToolVariant("No agent tools", true)),
    baseline: true,
    skillId: null,
    toolId: null,
    mcpId: null,
    picked: [],
  };
  const withTools: ToolVariant = {
    ...(withPrev ?? createToolVariant(picked.length ? picked.join(", ") : "With tools")),
    name: picked.length ? picked.join(", ") : "With tools",
    baseline: false,
    skillId: picks.skillIds[0] ?? null,
    toolId: picks.cliIds[0] ?? null,
    mcpId: picks.mcpIds[0] ?? null,
    picked,
  };
  if (coverage === "without") return [baseline];
  if (coverage === "with") return [withTools];
  if (!picked.length) return [baseline];
  return [baseline, withTools];
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
  { id: "variants", label: "Variants" },
  { id: "run", label: "Run settings" },
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
  const [toolPicks, setToolPicks] = useState<ComposerTools>({ skillIds: [], mcpIds: [], cliIds: [] });
  const [coverage, setCoverage] = useState<ToolCoverage>("both");
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

  const commitTools = (picks: ComposerTools, nextCoverage: ToolCoverage) => {
    const picked = pickedNames(picks, skills, mcpServers, tools);
    const next = variantsFor(picks, nextCoverage, toolVariants, picked);
    setToolPicks(picks);
    setCoverage(nextCoverage);
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
    if (id === "scenario") return scenarioReady;
    if (id === "variants") return toolVariants.length > 0;
    if (id === "run") return spendReady;
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
      setStep(1);
      return;
    }
    if (!toolVariants.length) {
      setError("Add at least one agent tool variant.");
      setStep(1);
      return;
    }
    if (!spendReady) {
      setError("Enter a max spend, like 2.00.");
      setStep(3);
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
  return (
    <div className="flex flex-1 flex-col items-center px-6 pb-16 pt-16">
      <div className="flex w-[min(42rem,calc(100vw-8rem))] flex-col gap-4">
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
              onToolsChange={(next) => commitTools(next, coverage)}
              coverage={coverage}
              onCoverageChange={(next) => commitTools(toolPicks, next)}
            />
            <div className="flex flex-col items-start gap-2">
              {currentScenario?.evaluations.map((evaluation, evaluationIndex) => {
                const title = evaluation.name.trim() || `Evaluation ${evaluationIndex + 1}`;
                return (
                  <Collapsible
                    key={evaluation.id}
                    open={evaluation.open}
                    onOpenChange={(open) => updateEvaluation(evaluation.id, { open })}
                  >
                    <div className="flex w-full items-center gap-1">
                      <CollapsibleTrigger className="w-auto min-w-0 flex-1" aria-label={evaluation.open ? `Collapse ${title}` : `Expand ${title}`}>
                        <CollapsibleIndicator className="ml-0" />
                        <span className="shrink-0">{title}</span>
                        {evaluation.open ? null : (
                          <span className="min-w-0 flex-1 truncate font-normal text-muted-foreground">
                            {evaluation.instructions.trim() || "Judging instructions"}
                          </span>
                        )}
                      </CollapsibleTrigger>
                      <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${title}`} onClick={() => removeEvaluation(evaluation.id)}>
                        <X className="size-3.5" />
                      </Button>
                    </div>
                    {evaluation.open ? (
                      <div className="flex flex-col gap-3 px-3 pt-3 pb-1">
                        <Input
                          label="Name"
                          aria-label={`${title} name`}
                          value={evaluation.name}
                          placeholder={title}
                          onChange={(value) => updateEvaluation(evaluation.id, { name: value })}
                        />
                        <label className="flex flex-col gap-1.5">
                          <span className="px-1 text-sm font-medium text-foreground">Judging instructions</span>
                          <textarea
                            aria-label="Judging instructions"
                            rows={3}
                            value={evaluation.instructions}
                            placeholder="What the agent must do or say to pass."
                            onChange={(event) => updateEvaluation(evaluation.id, { instructions: event.target.value })}
                            className="min-h-20 w-full resize-y rounded-[var(--radius-lg)] border border-border bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </label>
                      </div>
                    ) : null}
                  </Collapsible>
                );
              })}
              <Button type="button" variant="ghost" size="sm" onClick={addEvaluation}>
                <Plus className="size-3.5" />
                Add evaluation
              </Button>
            </div>
            {error ? <p role="alert" className="px-2 text-xs text-destructive">{error}</p> : null}
          </div>
        ) : active.id === "variants" ? (
          <div className="mt-20 flex w-full flex-col gap-4">
            <AgentTools
              variants={toolVariants}
              skills={skills}
              tools={tools}
              mcpServers={mcpServers}
              onChange={(next) => {
                setToolVariants(next);
                syncSpend(included.length * next.length * repetition * scenarioCount);
              }}
            />
            <div className="flex items-center justify-between">
              <Button type="button" variant="ghost" size="sm" onClick={() => go(step - 1)}>
                Back
              </Button>
              <Button type="button" size="sm" disabled={!stepReady(step)} onClick={continueStep}>
                Continue
              </Button>
            </div>
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
              {active.id === "run" ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-foreground">Repetition</span>
                    <AdaptiveStepper
                      value={repetition}
                      min={1}
                      max={5}
                      aria-label="Repetition"
                      onValueChange={(value) => {
                        setRepetition(value);
                        syncSpend(included.length * Math.max(toolVariants.length, 0) * value * scenarioCount);
                      }}
                    >
                      <AdaptiveStepperDecrement />
                      <AdaptiveStepperValue />
                      <AdaptiveStepperIncrement />
                    </AdaptiveStepper>
                  </div>
                  <Input
                    label="Max spend"
                    value={spend}
                    onChange={(value) => {
                      setSpendTouched(true);
                      setSpend(value);
                    }}
                    placeholder="2.00"
                  />
                  <p className="text-xs text-muted-foreground">{meta}</p>
                </>
              ) : (
                <>
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
                </>
              )}
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
  );
}

function AgentTools({
  variants,
  skills,
  tools,
  mcpServers,
  onChange,
}: {
  variants: ToolVariant[];
  skills: Skill[];
  tools: CommandLineTool[];
  mcpServers: McpServer[];
  onChange: (next: ToolVariant[]) => void;
}) {
  const design = useDesign();
  const radius = Math.round(radiusSteps(design.radius).xl);
  const patch = (id: string, next: Partial<ToolVariant>) => {
    onChange(variants.map((item) => (item.id === id ? { ...item, ...next } : item)));
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-foreground">Agent tools</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...variants, createToolVariant(`Agent tools ${variants.length + 1}`)])}
        >
          <Plus className="size-3.5" />
          Add agent tools
        </Button>
      </div>
      {variants.map((variant) => (
        <Card key={variant.id} variant="outlined" size="compact" className="gap-3 py-3">
          <Collapsible open={variant.open} onOpenChange={(open) => patch(variant.id, { open })}>
            <div className="flex items-center gap-1 px-2">
              <CollapsibleTrigger className="w-auto min-w-0 flex-1 px-2" aria-label={variant.open ? `Collapse ${variant.name}` : `Expand ${variant.name}`}>
                <CollapsibleIndicator className="ml-0" />
                <span className="truncate">{variant.name}</span>
                {variant.baseline ? (
                  <AnimatedBadge status="neutral" size="sm" showIcon={false}>
                    Baseline
                  </AnimatedBadge>
                ) : null}
              </CollapsibleTrigger>
              <MorphPopover>
                <MorphPopoverTrigger>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Rename ${variant.name}`}>
                    <Pencil className="size-3.5" />
                  </Button>
                </MorphPopoverTrigger>
                <MorphPopoverContent side="bottom" align="end" sideOffset={8} radius={radius} className="w-64 p-3">
                  <Input label="Name" value={variant.name} onChange={(name) => patch(variant.id, { name })} />
                </MorphPopoverContent>
              </MorphPopover>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Duplicate ${variant.name}`}
                onClick={() => onChange([...variants, { ...variant, id: newId("tv"), name: `${variant.name} copy`, baseline: false, open: true }])}
              >
                <Copy className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${variant.name}`}
                onClick={() => onChange(variants.filter((item) => item.id !== variant.id))}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            {variant.open ? (
              <div className="flex flex-col gap-4 px-4 pt-3">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {variant.baseline
                    ? BASELINE_COPY
                    : variant.picked.length
                      ? `Runs with ${variant.picked.join(", ")}.`
                      : "Compared with the baseline, using the tools selected here."}
                </p>
                <ToolSelect
                  label="Skills"
                  value={variant.skillId}
                  empty="No skill"
                  options={skills.map((item) => ({ id: item.id, name: item.name }))}
                  onChange={(skillId) => patch(variant.id, { skillId })}
                />
                <ToolSelect
                  label="Command-line tools"
                  value={variant.toolId}
                  empty="No command-line tool"
                  options={tools.map((item) => ({ id: item.id, name: item.name }))}
                  onChange={(toolId) => patch(variant.id, { toolId })}
                />
                <ToolSelect
                  label="MCP servers"
                  value={variant.mcpId}
                  empty="No MCP server"
                  options={mcpServers.map((item) => ({ id: item.id, name: item.name }))}
                  onChange={(mcpId) => patch(variant.id, { mcpId })}
                />
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">Browser</span>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2">
                    <span className="text-sm text-muted-foreground">Headless Chromium, for agents without their own</span>
                    <Switch checked={variant.browser} onCheckedChange={(browser) => patch(variant.id, { browser })} ariaLabel="Headless Chromium" />
                  </div>
                </div>
              </div>
            ) : null}
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}

function ToolSelect({
  label,
  value,
  empty,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  empty: string;
  options: { id: string; name: string }[];
  onChange: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <Select value={value ?? NONE} onValueChange={(next) => onChange(next === NONE ? null : next)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{empty}</SelectItem>
          {options.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
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
        <MorphPopover open={openId === agent.id} onOpenChange={(open) => { if (open) setStep("model"); onOpen(open ? agent.id : null); }}>
          <MorphPopoverTrigger>
            <Button type="button" variant="outline" size="sm" aria-label={agentTitle(agent)} className="h-8 gap-1.5 rounded-full pr-8 pl-2.5">
              <ProviderLogo provider={agent.provider} />
              {agent.fast ? <Zap className="size-3.5" aria-hidden="true" /> : null}
              <span className="max-w-36 truncate font-mono font-normal text-muted-foreground">{agent.model}</span>
            </Button>
          </MorphPopoverTrigger>
          <MorphPopoverContent side="bottom" align="start" sideOffset={8} radius={radius} className="flex w-96 flex-col gap-3 p-3">
            <AgentFields value={agent} step={step} onStep={setStep} onChange={(next) => onChange(agent.id, next)} />
          </MorphPopoverContent>
        </MorphPopover>
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
    <MorphPopover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraft(agentChoice("Anthropic"));
          setStep("harness");
        }
        setOpen(next);
      }}
    >
      <MorphPopoverTrigger>
        <Button type="button" variant="ghost" size="sm">
          <Plus className="size-3.5" />
          Add agent
        </Button>
      </MorphPopoverTrigger>
      <MorphPopoverContent side="bottom" align="start" sideOffset={8} radius={radius} className="flex w-96 flex-col gap-3 p-3">
        <AgentFields value={draft} step={step} onStep={setStep} onChange={setDraft} />
        {step === "model" ? (
          <Button type="button" size="sm" onClick={() => { onAdd(draft); setOpen(false); }}>
            Add
          </Button>
        ) : null}
      </MorphPopoverContent>
    </MorphPopover>
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
                  "flex min-w-0 flex-col items-start gap-1 rounded-lg px-2.5 py-2 text-left outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                  selected && "bg-muted",
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
