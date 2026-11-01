import { useMemo } from "react";
import { Activity, Cable } from "lucide-react";
import { Page, PageSection } from "@/app/page-layout";
import { RouterButtonLink } from "@/app/router-link";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Card } from "@/components/motion/card";
import { useOrgData } from "@/data";
import { summarize, trackedSources } from "./analytics/model";
import { AgentShareChart, AreaLink, ChartCard, KpiGrid, TrendChart, VisitorMix } from "./analytics/parts";

export { Sources } from "./analytics/sources";
export { Traffic } from "./analytics/traffic";

export function AnalyticsHome() {
  const { orgId, sources, traffic } = useOrgData();
  const tracked = trackedSources(sources);
  const summary = useMemo(() => summarize(traffic), [traffic]);
  const live = tracked.length > 0 && traffic.buckets.length > 0;

  return (
    <Page
      title="Analytics"
      description="Who visits your website."
      actions={
        live ? (
          <>
            <RouterButtonLink to={`/${orgId}/analytics/sources`} variant="secondary" size="sm">
              Sources
            </RouterButtonLink>
            <RouterButtonLink to={`/${orgId}/analytics/traffic`} size="sm">
              Open traffic
            </RouterButtonLink>
          </>
        ) : null
      }
    >
      {live ? (
        <>
          <PageSection
            title="Last 24 hours"
            description={`Requests to ${tracked.map((source) => source.target).join(" and ")}, in two-hour UTC windows.`}
          >
            <KpiGrid summary={summary} />
          </PageSection>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard
              title="Requests"
              description="Every request, with the ones that came from agents."
              className="lg:col-span-2"
            >
              <TrendChart summary={summary} height={330} />
            </ChartCard>
            <ChartCard title="Visitors" description="Who sent the most recent requests.">
              <VisitorMix requests={traffic.requests} />
            </ChartCard>
          </div>

          <ChartCard title="Agent share" description="How much of each window came from agents.">
            <AgentShareChart summary={summary} />
          </ChartCard>
        </>
      ) : (
        <Card variant="muted" className="items-start">
          <div className="flex flex-col items-start gap-4 px-6">
            <p className="text-sm text-muted-foreground">
              Connect Cloudflare or Vercel and we'll start counting requests, and which ones come from agents.
            </p>
            <RouterButtonLink to={`/${orgId}/analytics/sources`} size="sm">
              Connect a source
            </RouterButtonLink>
          </div>
        </Card>
      )}

      <PageSection title="Explore">
        <div className="grid gap-4 md:grid-cols-2">
          <AreaLink
            to={`/${orgId}/analytics/sources`}
            icon={<Cable className="size-4 text-muted-foreground" aria-hidden />}
            title="Sources"
            description="Connect Cloudflare or Vercel so page requests can be tracked."
            status={
              tracked.length ? (
                <div className="flex flex-wrap gap-2">
                  {tracked.map((source) => (
                    <AnimatedBadge key={source.provider} status="success" size="sm">
                      {source.provider}
                    </AnimatedBadge>
                  ))}
                </div>
              ) : (
                <AnimatedBadge status="neutral" size="sm">
                  Nothing connected yet.
                </AnimatedBadge>
              )
            }
          />
          <AreaLink
            to={`/${orgId}/analytics/${tracked.length ? "traffic" : "sources"}`}
            icon={<Activity className="size-4 text-muted-foreground" aria-hidden />}
            title="Traffic"
            description="Requests, visitors, and who looks like an agent."
            status={
              <p className="text-sm text-foreground">
                {tracked.length ? "Open the last 24 hours." : "Connect a source first."}
              </p>
            }
          />
        </div>
      </PageSection>
    </Page>
  );
}
