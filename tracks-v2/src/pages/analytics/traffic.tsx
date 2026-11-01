import { useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ChartColumnStacked, ChartSpline, X } from "lucide-react";
import { Page, PageSection } from "@/app/page-layout";
import { RouterButtonLink } from "@/app/router-link";
import { CodeBlock } from "@/components/agents/code-block";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button/base";
import { Drawer } from "@/components/motion/drawer";
import { Table, type TableColumn } from "@/components/motion/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { useOrgData, type TrafficRequest, type TrafficSource, type VisitorKind } from "@/data";
import {
  VISITOR_COLOR,
  VISITOR_KINDS,
  classification,
  requestHeaders,
  statusBadge,
  summarize,
  trackedHost,
  trackedSources,
  userAgent,
  visitorCounts,
} from "./model";
import { ChartCard, KpiGrid, TrendChart, VisitorMix, VolumeChart } from "./parts";

type Filter = "all" | VisitorKind;

function VisitorLabel({ kind }: { kind: VisitorKind }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: VISITOR_COLOR[kind] }} />
      {kind}
    </span>
  );
}

export function Traffic() {
  const { orgId, sources, traffic } = useOrgData();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>("all");
  const summary = useMemo(() => summarize(traffic), [traffic]);
  const tracked = trackedSources(sources);
  const host = trackedHost(sources);

  const counts = useMemo(() => visitorCounts(traffic.requests), [traffic.requests]);
  const rows = filter === "all" ? traffic.requests : traffic.requests.filter((request) => request.visitor === filter);
  const inspectedId = params.get("request");
  const inspected = traffic.requests.find((request) => request.id === inspectedId) ?? null;

  const columns = useMemo((): TableColumn<TrafficRequest>[] => {
    const href = (id: string) => {
      const next = new URLSearchParams(params);
      next.set("request", id);
      return `?${next.toString()}`;
    };
    return [
      {
        key: "visitor",
        header: "Visitor",
        width: "140px",
        sortable: true,
        cell: (row) => <VisitorLabel kind={row.visitor} />,
      },
      {
        key: "path",
        header: "Request",
        sortable: true,
        cell: (row) => (
          <Link
            to={href(row.id)}
            className="font-mono text-xs text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            GET {row.path}
          </Link>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "110px",
        sortable: true,
        cell: (row) => (
          <AnimatedBadge status={statusBadge(row.status)} size="sm" showIcon={false} className="font-mono">
            {row.status}
          </AnimatedBadge>
        ),
      },
      {
        key: "at",
        header: "Received",
        width: "130px",
        align: "right",
        sortable: true,
        cell: (row) => <span className="font-mono text-xs text-muted-foreground">{row.at}</span>,
      },
    ];
  }, [params]);

  if (!tracked.length) {
    return <Navigate to={`/${orgId}/analytics/sources`} replace />;
  }

  const closeInspector = () => {
    const next = new URLSearchParams(params);
    next.delete("request");
    setParams(next, { replace: true });
  };

  return (
    <Page
      title="Traffic"
      description="Requests from the last 24 hours. Expand a request to inspect its details and headers."
      actions={
        <RouterButtonLink to={`/${orgId}/analytics/sources`} variant="secondary" size="sm">
          Sources
        </RouterButtonLink>
      }
    >
      {traffic.buckets.length ? <KpiGrid summary={summary} /> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Tabs defaultValue="volume" variant="segment" className="lg:col-span-2">
          <ChartCard
            title="UTC hour"
            description="Requests per two-hour window, with the share that came from agents."
            action={
              <TabsList aria-label="Chart view">
                <TabsTrigger value="volume" icon={<ChartColumnStacked className="size-4" />}>
                  Volume
                </TabsTrigger>
                <TabsTrigger value="trend" icon={<ChartSpline className="size-4" />}>
                  Trend
                </TabsTrigger>
              </TabsList>
            }
          >
            {traffic.buckets.length ? (
              <>
                <TabsContent value="volume" className="mt-0">
                  <VolumeChart summary={summary} height={340} />
                </TabsContent>
                <TabsContent value="trend" className="mt-0">
                  <TrendChart summary={summary} height={340} />
                </TabsContent>
              </>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">No requests in the last 24 hours.</p>
            )}
          </ChartCard>
        </Tabs>
        <ChartCard title="Visitors" description="Who sent the most recent requests.">
          <VisitorMix requests={traffic.requests} />
        </ChartCard>
      </div>

      <PageSection title="Requests" description={host ? `Most recent requests to ${host}.` : undefined}>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)} variant="pill">
          <TabsList aria-label="Filter by visitor">
            <TabsTrigger value="all">All {traffic.requests.length}</TabsTrigger>
            {VISITOR_KINDS.map((kind) => {
              const total = counts.find((item) => item.kind === kind)?.count ?? 0;
              return (
                <TabsTrigger key={kind} value={kind} disabled={!total}>
                  {kind} {total}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
        <Table
          data={rows}
          columns={columns}
          getRowId={(row) => row.id}
          emptyState={
            <p className="py-10 text-center text-sm text-muted-foreground">
              {filter === "all" ? "No requests yet." : `No ${filter.toLowerCase()} requests yet.`}
            </p>
          }
        />
      </PageSection>

      <RequestInspector request={inspected} host={host} source={tracked[0]} onClose={closeInspector} />
    </Page>
  );
}

function RequestInspector({
  request,
  host,
  source,
  onClose,
}: {
  request: TrafficRequest | null;
  host: string | null;
  source: TrafficSource | undefined;
  onClose: () => void;
}) {
  // Keep the last request on screen while the drawer slides away.
  const [shown, setShown] = useState<TrafficRequest | null>(request);
  if (request && request !== shown) setShown(request);

  const details: [string, ReactNode][] = shown
    ? [
        ["Visitor", <VisitorLabel key="visitor" kind={shown.visitor} />],
        [
          "Status",
          <AnimatedBadge key="status" status={statusBadge(shown.status)} size="sm" showIcon={false} className="font-mono">
            {shown.status}
          </AnimatedBadge>,
        ],
        ["Received", <span key="at" className="font-mono text-xs">{shown.at}</span>],
        ["Host", <span key="host" className="font-mono text-xs">{host ?? "—"}</span>],
        ["Source", source ? `${source.provider} · ${source.target}` : "—"],
      ]
    : [];

  return (
    <Drawer
      open={request !== null}
      onOpenChange={(open) => !open && onClose()}
      ariaLabel="Request details"
      className="w-[34rem]"
    >
      {shown ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-xs text-muted-foreground">Request</p>
              <h2 className="truncate font-mono text-sm font-semibold text-foreground">GET {shown.path}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close request details">
              <X className="size-4" />
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
            <dl className="flex flex-col divide-y divide-border text-sm">
              {details.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 truncate text-right text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-foreground">Why {shown.visitor.toLowerCase()}</h3>
              <p className="text-sm text-muted-foreground">{classification(shown.visitor)}</p>
              <p className="rounded-xl bg-muted px-3 py-2.5 font-mono text-xs break-all text-foreground">
                {userAgent(shown.visitor)}
              </p>
            </section>
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-foreground">Headers</h3>
              <CodeBlock code={requestHeaders(shown, host)} language="text" filename="request" copyable />
            </section>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
