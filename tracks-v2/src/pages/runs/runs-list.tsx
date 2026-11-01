import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FlaskConical, Plus, SquareTerminal, X } from "lucide-react";
import { Page } from "@/app/page-layout";
import { RouterButtonLink } from "@/app/router-link";
import { Sparkline } from "@/components/charts/sparkline";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Button } from "@/components/motion/button/base";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/motion/card";
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
import { Loader } from "@/components/motion/loader";
import {
  MorphSelect,
  MorphSelectContent,
  MorphSelectItem,
  MorphSelectTrigger,
  MorphSelectValue,
} from "@/components/motion/select-morph";
import { NumberTicker } from "@/components/motion/number-ticker";
import { Pagination } from "@/components/motion/pagination";
import { Table, type SortState, type TableColumn } from "@/components/motion/table";
import { Tooltip } from "@/components/motion/tooltip";
import { RUN_STATUSES, money, passRate, percent, useOrgData, type Run } from "@/data";
import { RunStatusBadge, durationSeconds, isLive, runTitle, startedAt } from "./shared";

const PAGE_SIZE = 10;
const ROW_HEIGHT = 60;
const ANY = "any";
const ONE_OFF = "one-off";
const STATUS_ORDER = ["Running", "Judging", "Failed", "Passed", "Canceled"];

