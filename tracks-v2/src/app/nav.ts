import {
  ChartLine,
  FlaskConical,
  FolderGit2,
  Folder,
  Play,
  Plus,
  Server,
  Sparkles,
  SquareTerminal,
  type LucideIcon,
} from "lucide-react";
import type { SidebarResource } from "@/components/agents/ai-sidebar";
import type { State } from "@/data";

/** The whole sidebar tree. Account pages (members, API keys, billing, settings) live in the user menu instead. */
export const NAV_TREE: SidebarResource[] = [
  { id: "new-experiment", label: "New experiment", kind: "file" },
  { id: "experiments", label: "Experiments", kind: "file" },
  { id: "runs", label: "Runs", kind: "file" },
  { id: "library", label: "Library", kind: "file" },
  { id: "analytics", label: "Analytics", kind: "file" },
];

export const LIBRARY_ID = "library";

/** Org-relative path for each navigable tree id. */
export const NAV_PATHS: Record<string, string> = {
  "new-experiment": "experiments/new",
  experiments: "experiments",
  runs: "runs",
  library: "library",
  repositories: "library/repositories",
  skills: "library/skills",
  "mcp-servers": "library/mcp-servers",
  "command-line-tools": "library/command-line-tools",
  analytics: "analytics",
};

export const NAV_ICONS: Record<string, LucideIcon> = {
  "new-experiment": Plus,
  experiments: FlaskConical,
  runs: Play,
  library: Folder,
  repositories: FolderGit2,
  skills: Sparkles,
  "mcp-servers": Server,
  "command-line-tools": SquareTerminal,
  analytics: ChartLine,
};

/** The items the collapsed icon rail shows. */
export const RAIL_ITEMS = ["new-experiment", "experiments", "runs", LIBRARY_ID, "analytics"] as const;

/** The tree id that owns a pathname, or null for pages outside the tree (account pages). */
export function activeNavId(pathname: string, orgId: string): string | null {
  const rest = pathname.replace(new RegExp(`^/${orgId}/?`), "");
  const [section, second] = rest.split("/");
  if (section === "experiments" && second === "new") return "new-experiment";
  // A specific experiment is a chat under the divider, not the Experiments tab.
  if (section === "experiments" && second) return null;
  if (section === "experiments" || section === "runs" || section === "analytics" || section === "library") return section;
  return null;
}

export type Crumb = { key: string; label: string; to?: string };

const LABELS: Record<string, string> = {
  experiments: "Experiments",
  runs: "Runs",
  library: "Library",
  repositories: "Repositories",
  skills: "Skills",
  "mcp-servers": "MCP servers",
  "command-line-tools": "Command-line tools",
  analytics: "Analytics",
  sources: "Sources",
  traffic: "Traffic",
  "api-keys": "API keys",
  billing: "Billing",
  members: "Members",
  settings: "Settings",
};

function shorten(text: string, max = 40) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Breadcrumb trail for the topbar: org › section › record › action. The last crumb is the current page. */
export function breadcrumbs(pathname: string, orgId: string, state: Pick<State, "organizations" | "experiments" | "runs">): Crumb[] {
  const org = state.organizations.find((item) => item.id === orgId);
  const base = `/${orgId}`;
  const crumbs: Crumb[] = [{ key: "org", label: org?.name ?? orgId, to: `${base}/experiments` }];
  const parts = pathname.replace(new RegExp(`^${base}/?`), "").split("/").filter(Boolean);
  const [section, second, third] = parts;
  if (!section) return crumbs;

  if (section === "library") {
    crumbs.push({ key: "library", label: LABELS.library, to: `${base}/library` });
    if (second) crumbs.push({ key: `library/${second}`, label: LABELS[second] ?? second, to: `${base}/library/${second}` });
    return crumbs;
  }

  crumbs.push({ key: section, label: LABELS[section] ?? section, to: `${base}/${section}` });

  if (section === "experiments" && second === "new") {
    crumbs.push({ key: "new-experiment", label: "New experiment" });
  } else if (section === "experiments" && second) {
    const experiment = state.experiments.find((item) => item.id === second);
    crumbs.push({ key: `experiment/${second}`, label: shorten(experiment?.name ?? "Experiment"), to: `${base}/experiments/${second}` });
    if (third === "edit") crumbs.push({ key: "edit", label: "Edit" });
  } else if (section === "runs" && second) {
    if (second === "new") {
      crumbs.push({ key: "new-run", label: "New run" });
    } else {
      const run = state.runs.find((item) => item.id === second);
      crumbs.push({ key: `run/${second}`, label: shorten(run?.scenario ?? run?.prompt ?? "Run") });
    }
  } else if (section === "analytics" && second) {
    crumbs.push({ key: `analytics/${second}`, label: LABELS[second] ?? second });
  }
  return crumbs;
}
