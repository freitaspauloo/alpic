import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import type { TableColumn } from "@/components/motion/table";
import { useStore, type TrafficSource } from "../store";
import {
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  FormActions,
  FormShell,
  Page,
  SimpleDataTable,
  Status,
  TextField,
} from "../ui";

const hours = [12, 18, 9, 22, 40, 28, 16, 33, 47, 21, 14, 19];

export function AnalyticsHome() {
  const { org = "" } = useParams();
  const sources = useStore().sources[org] ?? [];
  const tracked = sources.filter((source) => source.tracked);
  return (
    <Page title="Analytics" description="Who visits your website.">
      <div className="grid gap-4 md:grid-cols-2">
        <Link to={`/${org}/analytics/sources`} className="block no-underline">
          <Card variant="outlined" interactive className="h-full transition-colors hover:bg-muted/40">
            <CardHeader>
              <CardTitle as="h2">Sources</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-muted-foreground">
              <p>Connect Cloudflare or Vercel so page requests can be tracked.</p>
              <p className="text-foreground">{tracked.length ? tracked.map((source) => source.provider).join(" and ") : "Nothing connected yet."}</p>
            </CardContent>
          </Card>
        </Link>
        <Link to={`/${org}/analytics/traffic`} className="block no-underline">
          <Card variant="outlined" interactive className="h-full transition-colors hover:bg-muted/40">
            <CardHeader>
              <CardTitle as="h2">Traffic</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-muted-foreground">
              <p>Requests, visitors, and who looks like an agent.</p>
              <p className="text-foreground">{tracked.length ? "Open the last 24 hours." : "Connect a source first."}</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </Page>
  );
}

export function Sources() {
  const { org = "" } = useParams();
  const store = useStore();
  const sources = store.sources[org] ?? [];
  const [editing, setEditing] = useState<TrafficSource | null>(null);
  const [target, setTarget] = useState("");
  return (
    <Page
      title="Sources"
      description="We track one Vercel project, or one Cloudflare zone and all of its subdomains."
      action={<ButtonLink to={`/${org}/analytics/traffic`} variant="secondary">Back to Traffic</ButtonLink>}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {sources.map((source) => (
          <Card key={source.provider} variant="outlined">
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
              <CardTitle as="h2">{source.provider}</CardTitle>
              {source.tracked ? (
                <Status status="Passed" />
              ) : (
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">Not connected</span>
              )}
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <p className="text-muted-foreground">
                {source.provider === "Cloudflare"
                  ? "Connect your Cloudflare account to track page requests from a zone."
                  : "Connect your Vercel account to track page requests via log drains."}
              </p>
              {source.tracked ? <p>Tracking {source.target}.</p> : null}
              <div className="flex flex-wrap gap-2">
                {source.tracked ? (
                  <Button type="button" variant="secondary" onClick={() => store.disconnectSource(org, source.provider)}>
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className={source.provider === "Cloudflare" ? "bg-[#f38020] hover:bg-[#f38020]/90" : "bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"}
                    onClick={() => {
                      setEditing(source);
                      setTarget(source.provider === "Vercel" ? "acme-storefront" : "acme.com");
                    }}
                  >
                    Connect {source.provider}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {editing ? (
        <Dialog
          title={`Connect ${editing.provider}`}
          description={editing.provider === "Vercel" ? "We track one project." : "We track one zone, with all its subdomains."}
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              store.connectSource(org, editing.provider, target);
              setEditing(null);
            }}
          >
            <FormShell>
              <TextField
                id="target"
                label={editing.provider === "Vercel" ? "Project" : "Zone"}
                value={target}
                onChange={setTarget}
                required
                autoFocus
              />
              <FormActions onCancel={() => setEditing(null)} submitLabel="Track" />
            </FormShell>
          </form>
        </Dialog>
      ) : null}
    </Page>
  );
}

type TrafficRow = { visitor: string; path: string; status: string; at: string };

export function Traffic() {
  const { org = "" } = useParams();
  const sources = useStore().sources[org] ?? [];
  if (!sources.some((source) => source.tracked)) {
    return <Navigate to={`/${org}/analytics/sources`} replace />;
  }
  const max = Math.max(...hours);
  const rows: TrafficRow[] = [
    { visitor: "Agent", path: "/pricing", status: "200", at: "19:41 UTC" },
    { visitor: "Human", path: "/checkout", status: "200", at: "19:38 UTC" },
    { visitor: "Bot", path: "/robots.txt", status: "200", at: "19:22 UTC" },
    { visitor: "Agent", path: "/signup", status: "200", at: "19:11 UTC" },
    { visitor: "Crawler", path: "/blog", status: "304", at: "18:54 UTC" },
    { visitor: "Unknown", path: "/api/health", status: "200", at: "18:40 UTC" },
  ];

  const columns = useMemo((): TableColumn<TrafficRow>[] => {
    return [
      { key: "visitor", header: "Visitor", cell: (row) => row.visitor },
      { key: "path", header: "Request", cell: (row) => <span className="font-mono text-xs">{row.path}</span> },
      { key: "status", header: "Status", cell: (row) => row.status },
      { key: "at", header: "Received", cell: (row) => <span className="text-muted-foreground">{row.at}</span> },
    ];
  }, []);

  return (
    <Page
      title="Traffic"
      description="Requests from the last 24 hours. Expand a request to inspect its details and headers."
      action={<ButtonLink to={`/${org}/analytics/sources`} variant="secondary">Sources</ButtonLink>}
    >
      <Card variant="outlined">
        <CardHeader>
          <CardTitle as="h2">UTC hour</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2" aria-label="Requests by hour">
          {hours.map((value, index) => (
            <div className="grid grid-cols-[3rem_1fr_2rem] items-center gap-2 text-xs" key={index}>
              <span className="text-muted-foreground">{String(index * 2).padStart(2, "0")}:00</span>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(value / max) * 100}%`, background: index % 3 === 0 ? "var(--primary)" : "#0b6e75" }}
                />
              </div>
              <span className="font-mono tabular-nums">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="mt-4">
        <SimpleDataTable data={rows} columns={columns} getRowId={(row) => `${row.path}-${row.at}`} />
      </div>
    </Page>
  );
}
