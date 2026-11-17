import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { TableColumn } from "@/components/motion/table";
import { money, useStore, type Run, type RunStatus } from "../store";
import { Checkbox } from "@/components/motion/checkbox";
import {
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormShell,
  InlineAlert,
  MenuButton,
  nativeSelectClassName,
  Page,
  SimpleDataTable,
  Status,
  TextAreaField,
} from "../ui";

const outcomes: Array<RunStatus | "Any outcome"> = ["Any outcome", "Passed", "Failed", "Running", "Judging", "Canceled"];

export function Runs() {
  const { org = "" } = useParams();
  const store = useStore();
  const [outcome, setOutcome] = useState<(typeof outcomes)[number]>("Any outcome");
  const [agent, setAgent] = useState("Any agent");
  const [experiment, setExperiment] = useState("Any experiment");
  const experiments = store.experiments.filter((item) => item.orgId === org);
  const agents = [...new Set(store.runs.filter((item) => item.orgId === org).map((item) => item.agent))];
  const runs = store.runs.filter((run) => {
    if (run.orgId !== org) return false;
    if (outcome !== "Any outcome" && run.status !== outcome) return false;
    if (agent !== "Any agent" && run.agent !== agent) return false;
    if (experiment === "One-off" && run.experimentId) return false;
    if (experiment !== "Any experiment" && experiment !== "One-off" && run.experimentId !== experiment) return false;
    return true;
  });

  const columns = useMemo((): TableColumn<Run>[] => {
    return [
      {
        key: "run",
        header: "Run",
        sortable: true,
        sortValue: (run) => run.scenario ?? run.prompt,
        cell: (run) => {
          const parent = experiments.find((item) => item.id === run.experimentId);
          return (
            <div className="min-w-0">
              <Link className="font-medium text-foreground hover:underline" to={`/${org}/runs/${run.id}`}>
                {run.scenario ?? run.prompt.slice(0, 48)}
              </Link>
              <div className="text-xs text-muted-foreground">{parent?.name ?? "One-off"}</div>
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        cell: (run) => <Status status={run.status} />,
      },
      {
        key: "variant",
        header: "Variant",
        cell: (run) => (
          <div className="text-muted-foreground">
            {run.agent}
            <div className="text-xs text-muted-foreground/80">{run.model}</div>
          </div>
        ),
      },
      {
        key: "cost",
        header: "Cost",
        align: "right",
        sortable: true,
        sortValue: (run) => run.costCents,
        cell: (run) => <span className="tabular-nums">{money(run.costCents)}</span>,
      },
      {
        key: "duration",
        header: "Duration",
        align: "right",
        cell: (run) => <span className="tabular-nums text-muted-foreground">{run.duration}</span>,
      },
      {
        key: "started",
        header: "Started",
        cell: (run) => <span className="text-muted-foreground">{run.started}</span>,
      },
    ];
  }, [experiments, org]);

  return (
    <Page
      title="Runs"
      description="Every agent attempt, from an experiment or on its own."
      action={<ButtonLink to={`/${org}/runs/new`}>New run</ButtonLink>}
    >
      <div className="mb-3 flex flex-wrap gap-3">
        <label className="grid w-44 gap-1">
          <span className="text-xs text-muted-foreground">Outcome</span>
          <select
            className={nativeSelectClassName}
            aria-label="Outcome"
            value={outcome}
            onChange={(event) => setOutcome(event.target.value as (typeof outcomes)[number])}
          >
            {outcomes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="grid w-44 gap-1">
          <span className="text-xs text-muted-foreground">Agent</span>
          <select className={nativeSelectClassName} aria-label="Agent" value={agent} onChange={(event) => setAgent(event.target.value)}>
            <option>Any agent</option>
            {agents.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="grid w-52 gap-1">
          <span className="text-xs text-muted-foreground">Experiment</span>
          <select className={nativeSelectClassName} aria-label="Experiment" value={experiment} onChange={(event) => setExperiment(event.target.value)}>
            <option value="Any experiment">Any experiment</option>
            <option value="One-off">Outside an experiment</option>
            {experiments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {runs.length === 0 ? (
        <Card variant="outlined">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">No runs match these filters.</CardContent>
        </Card>
      ) : (
        <SimpleDataTable data={runs} columns={columns} getRowId={(run) => run.id} emptyState="No runs" />
      )}
    </Page>
  );
}

export function RunDetail() {
  const { org = "", runId = "" } = useParams();
  const store = useStore();
  const run = store.runs.find((item) => item.id === runId && item.orgId === org);
  const [copied, setCopied] = useState(false);
  if (!run) {
    return (
      <Page title="Run">
        <p className="text-muted-foreground">This run no longer exists.</p>
      </Page>
    );
  }
  const experiment = store.experiments.find((item) => item.id === run.experimentId);
  return (
    <Page
      title={run.scenario ?? "One-off run"}
      description={experiment ? experiment.name : "Outside any experiment. Nothing judges it."}
      action={<Status status={run.status} />}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="outlined">
          <CardHeader>
            <CardTitle as="h2">Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{run.prompt}</p>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardHeader>
            <CardTitle as="h2">Evidence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{run.evidence}</p>
          </CardContent>
        </Card>
      </div>
      <Card variant="outlined" className="mt-4">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Agent", run.agent],
              ["Harness", run.harness],
              ["Model", run.model],
              ["Repository", run.repository ?? "No repository"],
              ["Cost", money(run.costCents)],
              ["Duration", run.duration],
              ["Started", run.started],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="grid gap-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <strong className="text-sm">{value}</strong>
            </div>
          ))}
          <div className="grid gap-1 sm:col-span-2">
            <span className="text-xs text-muted-foreground">Run id</span>
            <div className="flex flex-wrap items-center gap-2">
              <strong className="font-mono text-sm">{run.id}</strong>
              <MenuButton
                onClick={() => {
                  void navigator.clipboard.writeText(run.id);
                  setCopied(true);
                }}
              >
                {copied ? "Run id copied." : "Copy run id"}
              </MenuButton>
            </div>
          </div>
        </CardContent>
      </Card>
    </Page>
  );
}

export function NewRun() {
  const { org = "" } = useParams();
  const store = useStore();
  const navigate = useNavigate();
  const organization = store.organizations.find((item) => item.id === org);
  const repos = store.repositories.filter((item) => item.orgId === org);
  const [prompt, setPrompt] = useState("");
  const [agent, setAgent] = useState("Claude");
  const [model, setModel] = useState("claude-sonnet-5.5");
  const [harness, setHarness] = useState("Claude");
  const [effort, setEffort] = useState("Medium");
  const [fast, setFast] = useState(false);
  const [repositoryId, setRepositoryId] = useState(repos[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const broke = !organization || organization.balanceCents <= 0;

  const models = useMemo(
    () => ({
      Claude: ["claude-sonnet-5.5", "claude-opus-5.5", "claude-fable-5.1", "claude-haiku-5.5"],
      Codex: ["gpt-6-astra", "gpt-6.1-sol", "gpt-6.1-terra", "gpt-6-sol", "gpt-6-luna"],
    }),
    [],
  );

  return (
    <Page title="New run" description="Give one agent one prompt, outside any experiment. Nothing judges it.">
      {broke ? (
        <InlineAlert>
          <strong>Missing to start</strong> Your balance is $0. Add funds to start a run.{" "}
          <Link className="font-medium underline underline-offset-2" to={`/${org}/billing`}>
            Add funds
          </Link>
        </InlineAlert>
      ) : null}
      {error ? <InlineAlert variant="destructive">{error}</InlineAlert> : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const repository = repos.find((item) => item.id === repositoryId);
          const result = store.createRun({
            orgId: org,
            experimentId: null,
            executionId: null,
            prompt,
            scenario: null,
            agent,
            model,
            harness,
            repository: repository?.name ?? null,
          });
          if (!result || result.includes(" ")) {
            setError(result);
            return;
          }
          navigate(`/${org}/runs/${result}`);
        }}
      >
        <FormShell className="max-w-3xl">
          <Card variant="outlined">
            <CardHeader>
              <CardTitle as="h2">This run</CardTitle>
            </CardHeader>
            <CardContent>
              <TextAreaField id="prompt" label="Prompt" rows={5} required value={prompt} onChange={setPrompt} />
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardHeader>
              <CardTitle as="h2">Agent</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium">Harness</span>
                <select
                  id="harness"
                  className={nativeSelectClassName}
                  value={harness}
                  onChange={(event) => {
                    const next = event.target.value;
                    setHarness(next);
                    setAgent(next);
                    setModel(models[next as "Claude" | "Codex"][0]);
                  }}
                >
                  <option>Claude</option>
                  <option>Codex</option>
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium">Model</span>
                <select id="model" className={nativeSelectClassName} value={model} onChange={(event) => setModel(event.target.value)}>
                  {models[harness as "Claude" | "Codex"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium">Effort</span>
                <select id="effort" className={nativeSelectClassName} value={effort} onChange={(event) => setEffort(event.target.value)}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>
              <Checkbox checked={fast} onCheckedChange={setFast} label="Fast mode" className="self-end pb-1" />
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardHeader>
              <CardTitle as="h2">Repository and agent tools</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium">Repository</span>
                <select id="repository" className={nativeSelectClassName} value={repositoryId} onChange={(event) => setRepositoryId(event.target.value)}>
                  <option value="">No repository: the run starts from an empty directory</option>
                  {repos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}@{item.ref}
                    </option>
                  ))}
                </select>
              </label>
            </CardContent>
          </Card>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={broke || !prompt.trim()}>
              Start run
            </Button>
          </div>
        </FormShell>
      </form>
    </Page>
  );
}