export function Runs() {
  const { orgId, runs, experiments } = useOrgData();
  const [outcome, setOutcome] = useState(ANY);
  const [agent, setAgent] = useState(ANY);
  const [experiment, setExperiment] = useState(ANY);
  const [sort, setSort] = useState<SortState | null>({ key: "started", direction: "desc" });
  const [page, setPage] = useState(1);

  const experimentName = useMemo(
    () => new Map(experiments.map((item) => [item.id, item.name])),
    [experiments],
  );
  const agents = useMemo(() => [...new Set(runs.map((run) => run.agent))], [runs]);

  const filtered = useMemo(
    () =>
      runs.filter((run) => {
        if (outcome !== ANY && run.status !== outcome) return false;
        if (agent !== ANY && run.agent !== agent) return false;
        if (experiment === ONE_OFF && run.experimentId) return false;
        if (experiment !== ANY && experiment !== ONE_OFF && run.experimentId !== experiment) return false;
        return true;
      }),
    [runs, outcome, agent, experiment],
  );

  const columns = useMemo<TableColumn<Run>[]>(
    () => [
      {
        key: "run",
        header: "Run",
        sortable: true,
        sortValue: (run) => runTitle(run).toLowerCase(),
        cell: (run) => {
          const parent = run.experimentId ? experimentName.get(run.experimentId) : null;
          const Icon = run.experimentId ? FlaskConical : SquareTerminal;
          return (
            <div className="flex min-w-0 flex-col gap-0.5">
              <Link
                to={`/${orgId}/runs/${run.id}`}
                className="truncate font-medium text-foreground underline-offset-4 hover:underline"
              >
                {run.scenario ?? run.prompt}
              </Link>
              <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                <Icon aria-hidden className="size-3 shrink-0" />
                <span className="truncate">{parent ?? "One-off"}</span>
              </span>
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        width: "128px",
        sortable: true,
        sortValue: (run) => STATUS_ORDER.indexOf(run.status),
        cell: (run) => <RunStatusBadge status={run.status} />,
      },
      {
        key: "variant",
        header: "Variant",
        width: "200px",
        sortValue: (run) => `${run.agent} ${run.model}`,
        cell: (run) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-foreground">{run.agent}</span>
            <span className="truncate font-mono text-xs text-muted-foreground">{run.model}</span>
          </div>
        ),
      },
      {
        key: "cost",
        header: "Cost",
        align: "right",
        width: "96px",
        sortable: true,
        sortValue: (run) => run.costCents,
        cell: (run) => <span className="tabular-nums">{money(run.costCents)}</span>,
      },
      {
        key: "duration",
        header: "Duration",
        align: "right",
        width: "112px",
        sortable: true,
        sortValue: (run) => durationSeconds(run.duration) ?? -1,
        cell: (run) =>
          isLive(run.status) && durationSeconds(run.duration) === null ? (
            <Loader variant="spinner" size={14} label="Still running" className="text-muted-foreground" />
          ) : (
            <span className="tabular-nums text-muted-foreground">{run.duration}</span>
          ),
      },
      {
        key: "started",
        header: "Started",
        width: "132px",
        sortable: true,
        sortValue: startedAt,
        cell: (run) => <span className="text-muted-foreground">{run.started}</span>,
      },
    ],
    [experimentName, orgId],
  );

  const sorted = useMemo(() => {
    const column = sort ? columns.find((item) => item.key === sort.key) : undefined;
    if (!sort || !column?.sortValue) return filtered;
    const value = column.sortValue;
    const sign = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const left = value(a);
      const right = value(b);
      if (left === right) return 0;
      return (left > right ? 1 : -1) * sign;
    });
  }, [columns, filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageRows = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtering = outcome !== ANY || agent !== ANY || experiment !== ANY;

  const filterBy = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };
  const clearFilters = () => {
    setOutcome(ANY);
    setAgent(ANY);
    setExperiment(ANY);
    setPage(1);
  };

  return (
    <Page
      width="wide"
      title="Runs"
      description="Every agent attempt, from an experiment or on its own."
      actions={
        runs.length ? (
          <RouterButtonLink to={`/${orgId}/runs/new`} size="sm">
            <Plus className="size-4" /> New run
          </RouterButtonLink>
        ) : null
      }
    >
      {runs.length === 0 ? (
        <Card variant="muted">
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
              No runs yet. Give one agent one prompt, or launch an experiment.
            </p>
            <RouterButtonLink to={`/${orgId}/runs/new`} size="sm">
              <Plus className="size-4" /> New run
            </RouterButtonLink>
          </CardContent>
        </Card>
      ) : (
        <>
          <RunStats runs={filtered} />

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <MorphSelect value={outcome} onValueChange={filterBy(setOutcome)} className="w-40">
                <MorphSelectTrigger>
                  <MorphSelectValue />
                </MorphSelectTrigger>
                <MorphSelectContent>
                  <MorphSelectItem value={ANY}>Any outcome</MorphSelectItem>
                  {RUN_STATUSES.map((status) => (
                    <MorphSelectItem key={status} value={status}>
                      {status}
                    </MorphSelectItem>
                  ))}
                </MorphSelectContent>
              </MorphSelect>

              <MorphSelect value={agent} onValueChange={filterBy(setAgent)} className="w-40">
                <MorphSelectTrigger>
                  <MorphSelectValue />
                </MorphSelectTrigger>
                <MorphSelectContent>
                  <MorphSelectItem value={ANY}>Any agent</MorphSelectItem>
                  {agents.map((name) => (
                    <MorphSelectItem key={name} value={name}>
                      {name}
                    </MorphSelectItem>
                  ))}
                </MorphSelectContent>
              </MorphSelect>

              <Combobox value={experiment} onValueChange={filterBy(setExperiment)} className="w-60">
                <ComboboxTrigger>
                  <ComboboxInput aria-label="Experiment" placeholder="Find an experiment…" />
                </ComboboxTrigger>
                <ComboboxContent>
                  <ComboboxList ariaLabel="Experiments">
                    <ComboboxGroup>
                      <ComboboxItem value={ANY}>Any experiment</ComboboxItem>
                      <ComboboxItem value={ONE_OFF} keywords={["one-off", "none"]}>
                        Outside an experiment
                      </ComboboxItem>
                    </ComboboxGroup>
                    <ComboboxGroup>
                      <ComboboxLabel>Experiments</ComboboxLabel>
                      {experiments.map((item) => (
                        <ComboboxItem key={item.id} value={item.id} textValue={item.name}>
                          {item.name}
                        </ComboboxItem>
                      ))}
                    </ComboboxGroup>
                    <ComboboxEmpty>No experiment matches.</ComboboxEmpty>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>

              {filtering ? (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="size-3.5" /> Clear
                </Button>
              ) : null}

              <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                {filtered.length} of {runs.length} {runs.length === 1 ? "run" : "runs"}
              </span>
            </div>

            {filtered.length === 0 ? (
              <Card variant="muted">
                <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-muted-foreground">No runs match these filters.</p>
                  <Button size="sm" variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Table
                  data={pageRows}
                  columns={columns}
                  getRowId={(run) => run.id}
                  sort={sort}
                  onSortChange={(next) => {
                    setSort(next);
                    setPage(1);
                  }}
                  rowHeight={ROW_HEIGHT}
                  height={(pageRows.length + 1) * ROW_HEIGHT + 2}
                  className="rounded-2xl"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Showing {(current - 1) * PAGE_SIZE + 1}–{(current - 1) * PAGE_SIZE + pageRows.length} of{" "}
                    {sorted.length}
                  </p>
                  <Pagination totalPages={totalPages} page={current} onPageChange={setPage} />
                </div>
              </>
            )}
          </section>
        </>
      )}
    </Page>
  );
}

