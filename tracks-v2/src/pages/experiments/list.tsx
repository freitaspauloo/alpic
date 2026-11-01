import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Plus, Search } from "lucide-react";
import { Page, PageSection } from "@/app/page-layout";
import { RouterButtonLink } from "@/app/router-link";
import { Sparkline } from "@/components/charts/sparkline";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button/base";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/motion/card";
import { Input } from "@/components/motion/input";
import { NumberTicker } from "@/components/motion/number-ticker";
import { Table, type TableColumn } from "@/components/motion/table";
import { Tooltip } from "@/components/motion/tooltip";
import { money, passRate, percent, SCENARIO_STARTERS, useOrgData, useStore, type Experiment } from "@/data";
import { FromDocumentModal } from "./create";
import {
  EmptyCard,
  executionBadge,
  ExperimentMenu,
  plural,
  rateTrend,
  RemoveExperimentModal,
  summarizeExecutions,
  useLaunch,
  useRemoveDialog,
  type ExecutionSummary,
} from "./shared";

const ROW_HEIGHT = 60;
const MAX_VISIBLE_ROWS = 10;

type Row = Experiment & { history: ExecutionSummary[] };

export function ExperimentsList() {
  const { orgId, experiments, executions, runs } = useOrgData();
  const { duplicateExperiment } = useStore();
  const navigate = useNavigate();
  const launch = useLaunch();
  const remove = useRemoveDialog();
  const { ask } = remove;
  const [importing, setImporting] = useState(false);
  const [picked, setPicked] = useState<string[]>([SCENARIO_STARTERS[0].label]);
  const [query, setQuery] = useState("");

  const rows = useMemo<Row[]>(
    () => experiments.map((experiment) => ({ ...experiment, history: summarizeExecutions(experiment.id, executions, runs) })),
    [experiments, executions, runs],
  );
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(needle) ||
        row.scenarios.some((scenario) => scenario.name.toLowerCase().includes(needle)),
    );
  }, [rows, query]);

  const openImport = (labels: string[]) => {
    setPicked(labels);
    setImporting(true);
  };

  const columns = useMemo<TableColumn<Row>[]>(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        sortValue: (row) => row.name.toLowerCase(),
        cell: (row) => (
          <span className="flex min-w-0 flex-col">
            <Link
              to={`/${orgId}/experiments/${row.id}`}
              className="truncate font-medium text-foreground underline-offset-4 hover:underline"
            >
              {row.name}
            </Link>
            <span className="truncate text-xs text-muted-foreground">
              v{row.version} · {row.agents.length ? row.agents.map((agent) => agent.name).join(", ") : "No agents"}
            </span>
          </span>
        ),
      },
      {
        key: "scenarios",
        header: "Scenarios",
        sortable: true,
        width: "130px",
        sortValue: (row) => row.scenarios.length,
        cell: (row) => <span className="text-muted-foreground tabular-nums">{plural(row.scenarios.length, "scenario")}</span>,
      },
      {
        key: "latest",
        header: "Latest execution",
        width: "240px",
        sortValue: (row) => row.history[0]?.rate ?? -1,
        sortable: true,
        cell: (row) => {
          const latest = row.history[0];
          if (!latest) return <span className="text-muted-foreground">Not launched yet</span>;
          return (
            <span className="inline-flex items-center gap-2">
              <AnimatedBadge status={executionBadge(latest.execution.status)} size="sm">
                {latest.execution.status}
              </AnimatedBadge>
              {latest.rate !== null ? (
                <span className="text-muted-foreground tabular-nums">{percent(latest.rate)} pass</span>
              ) : (
                <span className="text-muted-foreground">{latest.execution.started}</span>
              )}
            </span>
          );
        },
      },
      {
        key: "trend",
        header: "Pass rate trend",
        width: "170px",
        cell: (row) => {
          const trend = rateTrend(row.history);
          if (trend.filter((value) => value !== null).length < 2) {
            return (
              <Tooltip content="A trend appears after two judged launches.">
                <span className="text-muted-foreground">—</span>
              </Tooltip>
            );
          }
          return (
            <Sparkline
              data={trend}
              label={`${row.name} pass rate by launch`}
              variant="area"
              color="var(--primary)"
              height={24}
              formatValue={(value) => `${value}%`}
              showDelta
            />
          );
        },
      },
      {
        key: "spend",
        header: "Max spend",
        align: "right",
        width: "120px",
        sortable: true,
        sortValue: (row) => row.maxSpendCents,
        cell: (row) => <span className="tabular-nums">{money(row.maxSpendCents)}</span>,
      },
      {
        key: "actions",
        header: <span className="sr-only">Actions</span>,
        align: "right",
        width: "64px",
        cell: (row) => (
          <ExperimentMenu
            experiment={row}
            onOpen={() => navigate(`/${orgId}/experiments/${row.id}`)}
            onLaunch={() => launch(row)}
            onEdit={() => navigate(`/${orgId}/experiments/${row.id}/edit`)}
            onDuplicate={() => duplicateExperiment(row.id)}
            onRemove={() => ask(row)}
          />
        ),
      },
    ],
    [orgId, navigate, launch, duplicateExperiment, ask],
  );

  const tableHeight = ROW_HEIGHT * (Math.min(Math.max(visible.length, 1), MAX_VISIBLE_ROWS) + 1) + 2;

  return (
    <Page
      title="Experiments"
      description="Compare how agents perform your scenarios across variants."
      width="wide"
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={() => openImport([SCENARIO_STARTERS[0].label])}>
            <FileText aria-hidden="true" className="size-3.5" />
            From a document
          </Button>
          <RouterButtonLink to={`/${orgId}/experiments/new`} size="sm">
            <Plus aria-hidden="true" className="size-3.5" />
            New experiment
          </RouterButtonLink>
        </>
      }
    >
      {experiments.length === 0 ? (
        <EmptyCard className="py-10">
          <h2 className="text-base font-semibold text-foreground">What would you like to test?</h2>
          <p>Start from a few questions about your website, or write the scenarios yourself.</p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {SCENARIO_STARTERS.map((starter) => (
              <Button key={starter.label} variant="outline" size="sm" onClick={() => openImport([starter.label])}>
                {starter.label}
              </Button>
            ))}
          </div>
          <RouterButtonLink to={`/${orgId}/experiments/new`} size="sm" className="mt-2">
            Start from scratch
          </RouterButtonLink>
        </EmptyCard>
      ) : (
        <>
          <OrgStats rows={rows} />
          <PageSection
            title="All experiments"
            actions={
              <Input
                aria-label="Filter experiments"
                placeholder="Filter by name or scenario"
                value={query}
                onChange={setQuery}
                leftIcon={<Search />}
                className="w-64"
              />
            }
          >
            <Table
              data={visible}
              columns={columns}
              getRowId={(row) => row.id}
              defaultSort={{ key: "name", direction: "asc" }}
              rowHeight={ROW_HEIGHT}
              height={tableHeight}
              className="rounded-2xl"
              emptyState={<span className="text-sm">No experiments match “{query.trim()}”.</span>}
            />
          </PageSection>
        </>
      )}

      <FromDocumentModal open={importing} onOpenChange={setImporting} initialPicked={picked} />
      <RemoveExperimentModal experiment={remove.target} open={remove.open} onOpenChange={remove.setOpen} />
    </Page>
  );
}

