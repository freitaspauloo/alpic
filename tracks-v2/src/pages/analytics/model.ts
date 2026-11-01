import type { TrafficData, TrafficProvider, TrafficRequest, TrafficSource, VisitorKind } from "@/data";

export const VISITOR_KINDS: VisitorKind[] = ["Agent", "Human", "Bot", "Crawler", "Unknown"];

export const VISITOR_COLOR: Record<VisitorKind, string> = {
  Agent: "var(--primary)",
  Human: "var(--success)",
  Bot: "var(--warning)",
  Crawler: "var(--foreground)",
  Unknown: "var(--muted-foreground)",
};

/** Non-agent traffic, quieter than the agent series it sits next to. */
export const OTHERS_COLOR = "color-mix(in oklch, var(--muted-foreground) 35%, var(--background))";

export const PROVIDER_COPY: Record<TrafficProvider, { pitch: string; scope: string; field: string; missing: string }> = {
  Vercel: {
    pitch: "Connect your Vercel account to track page requests via log drains.",
    scope: "We track one project.",
    field: "Project",
    missing: "Enter the project to track.",
  },
  Cloudflare: {
    pitch: "Connect your Cloudflare account to track page requests from a zone.",
    scope: "We track one zone, with all its subdomains.",
    field: "Zone",
    missing: "Enter the zone to track.",
  },
};

const count = new Intl.NumberFormat("en-US");

export function formatCount(value: number) {
  return count.format(Math.round(value));
}

export function formatShare(value: number) {
  return `${Math.round(value)}%`;
}

export function trackedSources(sources: TrafficSource[]) {
  return sources.filter((source) => source.tracked);
}

/** A suggested project or zone for an org that hasn't connected one yet. */
export function suggestedTarget(provider: TrafficProvider, orgId: string) {
  return provider === "Vercel" ? `${orgId}-storefront` : `${orgId}.com`;
}

/** The host requests arrive on, from the first tracked source. */
export function trackedHost(sources: TrafficSource[]) {
  const source = trackedSources(sources)[0];
  if (!source) return null;
  return source.provider === "Vercel" ? `${source.target}.vercel.app` : source.target;
}

export type TrafficSummary = ReturnType<typeof summarize>;

/** Totals and per-window series for the last 24 hours of two-hour UTC buckets. */
export function summarize(traffic: TrafficData) {
  const { buckets } = traffic;
  const labels = buckets.map((bucket) => bucket.label);
  const requests = buckets.map((bucket) => bucket.requests);
  const agents = buckets.map((bucket) => bucket.agents);
  const others = buckets.map((bucket) => Math.max(0, bucket.requests - bucket.agents));
  const share = buckets.map((bucket) => (bucket.requests ? (bucket.agents / bucket.requests) * 100 : 0));
  const totalRequests = requests.reduce((sum, value) => sum + value, 0);
  const totalAgents = agents.reduce((sum, value) => sum + value, 0);
  const peakIndex = requests.reduce((best, value, index) => (value > requests[best] ? index : best), 0);
  const peak = buckets[peakIndex];
  return {
    labels,
    requests,
    agents,
    others,
    share,
    totalRequests,
    totalAgents,
    totalOthers: totalRequests - totalAgents,
    agentShare: totalRequests ? (totalAgents / totalRequests) * 100 : 0,
    peak: peak ? { ...peak, window: windowLabel(buckets.map((bucket) => bucket.label), peakIndex) } : null,
  };
}

/** "16:00" → "16:00–18:00 UTC". */
function windowLabel(labels: string[], index: number) {
  const start = labels[index] ?? "";
  const hour = Number.parseInt(start, 10);
  const end = Number.isFinite(hour) ? `${String((hour + 2) % 24).padStart(2, "0")}:00` : "";
  return end ? `${start}–${end} UTC` : `${start} UTC`;
}

export function visitorCounts(requests: TrafficRequest[]) {
  return VISITOR_KINDS.map((kind) => ({
    kind,
    count: requests.filter((request) => request.visitor === kind).length,
  }));
}

const USER_AGENTS: Record<VisitorKind, string> = {
  Agent: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
  Human: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  Bot: "python-requests/2.32.3",
  Crawler: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  Unknown: "-",
};

const CLASSIFICATION: Record<VisitorKind, string> = {
  Agent: "Its user agent names an AI assistant fetching the page for a person.",
  Human: "A browser user agent with a normal navigation pattern.",
  Bot: "A scripted HTTP client rather than a browser.",
  Crawler: "Its user agent names a search engine crawler.",
  Unknown: "No user agent was sent, so the request couldn't be classified.",
};

export function userAgent(kind: VisitorKind) {
  return USER_AGENTS[kind];
}

export function classification(kind: VisitorKind) {
  return CLASSIFICATION[kind];
}

/** The request line and headers the inspector shows, derived from the tracked request. */
export function requestHeaders(request: TrafficRequest, host: string | null) {
  const lines = [
    `GET ${request.path} HTTP/2`,
    `host: ${host ?? "unknown"}`,
    `user-agent: ${USER_AGENTS[request.visitor]}`,
    `accept: ${request.path.startsWith("/api") ? "application/json" : "text/html,application/xhtml+xml"}`,
    "accept-encoding: gzip, br",
  ];
  if (request.status === "304") lines.push('if-none-match: "W/9f2c-18a"');
  if (request.visitor === "Human") lines.push("accept-language: en-US,en;q=0.9");
  return lines.join("\n");
}

export function statusBadge(status: string) {
  const code = Number.parseInt(status, 10);
  if (code >= 500) return "danger" as const;
  if (code >= 400) return "warning" as const;
  if (code >= 300) return "neutral" as const;
  return "success" as const;
}