function RunStats({ runs }: { runs: Run[] }) {
  const chronological = useMemo(() => [...runs].sort((a, b) => startedAt(a) - startedAt(b)), [runs]);
  const rate = passRate(runs);
  const spend = runs.reduce((sum, run) => sum + run.costCents, 0);
  const live = runs.filter((run) => isLive(run.status)).length;

  const rateTrend = useMemo(() => {
    let passed = 0;
    let judged = 0;
    const points: number[] = [];
    for (const run of chronological) {
      if (run.status !== "Passed" && run.status !== "Failed") continue;
      judged += 1;
      if (run.status === "Passed") passed += 1;
      points.push(Math.round((passed / judged) * 100));
    }
    return points;
  }, [chronological]);
  const costTrend = chronological.map((run) => run.costCents / 100);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card size="compact">
        <CardHeader>
          <CardDescription>Runs</CardDescription>
          <CardTitle className="text-2xl tabular-nums">
            <NumberTicker value={runs.length} />
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {runs.filter((run) => run.experimentId).length} from experiments ·{" "}
          {runs.filter((run) => !run.experimentId).length} one-off
        </CardContent>
      </Card>

      <Card size="compact">
        <CardHeader>
          <CardDescription>Pass rate</CardDescription>
          <CardTitle className="text-2xl tabular-nums">
            {rate === null ? "—" : <NumberTicker value={Math.round(rate * 100)} suffix="%" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rateTrend.length > 1 ? (
            <Sparkline
              data={rateTrend}
              label="Pass rate across judged runs"
              variant="area"
              height={28}
              color="var(--success)"
              formatValue={(value) => `${Math.round(value)}%`}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              {rate === null ? "Nothing judged yet." : `${percent(rate)} of judged runs passed.`}
            </p>
          )}
        </CardContent>
      </Card>

      <Card size="compact">
        <CardHeader>
          <CardDescription>Spend</CardDescription>
          <CardTitle className="text-2xl">
            <AnimatedNumber value={spend} format={(cents) => money(Math.round(cents))} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {costTrend.length > 1 ? (
            <Sparkline
              data={costTrend}
              label="Cost per run, oldest to newest"
              variant="area"
              height={28}
              color="var(--primary)"
              formatValue={(value) => money(Math.round(value * 100))}
            />
          ) : (
            <p className="text-xs text-muted-foreground">Across the runs shown.</p>
          )}
        </CardContent>
      </Card>

      <Card size="compact">
        <CardHeader>
          <CardDescription>In progress</CardDescription>
          <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
            <NumberTicker value={live} />
            {live > 0 ? (
              <Tooltip content="Running or being judged">
                <span className="inline-flex text-primary">
                  <Loader variant="spinner" size={16} label="Runs in progress" className="text-primary" />
                </span>
              </Tooltip>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {live ? "Running or waiting on a judge." : "Nothing running right now."}
        </CardContent>
      </Card>
    </div>
  );
}
