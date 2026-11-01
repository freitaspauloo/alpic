import {
  BarChart3,
  BookOpen,
  Box,
  ChartLine,
  CirclePlus,
  FlaskConical,
  Folder,
  FolderGit2,
  Home,
  Layers,
  LayoutGrid,
  Play,
  Plus,
  Server,
  Settings,
  Sparkles,
  SquareTerminal,
  Terminal,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type IconFamily = "lucide";

export type IconSettings = {
  family: IconFamily;
  strokeWidth: number;
  nav: Record<string, string>;
};

export const ICON_CATALOG: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: "plus", label: "Plus", Icon: Plus },
  { id: "circle-plus", label: "Circle plus", Icon: CirclePlus },
  { id: "flask-conical", label: "Flask", Icon: FlaskConical },
  { id: "play", label: "Play", Icon: Play },
  { id: "folder", label: "Folder", Icon: Folder },
  { id: "folder-git-2", label: "Folder git", Icon: FolderGit2 },
  { id: "chart-line", label: "Chart line", Icon: ChartLine },
  { id: "bar-chart-3", label: "Bar chart", Icon: BarChart3 },
  { id: "sparkles", label: "Sparkles", Icon: Sparkles },
  { id: "server", label: "Server", Icon: Server },
  { id: "square-terminal", label: "Square terminal", Icon: SquareTerminal },
  { id: "terminal", label: "Terminal", Icon: Terminal },
  { id: "layout-grid", label: "Grid", Icon: LayoutGrid },
  { id: "layers", label: "Layers", Icon: Layers },
  { id: "box", label: "Box", Icon: Box },
  { id: "home", label: "Home", Icon: Home },
  { id: "book-open", label: "Book", Icon: BookOpen },
  { id: "settings", label: "Settings", Icon: Settings },
  { id: "wrench", label: "Wrench", Icon: Wrench },
];

const ICON_BY_ID = Object.fromEntries(ICON_CATALOG.map((item) => [item.id, item.Icon])) as Record<string, LucideIcon>;

export const NAV_ICON_SLOTS = [
  { id: "new-experiment", label: "New experiment" },
  { id: "experiments", label: "Experiments" },
  { id: "runs", label: "Runs" },
  { id: "library", label: "Library" },
  { id: "analytics", label: "Analytics" },
  { id: "repositories", label: "Repositories" },
  { id: "skills", label: "Skills" },
  { id: "mcp-servers", label: "MCP servers" },
  { id: "command-line-tools", label: "CLI tools" },
] as const;

export const DEFAULT_NAV_ICON_IDS: Record<string, string> = {
  "new-experiment": "plus",
  experiments: "flask-conical",
  runs: "play",
  library: "folder",
  analytics: "chart-line",
  repositories: "folder-git-2",
  skills: "sparkles",
  "mcp-servers": "server",
  "command-line-tools": "square-terminal",
};

export const DEFAULT_ICON_SETTINGS: IconSettings = {
  family: "lucide",
  strokeWidth: 2,
  nav: { ...DEFAULT_NAV_ICON_IDS },
};

export function resolveNavIcon(navId: string, settings: IconSettings): LucideIcon {
  const id = settings.nav[navId] ?? DEFAULT_NAV_ICON_IDS[navId];
  return ICON_BY_ID[id] ?? Plus;
}

export function mergeIconSettings(value: unknown): IconSettings {
  const base = DEFAULT_ICON_SETTINGS;
  if (!value || typeof value !== "object") {
    return { ...base, nav: { ...base.nav } };
  }
  const raw = value as Partial<IconSettings>;
  const nav = { ...DEFAULT_NAV_ICON_IDS };
  if (raw.nav && typeof raw.nav === "object") {
    for (const [key, id] of Object.entries(raw.nav)) {
      if (typeof id === "string" && id.trim()) nav[key] = id;
    }
  }
  return {
    family: raw.family === "lucide" ? "lucide" : base.family,
    strokeWidth: typeof raw.strokeWidth === "number" ? raw.strokeWidth : base.strokeWidth,
    nav,
  };
}
