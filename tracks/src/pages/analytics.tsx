import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useStore, type TrafficSource } from "../store";
import { Dialog, Page } from "../ui";

const hours = [12, 18, 9, 22, 40, 28, 16, 33, 47, 21, 14, 19];

export function AnalyticsHome() {
  const { org = "" } = useParams();
  const sources = useStore().sources[org] ?? [];
  const tracked = sources.filter((source) => source.tracked);
  return (
    <Page title="Analytics" description="Who visits your website.">
      <div className="grid-2">
        <Link className="card card-pad" to={`/${org}/analytics/sources`} style={{ textDecoration: "none" }}>
          <h2>Sources</h2>
          <p className="lede">Connect Cloudflare or Vercel so page requests can be tracked.</p>
          <p style={{ marginBottom: 0 }}>{tracked.length ? tracked.map((source) => source.provider).join(" and ") : "Nothing connected yet."}</p>
        </Link>
        <Link className="card card-pad" to={`/${org}/analytics/traffic`} style={{ textDecoration: "none" }}>
          <h2>Traffic</h2>
          <p className="lede">Requests, visitors, and who looks like an agent.</p>
          <p style={{ marginBottom: 0 }}>{tracked.length ? "Open the last 24 hours." : "Connect a source first."}</p>
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
      action={
        <Link className="btn btn-secondary" to={`/${org}/analytics/traffic`}>
          Back to Traffic
        </Link>
      }
    >
      <div className="grid-2">
        {sources.map((source) => (
          <article key={source.provider} className="card card-pad">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <h2>{source.provider}</h2>
              {source.tracked ? <span className="badge pass">Tracked</span> : <span className="badge">Not connected</span>}
            </div>
            <p className="lede">
              {source.provider === "Cloudflare"
                ? "Connect your Cloudflare account to track page requests from a zone."
                : "Connect your Vercel account to track page requests via log drains."}
            </p>
            {source.tracked ? <p>Tracking {source.target}.</p> : null}
            <div className="row-actions">
              {source.tracked ? (
                <button className="btn btn-secondary" onClick={() => store.disconnectSource(org, source.provider)}>
                  Disconnect
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  style={source.provider === "Cloudflare" ? { background: "#f38020" } : { background: "#171717" }}
                  onClick={() => {
                    setEditing(source);
                    setTarget(source.provider === "Vercel" ? "acme-storefront" : "acme.com");
                  }}
                >
                  Connect {source.provider}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {editing ? (
        <Dialog
          title={`Connect ${editing.provider}`}
          description={editing.provider === "Vercel" ? "We track one project." : "We track one zone, with all its subdomains."}
          onClose={() => setEditing(null)}
        >
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              store.connectSource(org, editing.provider, target);
              setEditing(null);
            }}
          >
            <div className="field">
              <label htmlFor="target">{editing.provider === "Vercel" ? "Project" : "Zone"}</label>
              <input id="target" value={target} onChange={(event) => setTarget(event.target.value)} required autoFocus />
            </div>
            <div className="dialog-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit">
                Track
              </button>
            </div>
          </form>
        </Dialog>
      ) : null}
    </Page>
  );
}

export function Traffic() {
  const { org = "" } = useParams();
  const sources = useStore().sources[org] ?? [];
  if (!sources.some((source) => source.tracked)) {
    return <Navigate to={`/${org}/analytics/sources`} replace />;
  }
  const max = Math.max(...hours);
  const rows = [
    { visitor: "Agent", path: "/pricing", status: "200", at: "19:41 UTC" },
    { visitor: "Human", path: "/checkout", status: "200", at: "19:38 UTC" },
    { visitor: "Bot", path: "/robots.txt", status: "200", at: "19:22 UTC" },
    { visitor: "Agent", path: "/signup", status: "200", at: "19:11 UTC" },
    { visitor: "Crawler", path: "/blog", status: "304", at: "18:54 UTC" },
    { visitor: "Unknown", path: "/api/health", status: "200", at: "18:40 UTC" },
  ];
  return (
    <Page
      title="Traffic"
      description="Requests from the last 24 hours. Expand a request to inspect its details and headers."
      action={
        <Link className="btn btn-secondary" to={`/${org}/analytics/sources`}>
          Sources
        </Link>
      }
    >
      <section className="card card-pad">
        <h2>UTC hour</h2>
        <div className="bars" aria-label="Requests by hour">
          {hours.map((value, index) => (
            <div className="bar" key={index}>
              <span className="subtle">{String(index * 2).padStart(2, "0")}:00</span>
              <i style={{ width: `${(value / max) * 100}%`, background: index % 3 === 0 ? "var(--primary)" : "#0b6e75" }} />
              <span className="mono">{value}</span>
            </div>
          ))}
        </div>
      </section>
      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>Visitor</th>
              <th>Request</th>
              <th>Status</th>
              <th>Received</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.path + row.at}>
                <td>{row.visitor}</td>
                <td className="mono">{row.path}</td>
                <td>{row.status}</td>
                <td className="muted">{row.at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
