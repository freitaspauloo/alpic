import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Bot, FolderGit2, History, ListChecks, ListOrdered, Pencil, Play, Wallet } from "lucide-react";
import { Page } from "@/app/page-layout";
import { RouterButtonLink } from "@/app/router-link";
import { LineChart, LineChartPlot, LineChartTooltip } from "@/components/charts/line-chart";
import { Sparkline } from "@/components/charts/sparkline";
import { Alert, AlertAction, AlertClose, AlertContent, AlertDescription, AlertIcon, AlertTitle } from "@/components/motion/alert";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { StatefulButton, type ButtonState } from "@/components/motion/button/stateful";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/motion/card";
import { Table, type TableColumn } from "@/components/motion/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { money, percent, useOrgData, useStore, type Experiment, type Run } from "@/data";
import {
  EmptyCard,
  executionBadge,
  ExperimentMenu,
  needsFunds,
  plural,
  rateTrend,
  RemoveExperimentModal,
  runBadge,
  useExperimentHistory,
  useRemoveDialog,
  type ExecutionSummary,
} from "./shared";

const ROW_HEIGHT = 52;

function tableHeight(rows: number) {
  return ROW_HEIGHT * (Math.min(Math.max(rows, 1), 10) + 1) + 2;
}

export function ExperimentDetailPage() {
  const { experimentId = "" } = useParams();
  const { orgId, experiments } = useOrgData();
  const experiment = experiments.find((item) => item.id === experimentId);
  if (!experiment) return <MissingExperiment orgId={orgId} />;
  return <Detail key={experiment.id} experiment={experiment} />;
}

export function MissingExperiment({ orgId, title = "Experiment" }: { orgId: string; title?: string }) {
  return (
    <Page title={title}>
      <EmptyCard>
        <p>This experiment no longer exists.</p>
        <RouterButtonLink to={`/${orgId}/experiments`} size="sm">
          Back to experiments
        </RouterButtonLink>
      </EmptyCard>
    </Page>
  );
}

