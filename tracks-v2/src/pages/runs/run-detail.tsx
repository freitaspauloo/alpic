import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Copy, FileJson, FlaskConical, MessageSquareText, ScrollText } from "lucide-react";
import { Page, PageSection } from "@/app/page-layout";
import { RouterButtonLink } from "@/app/router-link";
import { CodeBlock } from "@/components/agents/code-block";
import { ActionSwapButton } from "@/components/motion/action-swap";
import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from "@/components/motion/alert";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/motion/card";
import { Loader } from "@/components/motion/loader";
import { Table, type TableColumn } from "@/components/motion/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { TextShimmer } from "@/components/motion/text-shimmer";
import { money, useOrgData, type Run } from "@/data";
import { RunStatusBadge, durationSeconds, formatDuration, isLive } from "./shared";

export function RunDetail() {
  const { runId = "" } = useParams();
  const { orgId, runs, experiments, executions } = useOrgData();
  const run = runs.find((item) => item.id === runId);

  if (!run) {
    return (
      <Page title="Run">
        <Card variant="muted">
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">This run no longer exists.</p>
            <RouterButtonLink to={`/${orgId}/runs`} size="sm" variant="secondary">
              <ArrowLeft className="size-4" /> All runs
            </RouterButtonLink>
          </CardContent>
        </Card>
      </Page>
    );
  }

  const experiment = experiments.find((item) => item.id === run.experimentId);
  const execution = executions.find((item) => item.id === run.executionId);
  const siblings = run.executionId
    ? runs.filter((item) => item.executionId === run.executionId && item.id !== run.id)
    : [];

  return (
    <Page
      title={run.scenario ?? "One-off run"}
      description={
        experiment ? (
          <span className="inline-flex items-center gap-1.5">
            <FlaskConical aria-hidden className="size-3.5" />
            <Link
              to={`/${orgId}/experiments/${experiment.id}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {experiment.name}
            </Link>
            {execution ? <span>· version {execution.version}</span> : null}
          </span>
        ) : (
          "Outside any experiment. Nothing judges it."
        )
      }
      actions={<RunStatusBadge status={run.status} size="md" />}
    >
      {isLive(run.status) ? (
        <Alert variant="info">
          <AlertIcon>
            <Loader variant="spinner" size={16} label={run.status} className="text-primary" />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>
              <TextShimmer>{run.status === "Running" ? "Running…" : "Judging…"}</TextShimmer>
            </AlertTitle>
            <AlertDescription>
              {run.status === "Running"
                ? "The agent is still working. Duration settles when it finishes."
                : "The agent finished. The verdict lands when judging completes."}
            </AlertDescription>
          </AlertContent>
        </Alert>
      ) : null}

      <RunStats run={run} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0">
          <CardContent>
            <Tabs defaultValue="evidence" variant="underline">
              <TabsList>
                <TabsTrigger value="evidence" icon={<ScrollText className="size-4" />}>
                  Evidence
                </TabsTrigger>
                <TabsTrigger value="prompt" icon={<MessageSquareText className="size-4" />}>
                  Prompt
                </TabsTrigger>
                <TabsTrigger value="record" icon={<FileJson className="size-4" />}>
                  Record
                </TabsTrigger>
              </TabsList>
              <TabsContent value="evidence" className="mt-5">
                <Evidence run={run} />
              </TabsContent>
              <TabsContent value="prompt" className="mt-5 flex flex-col gap-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{run.prompt}</p>
                <div>
                  <CopyButton text={run.prompt} label="Copy prompt" done="Prompt copied." />
                </div>
              </TabsContent>
              <TabsContent value="record" className="mt-5">
                <CodeBlock
                  code={JSON.stringify(
                    {
                      id: run.id,
                      status: run.status,
                      experimentId: run.experimentId,
                      executionId: run.executionId,
                      scenario: run.scenario,
                      agent: { name: run.agent, harness: run.harness, model: run.model },
                      repository: run.repository,
                      costCents: run.costCents,
                      duration: run.duration,
                      started: run.started,
                    },
                    null,
                    2,
                  )}
                  language="json"
                  filename={`${run.id}.json`}
                  maxHeight={360}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card size="compact">
          <CardHeader>
            <CardTitle as="h2">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col divide-y divide-border">
              <DetailRow label="Agent">{run.agent}</DetailRow>
              <DetailRow label="Harness">{run.harness}</DetailRow>
              <DetailRow label="Model">
                <span className="font-mono text-xs">{run.model}</span>
              </DetailRow>
              <DetailRow label="Repository">
                {run.repository ? (
                  <span className="font-mono text-xs">{run.repository}</span>
                ) : (
                  <span className="text-muted-foreground">No repository</span>
                )}
              </DetailRow>
              <DetailRow label="Experiment">
                {experiment ? (
                  <Link
                    to={`/${orgId}/experiments/${experiment.id}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {experiment.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </DetailRow>
              {run.executionId ? (
                <DetailRow label="Launch">
                  <span className="font-mono text-xs">{run.executionId}</span>
                </DetailRow>
              ) : null}
              <DetailRow label="Started">{run.started}</DetailRow>
              <DetailRow label="Run id">
                <span className="font-mono text-xs">{run.id}</span>
              </DetailRow>
            </dl>
            <div className="mt-4">
              <CopyButton text={run.id} label="Copy run id" done="Run id copied." className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {siblings.length ? <LaunchRuns orgId={orgId} runs={siblings} /> : null}
    </Page>
  );
}

function RunStats({ run }: { run: Run }) {
  const seconds = durationSeconds(run.duration);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Cost">
        <AnimatedNumber value={run.costCents} format={(cents) => money(Math.round(cents))} />
      </Stat>
      <Stat label="Duration">
        {seconds !== null ? (
          <AnimatedNumber value={seconds} format={formatDuration} />
        ) : isLive(run.status) ? (
          <TextShimmer>In progress</TextShimmer>
        ) : (
          "—"
        )}
      </Stat>
      <Stat label="Agent" hint={<span className="font-mono">{run.model}</span>}>
        {run.agent}
      </Stat>
      <Stat label="Started" hint={run.experimentId ? "From an experiment launch" : "One-off run"}>
        {run.started}
      </Stat>
    </div>
  );
}

function Stat({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <Card size="compact">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="truncate text-2xl tabular-nums">{children}</CardTitle>
      </CardHeader>
      {hint ? <CardContent className="-mt-2 truncate text-xs text-muted-foreground">{hint}</CardContent> : null}
    </Card>
  );
}

function Evidence({ run }: { run: Run }) {
  const verdict =
    run.status === "Passed"
      ? { tone: "success" as const, title: "Passed", body: "The judge accepted this evidence." }
      : run.status === "Failed"
        ? { tone: "destructive" as const, title: "Failed", body: "The judge rejected this evidence." }
        : run.status === "Canceled"
          ? { tone: "default" as const, title: "Canceled", body: "The run stopped before it finished." }
          : null;
  return (
    <div className="flex flex-col gap-4">
      {verdict ? (
        <Alert variant={verdict.tone}>
          <AlertIcon />
          <AlertContent>
            <AlertTitle>{verdict.title}</AlertTitle>
            <AlertDescription>{verdict.body}</AlertDescription>
          </AlertContent>
        </Alert>
      ) : null}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{run.evidence}</p>
    </div>
  );
}

function LaunchRuns({ orgId, runs }: { orgId: string; runs: Run[] }) {
  const columns = useMemo<TableColumn<Run>[]>(
    () => [
      {
        key: "run",
        header: "Run",
        sortable: true,
        sortValue: (run) => run.scenario ?? run.prompt,
        cell: (run) => (
          <Link
            to={`/${orgId}/runs/${run.id}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {run.scenario ?? run.prompt}
          </Link>
        ),
      },
      { key: "status", header: "Status", width: "128px", cell: (run) => <RunStatusBadge status={run.status} /> },
      {
        key: "variant",
        header: "Variant",
        width: "220px",
        cell: (run) => (
          <span className="text-muted-foreground">
            {run.agent} <span className="font-mono text-xs">· {run.model}</span>
          </span>
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
    ],
    [orgId],
  );
  return (
    <PageSection title="Other runs in this launch" description="Runs that started with this one.">
      <Table
        data={runs}
        columns={columns}
        getRowId={(run) => run.id}
        rowHeight={48}
        height={(runs.length + 1) * 48 + 2}
        className="rounded-2xl"
      />
    </PageSection>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-foreground">{children}</dd>
    </div>
  );
}

function CopyButton({
  text,
  label,
  done,
  className,
}: {
  text: string;
  label: string;
  done: string;
  className?: string;
}) {
  const [value, setValue] = useState("copy");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <ActionSwapButton
      size="sm"
      variant="secondary"
      className={className}
      value={value}
      onValueChange={(next) => {
        if (next !== "copied") {
          setValue("copy");
          return;
        }
        void navigator.clipboard?.writeText(text);
        setValue("copied");
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setValue("copy"), 1800);
      }}
      items={[
        { id: "copy", label, icon: <Copy className="size-3.5" /> },
        { id: "copied", label: done, icon: <Check className="size-3.5" /> },
      ]}
    />
  );
}
