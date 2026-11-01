import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bot, DollarSign, Plus, Trash2 } from "lucide-react";
import { Page } from "@/app/page-layout";
import { RouterButtonLink } from "@/app/router-link";
import { Button } from "@/components/motion/button/base";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/motion/card";
import { Input } from "@/components/motion/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/motion/select";
import { Tooltip } from "@/components/motion/tooltip";
import {
  AGENT_PRESETS,
  newId,
  useOrgData,
  useStore,
  type AgentSpec,
  type Experiment,
  type Scenario,
} from "@/data";
import { MissingExperiment } from "./detail";
import { EmptyCard, plural } from "./shared";

const NO_REPOSITORY = "none";
const HARNESSES: string[] = Array.from(new Set(AGENT_PRESETS.map((preset) => preset.harness)));

type Errors = Partial<Record<"name" | "spend" | "runs", string>>;

export function ExperimentEditPage() {
  const { experimentId = "" } = useParams();
  const { orgId, experiments } = useOrgData();
  const source = experiments.find((item) => item.id === experimentId);
  if (!source) return <MissingExperiment orgId={orgId} title="Edit experiment" />;
  return <EditForm key={source.id} source={source} />;
}

function EditForm({ source }: { source: Experiment }) {
  const { orgId, repositories } = useOrgData();
  const { updateExperiment } = useStore();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Experiment>(() => structuredClone(source));
  const [spend, setSpend] = useState((source.maxSpendCents / 100).toFixed(2));
  const [runs, setRuns] = useState(String(source.runsPerLaunch));
  const [errors, setErrors] = useState<Errors>({});
  const detailPath = `/${orgId}/experiments/${source.id}`;

  const patch = (next: Partial<Experiment>) => setDraft((current) => ({ ...current, ...next }));
  const updateScenario = (id: string, next: Partial<Scenario>) =>
    setDraft((current) => ({
      ...current,
      scenarios: current.scenarios.map((item) => (item.id === id ? { ...item, ...next } : item)),
    }));
  const updateAgent = (id: string, next: Partial<AgentSpec>) =>
    setDraft((current) => ({
      ...current,
      agents: current.agents.map((item) => (item.id === id ? { ...item, ...next } : item)),
    }));

  const addScenario = () =>
    setDraft((current) => ({
      ...current,
      scenarios: [
        ...current.scenarios,
        { id: newId("sc"), name: `Scenario ${current.scenarios.length + 1}`, prompt: "" },
      ],
    }));
  const addAgent = () => {
    const preset = AGENT_PRESETS[AGENT_PRESETS.length - 1];
    setDraft((current) => ({ ...current, agents: [...current.agents, { id: newId("ag"), ...preset }] }));
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    const next: Errors = {};
    const dollars = Number(spend.replace(/[$,\s]/g, ""));
    const count = Number(runs);
    if (!draft.name.trim()) next.name = "Name the experiment.";
    if (!spend.trim() || !Number.isFinite(dollars) || dollars < 0) next.spend = "Enter an amount in dollars, like 20.00.";
    if (!Number.isInteger(count) || count < 1) next.runs = "Use a whole number of at least 1.";
    setErrors(next);
    if (Object.keys(next).length) return;
    updateExperiment({
      ...draft,
      name: draft.name.trim(),
      maxSpendCents: Math.round(dollars * 100),
      runsPerLaunch: count,
    });
    navigate(detailPath);
  };

  return (
    <Page
      title="Edit experiment"
      description={draft.name.trim() || "Untitled experiment"}
      width="narrow"
      actions={
        <>
          <RouterButtonLink to={detailPath} variant="ghost" size="sm">
            Cancel
          </RouterButtonLink>
          <Button type="submit" form="experiment-form" size="sm">
            Save
          </Button>
        </>
      }
    >
      <form id="experiment-form" onSubmit={save} noValidate className="flex flex-col gap-6">
        <Input
          label="Name"
          value={draft.name}
          onChange={(value) => {
            patch({ name: value });
            setErrors((current) => ({ ...current, name: undefined }));
          }}
          placeholder="Untitled experiment"
          error={errors.name}
        />

        <Card>
          <CardHeader>
            <CardTitle as="h2">Scenarios</CardTitle>
            <CardDescription>
              Each scenario is one prompt the agents work through. {plural(draft.scenarios.length, "scenario")}.
            </CardDescription>
            <CardAction>
              <Button variant="secondary" size="sm" onClick={addScenario}>
                <Plus aria-hidden="true" className="size-3.5" />
                Add scenario
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {draft.scenarios.length === 0 ? (
              <EmptyCard>No scenarios yet</EmptyCard>
            ) : (
              draft.scenarios.map((scenario, index) => (
                <div key={scenario.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4">
                  <div className="flex items-end gap-2">
                    <Input
                      label={`Scenario ${index + 1}`}
                      value={scenario.name}
                      onChange={(value) => updateScenario(scenario.id, { name: value })}
                      className="min-w-0 flex-1"
                    />
                    <Tooltip content="Remove scenario">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${scenario.name || `scenario ${index + 1}`}`}
                        className="mb-1.5"
                        onClick={() =>
                          patch({ scenarios: draft.scenarios.filter((item) => item.id !== scenario.id) })
                        }
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </Button>
                    </Tooltip>
                  </div>
                  <label className="flex flex-col gap-1.5">
                    <span className="px-1 text-sm font-medium text-foreground">
                      {scenario.name.trim() || `Scenario ${index + 1}`} prompt
                    </span>
                    <textarea
                      rows={3}
                      value={scenario.prompt}
                      onChange={(event) => updateScenario(scenario.id, { prompt: event.target.value })}
                      placeholder="Describe what the agent should do and what counts as done."
                      className="min-h-24 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Agents</CardTitle>
            <CardDescription>Every agent runs each scenario, so you can compare variants.</CardDescription>
            <CardAction>
              <Button variant="secondary" size="sm" onClick={addAgent}>
                <Plus aria-hidden="true" className="size-3.5" />
                Add agent
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {draft.agents.length === 0 ? (
              <EmptyCard>No agents yet</EmptyCard>
            ) : (
              draft.agents.map((agent) => (
                <div
                  key={agent.id}
                  className="grid items-end gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_auto]"
                >
                  <Input
                    label="Agent"
                    value={agent.name}
                    onChange={(value) => updateAgent(agent.id, { name: value })}
                    leftIcon={<Bot />}
                  />
                  <Input
                    label="Model"
                    value={agent.model}
                    onChange={(value) => updateAgent(agent.id, { model: value })}
                  />
                  <div role="group" aria-label={`${agent.name || "Agent"} harness`} className="flex flex-col gap-1.5">
                    <span aria-hidden="true" className="px-1 text-sm font-medium text-foreground">
                      Harness
                    </span>
                    <Select value={agent.harness} onValueChange={(value) => updateAgent(agent.id, { harness: value })}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(HARNESSES.includes(agent.harness) ? HARNESSES : [...HARNESSES, agent.harness]).map((harness) => (
                          <SelectItem key={harness} value={harness}>
                            {harness}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Tooltip content="Remove agent">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${agent.name || "agent"}`}
                      className="mb-1.5"
                      onClick={() => patch({ agents: draft.agents.filter((item) => item.id !== agent.id) })}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </Button>
                  </Tooltip>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Repository and run settings</CardTitle>
            <CardDescription>What each run checks out, and how much one launch may spend.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div role="group" aria-label="Repository" className="flex flex-col gap-1.5 sm:col-span-2">
              <span aria-hidden="true" className="px-1 text-sm font-medium text-foreground">
                Repository
              </span>
              <Select
                value={draft.repositoryId ?? NO_REPOSITORY}
                onValueChange={(value) => patch({ repositoryId: value === NO_REPOSITORY ? null : value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_REPOSITORY}>No repository</SelectItem>
                  {repositories.map((repository) => (
                    <SelectItem key={repository.id} value={repository.id}>
                      {repository.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="px-1 text-xs text-muted-foreground">
                {draft.repositoryId
                  ? `Runs check out ${repositories.find((item) => item.id === draft.repositoryId)?.ref ?? "the default branch"}.`
                  : "The run starts from an empty directory."}
              </p>
            </div>
            <Input
              label="Maximum spend (USD)"
              value={spend}
              onChange={(value) => {
                setSpend(value);
                setErrors((current) => ({ ...current, spend: undefined }));
              }}
              inputMode="decimal"
              leftIcon={<DollarSign />}
              error={errors.spend}
            />
            <Input
              label="Runs per launch"
              type="number"
              min={1}
              value={runs}
              onChange={(value) => {
                setRuns(value);
                setErrors((current) => ({ ...current, runs: undefined }));
              }}
              error={errors.runs}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <RouterButtonLink to={detailPath} variant="ghost" size="sm">
            Cancel
          </RouterButtonLink>
          <Button type="submit" size="sm">
            Save
          </Button>
        </div>
      </form>
    </Page>
  );
}