function OrgStats({ rows }: { rows: Row[] }) {
  const { executions } = useOrgData();
  const scenarios = rows.reduce((sum, row) => sum + row.scenarios.length, 0);
  const byId = new Map(rows.flatMap((row) => row.history).map((item) => [item.execution.id, item]));
  // The store's order is launch order across every experiment; removed experiments drop out.
  const launches = executions.flatMap((execution) => byId.get(execution.id) ?? []);
  const spend = launches.reduce((sum, item) => sum + item.execution.spendCents, 0);
  const latestRuns = rows.flatMap((row) => row.history[0]?.runs ?? []);
  const rate = passRate(latestRuns);
  const trend = rateTrend(launches);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card size="compact">
        <CardHeader>
          <CardDescription>Experiments</CardDescription>
          <CardTitle className="text-2xl tabular-nums">
            <NumberTicker value={rows.length} startOnView={false} />
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">{plural(scenarios, "scenario")} in total</CardContent>
      </Card>
      <Card size="compact">
        <CardHeader>
          <CardDescription>Launches</CardDescription>
          <CardTitle className="text-2xl tabular-nums">
            <NumberTicker value={launches.length} startOnView={false} />
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">{money(spend)} spent</CardContent>
      </Card>
      <Card size="compact">
        <CardHeader>
          <CardDescription>Pass rate, latest launches</CardDescription>
          <CardTitle className="text-2xl tabular-nums">
            {rate === null ? "—" : <NumberTicker value={Math.round(rate * 100)} suffix="%" startOnView={false} />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trend.filter((value) => value !== null).length >= 2 ? (
            <Sparkline
              data={trend}
              label="Pass rate across launches"
              variant="area"
              color="var(--primary)"
              height={28}
              formatValue={(value) => `${value}%`}
              showDelta
            />
          ) : (
            <span className="text-muted-foreground">Judged runs from each experiment’s latest launch</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
