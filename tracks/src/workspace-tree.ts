import type { SidebarResource } from "@/components/agents/ai-sidebar";
import type { State } from "./store";

const STATIC_ROUTES: Record<string, string> = {
  experiments: "experiments",
  runs: "runs",
  repositories: "library/repositories",
  skills: "library/skills",
  "mcp-servers": "library/mcp-servers",
  "command-line-tools": "library/command-line-tools",
  analytics: "analytics",
  members: "members",
  "api-keys": "api-keys",
  billing: "billing",
  settings: "settings",
};

export function buildTree(_state: State, _orgId: string): SidebarResource[] {
  return [
    { id: "experiments", label: "Experiments", kind: "bookmark" },
    { id: "runs", label: "Runs", kind: "bookmark" },
    {
      id: "library",
      label: "Library",
      kind: "folder",
      children: [
        { id: "repositories", label: "Repositories", kind: "file" },
        { id: "skills", label: "Skills", kind: "file" },
        { id: "mcp-servers", label: "MCP servers", kind: "file" },
        { id: "command-line-tools", label: "Command-line tools", kind: "file" },
      ],
    },
    { id: "analytics", label: "Analytics", kind: "bookmark" },
  ];
}

export function routeFor(id: string, state: State): string | null {
  if (STATIC_ROUTES[id]) return STATIC_ROUTES[id];
  if (state.experiments.some((item) => item.id === id)) return `experiments/${id}`;
  if (state.runs.some((item) => item.id === id)) return `runs/${id}`;
  return null;
}

export function activeIdFromPath(pathname: string, orgId: string, _state: State) {
  const rest = pathname.replace(`/${orgId}/`, "");
  if (rest === "experiments" || rest.startsWith("experiments/")) return "experiments";
  if (rest === "runs/new") return "";
  if (rest === "runs" || rest.startsWith("runs/")) return "runs";
  if (rest === "library/repositories") return "repositories";
  if (rest === "library/skills") return "skills";
  if (rest === "library/mcp-servers") return "mcp-servers";
  if (rest === "library/command-line-tools") return "command-line-tools";
  if (rest === "analytics" || rest.startsWith("analytics/")) return "analytics";
  if (rest === "api-keys") return "api-keys";
  if (["members", "billing", "settings"].includes(rest)) return rest;
  return "experiments";
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
