import type { SidebarResource } from "@/components/agents/ai-sidebar";
import type { State } from "./store";

const STATIC_ROUTES: Record<string, string> = {
  "experiments-all": "experiments",
  "runs-all": "runs",
  "runs-new": "runs/new",
  repositories: "library/repositories",
  skills: "library/skills",
  "mcp-servers": "library/mcp-servers",
  "command-line-tools": "library/command-line-tools",
  "analytics-home": "analytics",
  sources: "analytics/sources",
  traffic: "analytics/traffic",
  members: "members",
  "api-keys": "api-keys",
  billing: "billing",
  settings: "settings",
};

export function buildTree(state: State, orgId: string): SidebarResource[] {
  const experiments = state.experiments.filter((item) => item.orgId === orgId);
  const runs = state.runs.filter((item) => item.orgId === orgId);
  return [
    {
      id: "experiments",
      label: "Experiments",
      kind: "project",
      children: [
        { id: "experiments-all", label: "All experiments", kind: "file" },
        ...experiments.map((item) => ({ id: item.id, label: item.name, kind: "file" as const })),
      ],
    },
    {
      id: "runs",
      label: "Runs",
      kind: "project",
      children: [
        { id: "runs-all", label: "All runs", kind: "file" },
        { id: "runs-new", label: "New run", kind: "file" },
        ...runs.map((item) => ({
          id: item.id,
          label: item.scenario ?? item.prompt.slice(0, 42),
          kind: "file" as const,
        })),
      ],
    },
    {
      id: "library",
      label: "Library",
      kind: "folder",
      children: [
        { id: "repositories", label: "Repositories", kind: "bookmark" },
        { id: "skills", label: "Skills", kind: "bookmark" },
        { id: "mcp-servers", label: "MCP servers", kind: "bookmark" },
        { id: "command-line-tools", label: "Command-line tools", kind: "bookmark" },
      ],
    },
    {
      id: "analytics",
      label: "Analytics",
      kind: "project",
      children: [
        { id: "analytics-home", label: "Overview", kind: "file" },
        { id: "sources", label: "Sources", kind: "file" },
        { id: "traffic", label: "Traffic", kind: "file" },
      ],
    },
    { id: "members", label: "Members", kind: "bookmark" },
    { id: "api-keys", label: "API keys", kind: "bookmark" },
    { id: "billing", label: "Billing", kind: "bookmark" },
    { id: "settings", label: "Settings", kind: "bookmark" },
  ];
}

export function routeFor(id: string, state: State): string | null {
  if (STATIC_ROUTES[id]) return STATIC_ROUTES[id];
  if (state.experiments.some((item) => item.id === id)) return `experiments/${id}`;
  if (state.runs.some((item) => item.id === id)) return `runs/${id}`;
  return null;
}

export function activeIdFromPath(pathname: string, orgId: string, state: State) {
  const rest = pathname.replace(`/${orgId}/`, "");
  if (rest.startsWith("experiments/")) {
    const id = rest.split("/")[1];
    return id || "experiments-all";
  }
  if (rest === "experiments") return "experiments-all";
  if (rest === "runs/new") return "runs-new";
  if (rest.startsWith("runs/")) return rest.split("/")[1] ?? "runs-all";
  if (rest === "runs") return "runs-all";
  if (rest === "library/repositories") return "repositories";
  if (rest === "library/skills") return "skills";
  if (rest === "library/mcp-servers") return "mcp-servers";
  if (rest === "library/command-line-tools") return "command-line-tools";
  if (rest === "analytics/sources") return "sources";
  if (rest === "analytics/traffic") return "traffic";
  if (rest === "analytics") return "analytics-home";
  if (rest === "api-keys") return "api-keys";
  if (["members", "billing", "settings"].includes(rest)) return rest;
  return state.experiments[0]?.id ?? "experiments-all";
}

function walk(items: SidebarResource[], visit: (item: SidebarResource, parentId: string | null) => void, parentId: string | null = null) {
  for (const item of items) {
    visit(item, parentId);
    if (item.children) walk(item.children, visit, item.id);
  }
}

function contains(items: SidebarResource[], id: string) {
  let found = false;
  walk(items, (item) => {
    if (item.id === id) found = true;
  });
  return found;
}

function insert(items: SidebarResource[], parentId: string | null, child: SidebarResource): SidebarResource[] {
  if (!parentId) return [...items, child];
  return items.map((item) => {
    if (item.id === parentId) return { ...item, children: [...(item.children ?? []), child] };
    if (!item.children) return item;
    return { ...item, children: insert(item.children, parentId, child) };
  });
}

export function reconcile(current: SidebarResource[], fresh: SidebarResource[]) {
  const freshParents = new Map<string, string | null>();
  const freshNodes = new Map<string, SidebarResource>();
  walk(fresh, (item, parentId) => {
    freshParents.set(item.id, parentId);
    freshNodes.set(item.id, item);
  });

  function prune(items: SidebarResource[]): SidebarResource[] {
    return items.flatMap((item) => {
      const source = freshNodes.get(item.id);
      if (!source) return [];
      return [
        {
          ...item,
          label: source.label,
          kind: source.kind,
          children: item.children ? prune(item.children) : undefined,
        },
      ];
    });
  }

  let next = current.length ? prune(current) : fresh;
  walk(fresh, (item) => {
    if (contains(next, item.id)) return;
    next = insert(next, freshParents.get(item.id) ?? null, {
      id: item.id,
      label: item.label,
      kind: item.kind,
    });
  });
  return next;
}