function Detail({ experiment }: { experiment: Experiment }) {
  const { orgId, repositories } = useOrgData();
  const { launch, duplicateExperiment } = useStore();
  const navigate = useNavigate();
  const history = useExperimentHistory(experiment.id);
  const remove = useRemoveDialog();
  const [error, setError] = useState<string | null>(null);
  const [launchState, setLaunchState] = useState<ButtonState>("idle");
  const [tab, setTab] = useState("results");
  const latest = history[0];
  const repository = repositories.find((item) => item.id === experiment.repositoryId);

  useEffect(() => {
    if (launchState === "idle") return;
    const timer = setTimeout(() => setLaunchState("idle"), 1600);
    return () => clearTimeout(timer);
  }, [launchState]);

  const start = () => {
    const result = launch(experiment.id);
    if (!result.ok) {
      setError(result.error);
      setLaunchState("error");
      return;
    }
    setError(null);
    setLaunchState("success");
    setTab("results");
  };

  return (
    <Page
      title={experiment.name}
      description={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>Version {experiment.version}</span>
          <span aria-hidden="true">·</span>
          <span>{plural(experiment.scenarios.length, "scenario")}</span>
          <span aria-hidden="true">·</span>
          <span>{plural(experiment.agents.length, "agent")}</span>
        </span>
      }
      actions={
        <>
          <ExperimentMenu
            experiment={experiment}
            onDuplicate={() => {
              const copyId = duplicateExperiment(experiment.id);
              if (copyId) navigate(`/${orgId}/experiments/${copyId}`);
            }}
            onRemove={() => remove.ask(experiment)}
          />
          <RouterButtonLink to={`/${orgId}/experiments/${experiment.id}/edit`} variant="secondary" size="sm">
            <Pencil aria-hidden="true" className="size-3.5" />
            Edit
          </RouterButtonLink>
          <StatefulButton
            size="sm"
            state={launchState}
            successText="Launched"
            errorText="Can’t launch"
            icon={<Play aria-hidden="true" className="size-3.5" />}
            onClick={start}
          >
            {latest ? "Launch latest" : "Launch"}
          </StatefulButton>
        </>
      }
    >
      {error ? (
        <Alert
          variant="destructive"
          onOpenChange={(open) => {
            if (!open) setError(null);
          }}
        >
          <AlertIcon />
          <AlertContent>
            <AlertTitle>Missing to start</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            {needsFunds(error) ? (
              <AlertAction>
                <RouterButtonLink to={`/${orgId}/billing`} variant="secondary" size="sm">
                  <Wallet aria-hidden="true" className="size-3.5" />
                  Add funds
                </RouterButtonLink>
              </AlertAction>
            ) : null}
          </AlertContent>
          <AlertClose />
        </Alert>
      ) : null}

      <Stats experiment={experiment} history={history} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Tabs value={tab} onValueChange={setTab} variant="underline" className="min-w-0">
          <TabsList>
            <TabsTrigger value="results" icon={<ListChecks className="size-4" />}>
              Latest result
            </TabsTrigger>
            <TabsTrigger value="scenarios" icon={<ListOrdered className="size-4" />}>
              Scenarios <Count value={experiment.scenarios.length} />
            </TabsTrigger>
            <TabsTrigger value="agents" icon={<Bot className="size-4" />}>
              Agents <Count value={experiment.agents.length} />
            </TabsTrigger>
            <TabsTrigger value="history" icon={<History className="size-4" />}>
              Executions <Count value={history.length} />
            </TabsTrigger>
          </TabsList>
          <TabsContent value="results">
            <LatestResult orgId={orgId} latest={latest} onLaunch={start} />
          </TabsContent>
          <TabsContent value="scenarios">
            <Scenarios orgId={orgId} experiment={experiment} />
          </TabsContent>
          <TabsContent value="agents">
            <Agents orgId={orgId} experiment={experiment} />
          </TabsContent>
          <TabsContent value="history">
            <Executions history={history} />
          </TabsContent>
        </Tabs>

        <Card size="compact" className="lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle as="h2">Experiment plan</CardTitle>
            <CardAction>
              <RouterButtonLink to={`/${orgId}/experiments/${experiment.id}/edit`} variant="ghost" size="sm">
                Edit
              </RouterButtonLink>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <FolderGit2 aria-hidden="true" className="size-4" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-foreground">{repository ? repository.name : "No repository"}</span>
                <span className="text-xs text-muted-foreground">
                  {repository ? (
                    <span className="font-mono">{repository.ref}</span>
                  ) : (
                    "The run starts from an empty directory."
                  )}
                </span>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
              <div className="flex flex-col gap-0.5 bg-background px-3 py-2.5">
                <dt className="text-xs text-muted-foreground">Runs per launch</dt>
                <dd className="font-medium tabular-nums text-foreground">{experiment.runsPerLaunch}</dd>
              </div>
              <div className="flex flex-col gap-0.5 bg-background px-3 py-2.5">
                <dt className="text-xs text-muted-foreground">Maximum spend</dt>
                <dd className="font-medium tabular-nums text-foreground">{money(experiment.maxSpendCents)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <RemoveExperimentModal
        experiment={remove.target}
        open={remove.open}
        onOpenChange={remove.setOpen}
        onRemoved={() => navigate(`/${orgId}/experiments`)}
      />
    </Page>
  );
}

function Count({ value }: { value: number }) {
  return <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">{value}</span>;
}

function Stats({ experiment, history }: { experiment: Experiment; history: ExecutionSummary[] }) {
  const latest = history[0];
  const trend = rateTrend(history);
  const judgedLaunches = trend.filter((value) => value !== null).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card size="compact">
        <CardHeader>
          <CardDescription>Status</CardDescription>
          <CardTitle className="flex h-8 items-center">
            {latest ? (
              <AnimatedBadge status={executionBadge(latest.execution.status)}>{latest.execution.status}</AnimatedBadge>
            ) : (
              <AnimatedBadge status="neutral">Not launched</AnimatedBadge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          {latest ? `Last launched ${latest.execution.started}` : "Not launched yet"}
        </CardContent>
      </Card>
      <Card size="compact">
        <CardHeader>
          <CardDescription>Pass rate</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{percent(latest?.rate ?? null)}</CardTitle>
        </CardHeader>
        <CardContent>
          {judgedLaunches >= 2 ? (
            <Sparkline
              data={trend}
              label="Pass rate by launch"
              variant="area"
              color="var(--primary)"
              height={24}
              formatValue={(value) => `${value}%`}
              showDelta
            />
          ) : (
            <span className="text-muted-foreground">
              {latest
                ? `${latest.runs.filter((run) => run.status === "Passed").length} of ${latest.runs.length} runs passed`
                : "No judged runs yet"}
            </span>
          )}
        </CardContent>
      </Card>
      <Card size="compact">
        <CardHeader>
          <CardDescription>Total spend</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{latest ? money(latest.execution.spendCents) : "—"}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">Up to {money(experiment.maxSpendCents)} per launch</CardContent>
      </Card>
      <Card size="compact">
        <CardHeader>
          <CardDescription>Runs per launch</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{experiment.runsPerLaunch}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          {plural(experiment.scenarios.length, "scenario")} × {plural(experiment.agents.length, "agent")}
        </CardContent>
      </Card>
    </div>
  );
}

function LatestResult({ orgId, latest, onLaunch }: { orgId: string; latest: ExecutionSummary | undefined; onLaunch: () => void }) {
  const columns = useMemo<TableColumn<Run>[]>(
    () => [
      {
        key: "run",
        header: "Run",
        sortable: true,
        sortValue: (run) => run.scenario ?? run.id,
        cell: (run) => (
          <Link to={`/${orgId}/runs/${run.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
            {run.scenario ?? run.id}
          </Link>
        ),
      },
      {
        key: "variant",
        header: "Variant",
        width: "220px",
        sortable: true,
        sortValue: (run) => run.agent,
        cell: (run) => (
          <span className="text-muted-foreground">
            {run.agent} · <span className="font-mono text-xs">{run.model}</span>
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "120px",
        sortable: true,
        sortValue: (run) => run.status,
        cell: (run) => (
          <AnimatedBadge status={runBadge(run.status)} size="sm">
            {run.status}
          </AnimatedBadge>
        ),
      },
      {
        key: "duration",
        header: "Duration",
        width: "100px",
        align: "right",
        cell: (run) => <span className="tabular-nums text-muted-foreground">{run.duration}</span>,
      },
      {
        key: "cost",
        header: "Cost",
        width: "90px",
        align: "right",
        sortable: true,
        sortValue: (run) => run.costCents,
        cell: (run) => <span className="tabular-nums">{money(run.costCents)}</span>,
      },
    ],
    [orgId],
  );

  if (!latest) {
    return (
      <EmptyCard>
        <p>Not launched yet. Launch the experiment to run every scenario and judge the results.</p>
        <StatefulButton size="sm" onClick={onLaunch}>
          Launch
        </StatefulButton>
      </EmptyCard>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Last launched {latest.execution.started} · version {latest.execution.version} · {money(latest.execution.spendCents)}
      </p>
      <Table
        data={latest.runs}
        columns={columns}
        getRowId={(run) => run.id}
        rowHeight={ROW_HEIGHT}
        height={tableHeight(latest.runs.length)}
        className="rounded-2xl"
        emptyState="This launch has no runs."
      />
    </div>
  );
}

function Scenarios({ orgId, experiment }: { orgId: string; experiment: Experiment }) {
  if (!experiment.scenarios.length) {
    return (
      <EmptyCard>
        <p>No scenarios yet</p>
        <RouterButtonLink to={`/${orgId}/experiments/${experiment.id}/edit`} size="sm">
          Add scenarios
        </RouterButtonLink>
      </EmptyCard>
    );
  }
  return (
    <Card className="gap-0 py-0">
      <ol className="divide-y divide-border">
        {experiment.scenarios.map((scenario, index) => (
          <li key={scenario.id} className="flex gap-4 px-5 py-4">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted font-mono text-xs text-muted-foreground">
              {index + 1}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-medium text-foreground">{scenario.name}</span>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {scenario.prompt || "No prompt yet."}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function Agents({ orgId, experiment }: { orgId: string; experiment: Experiment }) {
  if (!experiment.agents.length) {
    return (
      <EmptyCard>
        <p>No agents yet</p>
        <RouterButtonLink to={`/${orgId}/experiments/${experiment.id}/edit`} size="sm">
          Add agents
        </RouterButtonLink>
      </EmptyCard>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {experiment.agents.map((agent) => (
        <Card key={agent.id} size="compact">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                <Bot aria-hidden="true" className="size-4" />
              </span>
              {agent.name}
            </CardTitle>
            <CardDescription>
              {agent.harness} · <span className="font-mono text-xs">{agent.model}</span>
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

function Executions({ history }: { history: ExecutionSummary[] }) {
  const earlier = history.slice(1);
  const chronological = history.slice().reverse();
  const columns = useMemo<TableColumn<ExecutionSummary>[]>(
    () => [
      {
        key: "version",
        header: "Version",
        width: "100px",
        cell: (item) => <span className="font-mono text-xs">v{item.execution.version}</span>,
      },
      {
        key: "status",
        header: "Status",
        width: "130px",
        cell: (item) => (
          <AnimatedBadge status={executionBadge(item.execution.status)} size="sm">
            {item.execution.status}
          </AnimatedBadge>
        ),
      },
      {
        key: "started",
        header: "Started",
        cell: (item) => <span className="text-muted-foreground">{item.execution.started}</span>,
      },
      {
        key: "rate",
        header: "Pass rate",
        width: "100px",
        align: "right",
        cell: (item) => <span className="tabular-nums">{percent(item.rate)}</span>,
      },
      {
        key: "spend",
        header: "Spend",
        width: "100px",
        align: "right",
        cell: (item) => <span className="tabular-nums">{money(item.execution.spendCents)}</span>,
      },
    ],
    [],
  );

  if (!history.length) {
    return <EmptyCard>Not launched yet. Each launch is recorded here.</EmptyCard>;
  }

  return (
    <div className="flex flex-col gap-6">
      {history.length > 1 ? (
        <Card size="compact">
          <CardHeader>
            <CardTitle as="h3">Pass rate by launch</CardTitle>
            <CardDescription>Share of judged runs that passed, oldest launch first.</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart
              series={[{ id: "rate", name: "Pass rate", color: "var(--primary)", values: rateTrend(history) }]}
              categories={chronological.map((item, index) => `#${index + 1} · v${item.execution.version}`)}
              variant="area"
              domain={[0, 100]}
              label="Pass rate by launch"
              formatValue={(value) => `${Math.round(value)}%`}
              formatTick={(value) => `${value}%`}
            >
              <LineChartPlot height={180} />
              <LineChartTooltip />
            </LineChart>
          </CardContent>
        </Card>
      ) : null}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Earlier executions</h3>
        {earlier.length ? (
          <Table
            data={earlier}
            columns={columns}
            getRowId={(item) => item.execution.id}
            rowHeight={ROW_HEIGHT}
            height={tableHeight(earlier.length)}
            className="rounded-2xl"
          />
        ) : (
          <EmptyCard>Only the latest launch so far. Earlier executions appear here after the next launch.</EmptyCard>
        )}
      </section>
    </div>
  );
}
