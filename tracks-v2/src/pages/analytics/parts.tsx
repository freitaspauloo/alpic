import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { BarChart, BarChartLegend, BarChartPlot, BarChartTooltip } from "@/components/charts/bar-chart";
import { CompositionChart } from "@/components/charts/composition-chart";
import { DonutChart, DonutChartCenter, DonutChartLegend, DonutChartPlot } from "@/components/charts/donut-chart";
import { LineChart, LineChartLegend, LineChartPlot, LineChartTooltip } from "@/components/charts/line-chart";
import { Sparkline } from "@/components/charts/sparkline";
import { AnimatedNumber } from "@/components/motion/animated-number";
import {
  CARD_TARGET_CLASS,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/motion/card";
import { NumberTicker } from "@/components/motion/number-ticker";
import type { TrafficRequest } from "@/data";
import { OTHERS_COLOR, VISITOR_COLOR, formatCount, formatShare, visitorCounts, type TrafficSummary } from "./model";

const requestsLabel = (value: number) => `${formatCount(value)} ${value === 1 ? "request" : "requests"}`;

function KpiCard({ label, value, footer }: { label: string; value: ReactNode; footer: ReactNode }) {
  return (
    <Card size="compact">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-auto">{footer}</CardContent>
    </Card>
  );
}

/** Four headline numbers for the last 24 hours, each with its two-hour trend. */
export function KpiGrid({ summary }: { summary: TrafficSummary }) {
  const { labels, peak } = summary;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Requests"
        value={<NumberTicker value={summary.totalRequests} locale />}
        footer={
          <Sparkline
            data={summary.requests}
            labels={labels}
            label="Requests, last 24 hours"
            variant="area"
            color="var(--foreground)"
            height={36}
            showDelta
          />
        }
      />
      <KpiCard
        label="Agent requests"
        value={<NumberTicker value={summary.totalAgents} locale />}
        footer={
          <Sparkline
            data={summary.agents}
            labels={labels}
            label="Agent requests, last 24 hours"
            variant="area"
            color="var(--primary)"
            height={36}
            showDelta
          />
        }
      />
      <KpiCard
        label="Agent share"
        value={<AnimatedNumber value={summary.agentShare} format={formatShare} />}
        footer={
          <Sparkline
            data={summary.share}
            labels={labels}
            label="Agent share of requests, last 24 hours"
            color="var(--primary)"
            height={36}
            formatValue={formatShare}
            showDelta
          />
        }
      />
      <KpiCard
        label="Busiest window"
        value={peak ? peak.label : "—"}
        footer={
          <p className="text-sm text-muted-foreground">
            {peak ? (
              <>
                <span className="font-medium text-foreground">{requestsLabel(peak.requests)}</span>
                {` · ${formatCount(peak.agents)} from agents`}
                <span className="block text-xs">{peak.window}</span>
              </>
            ) : (
              "No requests yet."
            )}
          </p>
        }
      />
    </div>
  );
}

/** Requests and agent requests per two-hour UTC window, as overlapping areas. */
export function TrendChart({ summary, height = 260 }: { summary: TrafficSummary; height?: number }) {
  return (
    <LineChart
      variant="area"
      categories={summary.labels}
      series={[
        { id: "requests", name: "All requests", color: "var(--muted-foreground)", values: summary.requests },
        { id: "agents", name: "Agents", color: "var(--primary)", values: summary.agents },
      ]}
      label="Requests by UTC hour, last 24 hours"
      formatValue={requestsLabel}
    >
      <LineChartPlot height={height} />
      <LineChartTooltip />
      <LineChartLegend />
    </LineChart>
  );
}

/** Agents stacked on everyone else per two-hour UTC window. */
export function VolumeChart({ summary, height = 288 }: { summary: TrafficSummary; height?: number }) {
  return (
    <BarChart
      layout="stacked"
      categories={summary.labels}
      series={[
        { id: "agents", name: "Agents", color: "var(--primary)", values: summary.agents },
        { id: "others", name: "Everyone else", color: OTHERS_COLOR, values: summary.others },
      ]}
      label="Requests by UTC hour, last 24 hours"
      formatValue={requestsLabel}
    >
      <BarChartPlot height={height} />
      <BarChartTooltip />
      <BarChartLegend />
    </BarChart>
  );
}

/** How the 24 hours split between agents and everyone else, window by window. */
export function AgentShareChart({ summary }: { summary: TrafficSummary }) {
  return (
    <CompositionChart
      view="bar"
      periods={summary.labels}
      series={[
        { id: "agents", name: "Agents", color: "var(--primary)", values: summary.agents },
        { id: "others", name: "Everyone else", color: OTHERS_COLOR, values: summary.others },
      ]}
      label="Agent share of requests by UTC hour"
      formatValue={requestsLabel}
    />
  );
}

/** Who sent the most recent requests, by visitor kind. */
export function VisitorMix({ requests }: { requests: TrafficRequest[] }) {
  const segments = visitorCounts(requests)
    .filter((item) => item.count > 0)
    .map((item) => ({ id: item.kind, name: item.kind, color: VISITOR_COLOR[item.kind], value: item.count }));
  if (!segments.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No requests yet.</p>;
  }
  return (
    <DonutChart segments={segments} label="Recent requests by visitor" formatValue={formatCount}>
      <div className="flex flex-col gap-5">
        <DonutChartPlot className="max-w-44">
          <DonutChartCenter totalLabel="Recent requests" />
        </DonutChartPlot>
        <DonutChartLegend
          renderValue={(segment) => (
            <>
              <span className="font-medium">{(segment.share * 100).toFixed(0)}%</span>
              <span className="ml-2 text-muted-foreground">{requestsLabel(segment.value)}</span>
            </>
          )}
        />
      </div>
    </DonutChart>
  );
}

/** A titled chart surface. */
export function ChartCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle as="h2">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** A whole-card link to another analytics page. */
export function AreaLink({
  to,
  icon,
  title,
  description,
  status,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
  status: ReactNode;
}) {
  return (
    <Card interactive className="h-full">
      <CardHeader>
        <CardTitle as="h3" className="flex items-center gap-2">
          {icon}
          <Link to={to} className={CARD_TARGET_CLASS}>
            {title}
          </Link>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden />
        </CardAction>
      </CardHeader>
      <CardContent className="mt-auto">{status}</CardContent>
    </Card>
  );
}
