import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { TableColumn } from "@/components/motion/table";
import { money, passRate, useStore, type AgentSpec, type Execution, type Experiment, type Run, type Scenario } from "../store";
import {
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  nativeSelectClassName,
  Page,
  SimpleDataTable,
  Status,
  TextAreaField,
  FormShell,
  InlineAlert,
  TextField,
} from "../ui";

export function ExperimentDetail() {
  const { org = "", experimentId = "" } = useParams();
  const store = useStore();
  const experiment = store.experiments.find((item) => item.id === experimentId && item.orgId === org);
  const [error, setError] = useState<string | null>(null);
  const executions = experiment ? store.executions.filter((item) => item.experimentId === experiment.id) : [];
  const latest = executions[0];
  const latestRuns = latest ? store.runs.filter((item) => item.executionId === latest.id) : [];
  const rate = passRate(latestRuns);
  const repository = experiment ? store.repositories.find((item) => item.id === experiment.repositoryId) : undefined;

  const latestRunColumns = useMemo((): TableColumn<Run>[] => {
    return [
      {
        key: "run",
        header: "Run",
        cell: (run) => (
          <Link className="font-medium hover:underline" to={`/${org}/runs/${run.id}`}>
            {run.scenario ?? run.id}
          </Link>
        ),
      },
      {
        key: "variant",
        header: "Variant",
        cell: (run) => <span className="text-muted-foreground">{run.agent} · {run.model}</span>,
      },
      { key: "status", header: "Status", cell: (run) => <Status status={run.status} /> },
      {
        key: "cost",
        header: "Cost",
        align: "right",
        cell: (run) => <span className="tabular-nums">{money(run.costCents)}</span>,
      },
    ];
  }, [org]);

  const executionColumns = useMemo((): TableColumn<Execution>[] => {
    return [
      { key: "version", header: "Version", cell: (row) => `v${row.version}` },
      { key: "status", header: "Status", cell: (row) => <Status status={row.status} /> },
      { key: "started", header: "Started", cell: (row) => <span className="text-muted-foreground">{row.started}</span> },
      {
        key: "spend",
        header: "Spend",
        align: "right",
        cell: (row) => <span className="tabular-nums">{money(row.spendCents)}</span>,
      },
    ];
  }, []);

  if (!experiment) {
    return (
      <Page title="Experiment">
        <p className="text-muted-foreground">This experiment no longer exists.</p>
      </Page>
    );
  }

  return (
    <Page
      title={experiment.name}
      description={`Version ${experiment.version}`}
      action={
        <>
          <ButtonLink to={`/${org}/experiments/${experiment.id}/edit`} variant="secondary">
            Edit
          </ButtonLink>
          <Button
            type="button"
            onClick={() => {
              const message = store.launch(experiment.id);
              setError(message);
            }}
          >
            {latest ? "Launch latest" : "Launch"}
          </Button>
        </>
      }
    >
      {error ? (
        <InlineAlert variant="destructive">
          <strong>Missing to start</strong> {error}{" "}
          {error.includes("balance") || error.includes("funds") ? (
            <Link className="font-medium underline underline-offset-2" to={`/${org}/billing`}>
              Add funds
            </Link>
          ) : null}
        </InlineAlert>
      ) : null}
      <Card variant="outlined">
        <div className="plan">
          <div>
            <h2>Scenarios</h2>
            {experiment.scenarios.length === 0 ? (
              <p className="text-muted-foreground">No scenarios yet</p>
            ) : (
              <ol>
                {experiment.scenarios.map((scenario, index) => (
                  <li key={scenario.id}>
                    <span className="idx">{index + 1}</span>
                    <div>
                      <strong>{scenario.name}</strong>
                      <div className="subtle" style={{ marginTop: 4 }}>{scenario.prompt}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div>
            <h2>Agents</h2>
            {experiment.agents.length === 0 ? (
              <p className="text-muted-foreground">No agents yet</p>
            ) : (
              <ul className="stack">
                {experiment.agents.map((agent) => (
                  <li key={agent.id}>
                    <div>
                      <strong>{agent.name}</strong>
                      <div className="subtle">
                        {agent.harness} · {agent.model}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2>Experiment plan</h2>
            <p style={{ margin: 0 }}>{repository ? repository.name : "No repository"}</p>
            <p className="subtle">{repository ? repository.ref : "The run starts from an empty directory."}</p>
          </div>
        </div>
        <div className="meta-row">
          <div>
            <span>Runs per launch</span>
            <strong>{experiment.runsPerLaunch}</strong>
          </div>
          <div>
            <span>Maximum spend</span>
            <strong>{money(experiment.maxSpendCents)}</strong>
          </div>
        </div>
      </Card>

      <Card variant="outlined" className="mt-4">
        <CardContent className="flex flex-wrap items-start justify-between gap-4 pb-0">
          <div>
            <h2 className="text-base font-semibold">Latest result</h2>
            {!latest ? (
              <p className="text-sm text-muted-foreground">Not launched yet</p>
            ) : (
              <p className="text-sm text-muted-foreground">Last launched {latest.started}</p>
            )}
          </div>
          {latest ? (
            <div className="stats" style={{ minWidth: 280 }}>
              <div className="stat">
                <span>Status</span>
                <Status status={latest.status} />
              </div>
              <div className="stat">
                <span>Pass rate</span>
                <strong>{rate === null ? "—" : `${Math.round(rate * 100)}%`}</strong>
              </div>
              <div className="stat">
                <span>Total spend</span>
                <strong>{money(latest.spendCents)}</strong>
              </div>
            </div>
          ) : null}
        </CardContent>
        {latestRuns.length ? (
          <SimpleDataTable
            data={latestRuns}
            columns={latestRunColumns}
            getRowId={(run) => run.id}
            className="rounded-none border-0 border-t"
          />
        ) : null}
      </Card>

      {executions.length > 1 ? (
        <div className="mt-5 grid gap-3">
          <h2 className="text-base font-semibold">Earlier executions</h2>
          <SimpleDataTable data={executions.slice(1)} columns={executionColumns} getRowId={(row) => row.id} />
        </div>
      ) : null}
    </Page>
  );
}

export function ExperimentEdit() {
  const { org = "", experimentId = "" } = useParams();
  const store = useStore();
  const navigate = useNavigate();
  const source = store.experiments.find((item) => item.id === experimentId && item.orgId === org);
  const [draft, setDraft] = useState<Experiment | null>(source ? structuredClone(source) : null);
  if (!source || !draft) {
    return (
      <Page title="Edit experiment">
        <p className="muted">This experiment no longer exists.</p>
      </Page>
    );
  }

  function updateScenario(id: string, patch: Partial<Scenario>) {
    setDraft((current) =>
      current
        ? { ...current, scenarios: current.scenarios.map((item) => (item.id === id ? { ...item, ...patch } : item)) }
        : current,
    );
  }

  function updateAgent(id: string, patch: Partial<AgentSpec>) {
    setDraft((current) =>
      current ? { ...current, agents: current.agents.map((item) => (item.id === id ? { ...item, ...patch } : item)) } : current,
    );
  }

  return (
    <Page
      title="Edit experiment"
      description={draft.name}
      action={
        <Button
          type="button"
          onClick={() => {
            store.updateExperiment(draft);
            navigate(`/${org}/experiments/${draft.id}`);
          }}
        >
          Save
        </Button>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          store.updateExperiment(draft);
          navigate(`/${org}/experiments/${draft.id}`);
        }}
      >
        <FormShell className="max-w-3xl">
        <TextField id="name" label="Name" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
        <Card variant="outlined">
          <CardHeader>
            <CardTitle as="h2">Scenarios</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {draft.scenarios.map((scenario, index) => (
              <div key={scenario.id} className="grid gap-3">
                <TextField
                  id={`sc-${scenario.id}`}
                  label={`Scenario ${index + 1}`}
                  value={scenario.name}
                  onChange={(value) => updateScenario(scenario.id, { name: value })}
                />
                <TextAreaField
                  id={`sc-prompt-${scenario.id}`}
                  label={`${scenario.name} prompt`}
                  rows={3}
                  value={scenario.prompt}
                  onChange={(value) => updateScenario(scenario.id, { prompt: value })}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setDraft({
                  ...draft,
                  scenarios: [...draft.scenarios, { id: `sc_${Date.now()}`, name: `Scenario ${draft.scenarios.length + 1}`, prompt: "" }],
                })
              }
            >
              Add scenario
            </Button>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardHeader>
            <CardTitle as="h2">Agents</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {draft.agents.map((agent) => (
              <div key={agent.id} className="grid gap-3 md:grid-cols-2">
                <TextField id={`ag-${agent.id}`} label="Agent" value={agent.name} onChange={(value) => updateAgent(agent.id, { name: value })} />
                <TextField id={`model-${agent.id}`} label="Model" value={agent.model} onChange={(value) => updateAgent(agent.id, { model: value })} />
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setDraft({
                  ...draft,
                  agents: [...draft.agents, { id: `ag_${Date.now()}`, name: "Codex", model: "gpt-5", harness: "Codex" }],
                })
              }
            >
              Add agent
            </Button>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardHeader>
            <CardTitle as="h2">Repository and run settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Repository</span>
              <select
                id="repo"
                className={nativeSelectClassName}
                value={draft.repositoryId ?? ""}
                onChange={(event) => setDraft({ ...draft, repositoryId: event.target.value || null })}
              >
                <option value="">No repository</option>
                {store.repositories
                  .filter((item) => item.orgId === org)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
            <TextField
              id="spend"
              label="Maximum spend (USD)"
              value={(draft.maxSpendCents / 100).toFixed(2)}
              onChange={(value) => setDraft({ ...draft, maxSpendCents: Math.round(Number(value || 0) * 100) })}
            />
            <TextField
              id="runs"
              label="Runs per launch"
              type="number"
              value={String(draft.runsPerLaunch)}
              onChange={(value) => setDraft({ ...draft, runsPerLaunch: Number(value) })}
            />
          </CardContent>
        </Card>
        </FormShell>
      </form>
    </Page>
  );
}
