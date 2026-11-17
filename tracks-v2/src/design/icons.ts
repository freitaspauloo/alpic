import {
  BeakerIcon as BeakerOutline,
  BookOpenIcon as BookOpenOutline,
  ChartBarIcon as ChartBarOutline,
  Cog6ToothIcon as CogOutline,
  CommandLineIcon as CommandOutline,
  CubeIcon as CubeOutline,
  FolderIcon as FolderOutline,
  GlobeAltIcon as GlobeOutline,
  HomeIcon as HomeOutline,
  PlayIcon as PlayOutline,
  PlusCircleIcon as PlusCircleOutline,
  PlusIcon as PlusOutline,
  PresentationChartLineIcon as ChartLineOutline,
  ServerStackIcon as ServerOutline,
  SparklesIcon as SparklesOutline,
  Square3Stack3DIcon as StackOutline,
  Squares2X2Icon as GridOutline,
  WrenchIcon as WrenchOutline,
} from "@heroicons/react/24/outline";
import {
  BeakerIcon as BeakerSolid,
  BookOpenIcon as BookOpenSolid,
  ChartBarIcon as ChartBarSolid,
  Cog6ToothIcon as CogSolid,
  CommandLineIcon as CommandSolid,
  CubeIcon as CubeSolid,
  FolderIcon as FolderSolid,
  GlobeAltIcon as GlobeSolid,
  HomeIcon as HomeSolid,
  PlayIcon as PlaySolid,
  PlusCircleIcon as PlusCircleSolid,
  PlusIcon as PlusSolid,
  PresentationChartLineIcon as ChartLineSolid,
  ServerStackIcon as ServerSolid,
  SparklesIcon as SparklesSolid,
  Square3Stack3DIcon as StackSolid,
  Squares2X2Icon as GridSolid,
  WrenchIcon as WrenchSolid,
} from "@heroicons/react/24/solid";
import {
  BookOpen,
  ChartBar,
  ChartLine,
  Cube,
  Flask,
  Folder,
  Gear,
  Globe as PhosphorGlobe,
  GitBranch,
  HardDrives,
  House,
  Play as PhosphorPlay,
  Plus as PhosphorPlus,
  PlusCircle,
  Sparkle,
  SquaresFour,
  Stack,
  Terminal,
  TerminalWindow,
  Wrench as PhosphorWrench,
  type Icon as PhosphorIcon,
  type IconWeight as PhosphorWeight,
} from "@phosphor-icons/react";
import {
  BookOpen as PixelBook,
  BookOpenSharp,
  Box as PixelBox,
  ChartBarBig,
  ChartBarBigSharp,
  ChartLine as PixelChartLine,
  ChartLineSharp,
  Files,
  FilesSharp,
  Folder as PixelFolder,
  FolderSharp,
  Globe as PixelGlobe,
  Gear as PixelGear,
  GitBranch as PixelGit,
  GitBranchSharp,
  Grid3x3,
  Grid3x3Sharp,
  Home as PixelHome,
  HomeSharp,
  Play as PixelPlay,
  Plus as PixelPlus,
  PlusBox,
  PlusBoxSharp,
  Server as PixelServer,
  ServerSharp,
  Sparkles as PixelSparkles,
  Terminal as PixelTerminal,
  TerminalSharp,
  TestTube,
  TestTubeSharp,
  Tools as PixelTools,
} from "pixelarticons/react";
import {
  RiAddCircleFill,
  RiAddCircleLine,
  RiAddFill,
  RiAddLine,
  RiBarChartFill,
  RiBarChartLine,
  RiBookOpenFill,
  RiBookOpenLine,
  RiBox3Fill,
  RiBox3Line,
  RiFlaskFill,
  RiFlaskLine,
  RiFolderFill,
  RiFolderLine,
  RiGitBranchFill,
  RiGitBranchLine,
  RiGlobeFill,
  RiGlobeLine,
  RiHomeFill,
  RiHomeLine,
  RiLayoutGridFill,
  RiLayoutGridLine,
  RiLineChartFill,
  RiLineChartLine,
  RiPlayFill,
  RiPlayLine,
  RiServerFill,
  RiServerLine,
  RiSettings3Fill,
  RiSettings3Line,
  RiSparklingFill,
  RiSparklingLine,
  RiStackFill,
  RiStackLine,
  RiTerminalBoxFill,
  RiTerminalBoxLine,
  RiTerminalFill,
  RiTerminalLine,
  RiToolsFill,
  RiToolsLine,
} from "@remixicon/react";
import {
  IconBook,
  IconBox,
  IconChartBar,
  IconChartLine,
  IconCirclePlus,
  IconFlask,
  IconFolder,
  IconWorld,
  IconHome,
  IconLayoutGrid,
  IconPlayerPlay,
  IconPlus,
  IconServer,
  IconSettings,
  IconSparkles,
  IconStack2,
  IconTerminal2,
  IconTool,
  type Icon as TablerIcon,
} from "@tabler/icons-react";
import {
  BarChart3,
  BookOpen as LucideBook,
  Box,
  ChartLine as LucideChartLine,
  CirclePlus,
  FlaskConical,
  Folder as LucideFolder,
  FolderGit2,
  Globe,
  Home,
  Layers,
  LayoutGrid,
  Play,
  Plus,
  Server,
  Settings,
  Sparkles,
  SquareTerminal,
  Terminal as LucideTerminal,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { createElement, type ComponentType, type SVGProps } from "react";

export type AppIcon = ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean | "true" }>;

export type IconFamily = "lucide" | "phosphor" | "hero" | "tabler" | "remix" | "pixel" | "pixel-sharp";

export type IconWeight = "thin" | "light" | "regular" | "bold" | "solid" | "duotone";

export type IconSettings = {
  family: IconFamily;
  weight: IconWeight;
  strokeWidth: number;
  nav: Record<string, string>;
};

type IconChoice = `${IconFamily}:${IconWeight}`;

type PixelIcon = ComponentType<SVGProps<SVGSVGElement>>;

const WEIGHT_LABELS: Record<IconWeight, string> = {
  thin: "Thin",
  light: "Light",
  regular: "Regular",
  bold: "Bold",
  solid: "Solid",
  duotone: "Duotone",
};

const FAMILY_WEIGHTS: Record<IconFamily, IconWeight[]> = {
  lucide: ["thin", "light", "regular", "bold"],
  phosphor: ["thin", "light", "regular", "bold", "solid", "duotone"],
  hero: ["regular", "solid"],
  tabler: ["thin", "light", "regular", "bold"],
  remix: ["regular", "solid"],
  pixel: ["regular"],
  "pixel-sharp": ["regular"],
};

const STROKE_BY_WEIGHT: Partial<Record<IconWeight, number>> = {
  thin: 1.25,
  light: 1.5,
  regular: 2,
  bold: 2.5,
};

const PHOSPHOR_WEIGHT: Record<IconWeight, PhosphorWeight> = {
  thin: "thin",
  light: "light",
  regular: "regular",
  bold: "bold",
  solid: "fill",
  duotone: "duotone",
};

/** Old combined family ids, plus the current ones, so saved themes still resolve. */
const LEGACY_FAMILY: Record<string, { family: IconFamily; weight: IconWeight }> = {
  lucide: { family: "lucide", weight: "regular" },
  phosphor: { family: "phosphor", weight: "regular" },
  "phosphor-thin": { family: "phosphor", weight: "thin" },
  "phosphor-light": { family: "phosphor", weight: "light" },
  "phosphor-bold": { family: "phosphor", weight: "bold" },
  "phosphor-fill": { family: "phosphor", weight: "solid" },
  "phosphor-duotone": { family: "phosphor", weight: "duotone" },
  hero: { family: "hero", weight: "regular" },
  "hero-solid": { family: "hero", weight: "solid" },
  tabler: { family: "tabler", weight: "regular" },
  remix: { family: "remix", weight: "regular" },
  "remix-fill": { family: "remix", weight: "solid" },
  pixel: { family: "pixel", weight: "regular" },
  "pixel-sharp": { family: "pixel-sharp", weight: "regular" },
};

export const ICON_FAMILIES: { id: IconFamily; label: string; group: string }[] = [
  { id: "lucide", label: "Lucide", group: "Standard" },
  { id: "phosphor", label: "Phosphor", group: "Standard" },
  { id: "hero", label: "Heroicons", group: "Standard" },
  { id: "tabler", label: "Tabler", group: "Standard" },
  { id: "remix", label: "Remix", group: "Standard" },
  { id: "pixel", label: "Pixel", group: "Pixel" },
  { id: "pixel-sharp", label: "Pixel Sharp", group: "Pixel" },
];

export function weightsFor(family: IconFamily) {
  return FAMILY_WEIGHTS[family].map((id) => ({ id, label: WEIGHT_LABELS[id] }));
}

export function clampWeight(family: IconFamily, weight: string): IconWeight {
  const allowed = FAMILY_WEIGHTS[family];
  if (allowed.includes(weight as IconWeight)) return weight as IconWeight;
  return allowed.includes("regular") ? "regular" : allowed[0];
}

export function familyUsesStroke(family: IconFamily, weight: IconWeight = "regular") {
  if (family === "lucide" || family === "tabler") return true;
  if (family === "hero") return weight !== "solid";
  return false;
}

export function strokeForWeight(weight: IconWeight) {
  return STROKE_BY_WEIGHT[weight] ?? null;
}

export function isPixelFamily(family: IconFamily) {
  return family === "pixel" || family === "pixel-sharp";
}

function withPhosphor(Icon: PhosphorIcon, weight: PhosphorWeight): AppIcon {
  return function PhosphorGlyph({ className, "aria-hidden": ariaHidden }) {
    return createElement(Icon, { className, weight, "aria-hidden": ariaHidden });
  };
}

function withTabler(Icon: TablerIcon): AppIcon {
  return function TablerGlyph({ className, strokeWidth, "aria-hidden": ariaHidden }) {
    return createElement(Icon, { className, stroke: strokeWidth, "aria-hidden": ariaHidden });
  };
}

function withPixel(Icon: PixelIcon): AppIcon {
  return function PixelGlyph({ className, "aria-hidden": ariaHidden }) {
    return createElement(Icon, {
      className,
      "aria-hidden": ariaHidden,
      shapeRendering: "crispEdges",
    });
  };
}

type GlyphSet = {
  lucide: LucideIcon;
  phosphor: PhosphorIcon;
  hero: AppIcon;
  heroSolid: AppIcon;
  tabler: TablerIcon;
  remix: ComponentType<{ className?: string; strokeWidth?: string | number }>;
  remixFill: ComponentType<{ className?: string; strokeWidth?: string | number }>;
  pixel: PixelIcon;
  pixelSharp: PixelIcon;
};

function buildIcons(set: GlyphSet): Partial<Record<IconChoice, AppIcon>> {
  const icons: Partial<Record<IconChoice, AppIcon>> = {};
  const put = (family: IconFamily, weight: IconWeight, icon: AppIcon) => {
    icons[`${family}:${weight}`] = icon;
  };

  for (const weight of FAMILY_WEIGHTS.lucide) put("lucide", weight, set.lucide);

  const tabler = withTabler(set.tabler);
  for (const weight of FAMILY_WEIGHTS.tabler) put("tabler", weight, tabler);

  for (const weight of FAMILY_WEIGHTS.phosphor) {
    put("phosphor", weight, withPhosphor(set.phosphor, PHOSPHOR_WEIGHT[weight]));
  }

  put("hero", "regular", set.hero);
  put("hero", "solid", set.heroSolid);
  put("remix", "regular", set.remix as AppIcon);
  put("remix", "solid", set.remixFill as AppIcon);
  put("pixel", "regular", withPixel(set.pixel));
  put("pixel-sharp", "regular", withPixel(set.pixelSharp));
  return icons;
}

const CATALOG: { id: string; label: string; icons: Partial<Record<IconChoice, AppIcon>> }[] = [
  {
    id: "plus",
    label: "Plus",
    icons: buildIcons({
      lucide: Plus,
      phosphor: PhosphorPlus,
      hero: PlusOutline,
      heroSolid: PlusSolid,
      tabler: IconPlus,
      remix: RiAddLine,
      remixFill: RiAddFill,
      pixel: PixelPlus,
      pixelSharp: PixelPlus,
    }),
  },
  {
    id: "circle-plus",
    label: "Circle plus",
    icons: buildIcons({
      lucide: CirclePlus,
      phosphor: PlusCircle,
      hero: PlusCircleOutline,
      heroSolid: PlusCircleSolid,
      tabler: IconCirclePlus,
      remix: RiAddCircleLine,
      remixFill: RiAddCircleFill,
      pixel: PlusBox,
      pixelSharp: PlusBoxSharp,
    }),
  },
  {
    id: "flask-conical",
    label: "Flask",
    icons: buildIcons({
      lucide: FlaskConical,
      phosphor: Flask,
      hero: BeakerOutline,
      heroSolid: BeakerSolid,
      tabler: IconFlask,
      remix: RiFlaskLine,
      remixFill: RiFlaskFill,
      pixel: TestTube,
      pixelSharp: TestTubeSharp,
    }),
  },
  {
    id: "play",
    label: "Play",
    icons: buildIcons({
      lucide: Play,
      phosphor: PhosphorPlay,
      hero: PlayOutline,
      heroSolid: PlaySolid,
      tabler: IconPlayerPlay,
      remix: RiPlayLine,
      remixFill: RiPlayFill,
      pixel: PixelPlay,
      pixelSharp: PixelPlay,
    }),
  },
  {
    id: "folder",
    label: "Folder",
    icons: buildIcons({
      lucide: LucideFolder,
      phosphor: Folder,
      hero: FolderOutline,
      heroSolid: FolderSolid,
      tabler: IconFolder,
      remix: RiFolderLine,
      remixFill: RiFolderFill,
      pixel: PixelFolder,
      pixelSharp: FolderSharp,
    }),
  },
  {
    id: "globe",
    label: "Globe",
    icons: buildIcons({
      lucide: Globe,
      phosphor: PhosphorGlobe,
      hero: GlobeOutline,
      heroSolid: GlobeSolid,
      tabler: IconWorld,
      remix: RiGlobeLine,
      remixFill: RiGlobeFill,
      pixel: PixelGlobe,
      pixelSharp: PixelGlobe,
    }),
  },
  {
    id: "folder-git-2",
    label: "Folder git",
    icons: buildIcons({
      lucide: FolderGit2,
      phosphor: GitBranch,
      hero: FolderOutline,
      heroSolid: FolderSolid,
      tabler: IconFolder,
      remix: RiGitBranchLine,
      remixFill: RiGitBranchFill,
      pixel: PixelGit,
      pixelSharp: GitBranchSharp,
    }),
  },
  {
    id: "chart-line",
    label: "Chart line",
    icons: buildIcons({
      lucide: LucideChartLine,
      phosphor: ChartLine,
      hero: ChartLineOutline,
      heroSolid: ChartLineSolid,
      tabler: IconChartLine,
      remix: RiLineChartLine,
      remixFill: RiLineChartFill,
      pixel: PixelChartLine,
      pixelSharp: ChartLineSharp,
    }),
  },
  {
    id: "bar-chart-3",
    label: "Bar chart",
    icons: buildIcons({
      lucide: BarChart3,
      phosphor: ChartBar,
      hero: ChartBarOutline,
      heroSolid: ChartBarSolid,
      tabler: IconChartBar,
      remix: RiBarChartLine,
      remixFill: RiBarChartFill,
      pixel: ChartBarBig,
      pixelSharp: ChartBarBigSharp,
    }),
  },
  {
    id: "sparkles",
    label: "Sparkles",
    icons: buildIcons({
      lucide: Sparkles,
      phosphor: Sparkle,
      hero: SparklesOutline,
      heroSolid: SparklesSolid,
      tabler: IconSparkles,
      remix: RiSparklingLine,
      remixFill: RiSparklingFill,
      pixel: PixelSparkles,
      pixelSharp: PixelSparkles,
    }),
  },
  {
    id: "server",
    label: "Server",
    icons: buildIcons({
      lucide: Server,
      phosphor: HardDrives,
      hero: ServerOutline,
      heroSolid: ServerSolid,
      tabler: IconServer,
      remix: RiServerLine,
      remixFill: RiServerFill,
      pixel: PixelServer,
      pixelSharp: ServerSharp,
    }),
  },
  {
    id: "square-terminal",
    label: "Square terminal",
    icons: buildIcons({
      lucide: SquareTerminal,
      phosphor: TerminalWindow,
      hero: CommandOutline,
      heroSolid: CommandSolid,
      tabler: IconTerminal2,
      remix: RiTerminalBoxLine,
      remixFill: RiTerminalBoxFill,
      pixel: PixelTerminal,
      pixelSharp: TerminalSharp,
    }),
  },
  {
    id: "terminal",
    label: "Terminal",
    icons: buildIcons({
      lucide: LucideTerminal,
      phosphor: Terminal,
      hero: CommandOutline,
      heroSolid: CommandSolid,
      tabler: IconTerminal2,
      remix: RiTerminalLine,
      remixFill: RiTerminalFill,
      pixel: PixelTerminal,
      pixelSharp: TerminalSharp,
    }),
  },
  {
    id: "layout-grid",
    label: "Grid",
    icons: buildIcons({
      lucide: LayoutGrid,
      phosphor: SquaresFour,
      hero: GridOutline,
      heroSolid: GridSolid,
      tabler: IconLayoutGrid,
      remix: RiLayoutGridLine,
      remixFill: RiLayoutGridFill,
      pixel: Grid3x3,
      pixelSharp: Grid3x3Sharp,
    }),
  },
  {
    id: "layers",
    label: "Layers",
    icons: buildIcons({
      lucide: Layers,
      phosphor: Stack,
      hero: StackOutline,
      heroSolid: StackSolid,
      tabler: IconStack2,
      remix: RiStackLine,
      remixFill: RiStackFill,
      pixel: Files,
      pixelSharp: FilesSharp,
    }),
  },
  {
    id: "box",
    label: "Box",
    icons: buildIcons({
      lucide: Box,
      phosphor: Cube,
      hero: CubeOutline,
      heroSolid: CubeSolid,
      tabler: IconBox,
      remix: RiBox3Line,
      remixFill: RiBox3Fill,
      pixel: PixelBox,
      pixelSharp: PixelBox,
    }),
  },
  {
    id: "home",
    label: "Home",
    icons: buildIcons({
      lucide: Home,
      phosphor: House,
      hero: HomeOutline,
      heroSolid: HomeSolid,
      tabler: IconHome,
      remix: RiHomeLine,
      remixFill: RiHomeFill,
      pixel: PixelHome,
      pixelSharp: HomeSharp,
    }),
  },
  {
    id: "book-open",
    label: "Book",
    icons: buildIcons({
      lucide: LucideBook,
      phosphor: BookOpen,
      hero: BookOpenOutline,
      heroSolid: BookOpenSolid,
      tabler: IconBook,
      remix: RiBookOpenLine,
      remixFill: RiBookOpenFill,
      pixel: PixelBook,
      pixelSharp: BookOpenSharp,
    }),
  },
  {
    id: "settings",
    label: "Settings",
    icons: buildIcons({
      lucide: Settings,
      phosphor: Gear,
      hero: CogOutline,
      heroSolid: CogSolid,
      tabler: IconSettings,
      remix: RiSettings3Line,
      remixFill: RiSettings3Fill,
      pixel: PixelGear,
      pixelSharp: PixelGear,
    }),
  },
  {
    id: "wrench",
    label: "Wrench",
    icons: buildIcons({
      lucide: Wrench,
      phosphor: PhosphorWrench,
      hero: WrenchOutline,
      heroSolid: WrenchSolid,
      tabler: IconTool,
      remix: RiToolsLine,
      remixFill: RiToolsFill,
      pixel: PixelTools,
      pixelSharp: PixelTools,
    }),
  },
];

const CATALOG_BY_ID = Object.fromEntries(CATALOG.map((item) => [item.id, item]));

export const ICON_CATALOG = CATALOG.map(({ id, label }) => ({ id, label }));

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
  weight: "regular",
  strokeWidth: 2,
  nav: { ...DEFAULT_NAV_ICON_IDS },
};

const WEIGHT_IDS = new Set<string>(Object.keys(WEIGHT_LABELS));

export function resolveIcon(iconId: string, family: IconFamily, weight: IconWeight = "regular"): AppIcon {
  const item = CATALOG_BY_ID[iconId] ?? CATALOG_BY_ID.plus;
  const chosen = clampWeight(family, weight);
  return item.icons[`${family}:${chosen}`] ?? item.icons["lucide:regular"] ?? Plus;
}

export function resolveNavIcon(navId: string, settings: IconSettings): AppIcon {
  const id = settings.nav[navId] ?? DEFAULT_NAV_ICON_IDS[navId] ?? "plus";
  return resolveIcon(id, settings.family, settings.weight ?? "regular");
}

export function mergeIconSettings(value: unknown): IconSettings {
  const base = DEFAULT_ICON_SETTINGS;
  if (!value || typeof value !== "object") {
    return { ...base, nav: { ...base.nav } };
  }
  const raw = value as Partial<IconSettings> & { family?: unknown; weight?: unknown };
  const nav = { ...DEFAULT_NAV_ICON_IDS };
  if (raw.nav && typeof raw.nav === "object") {
    for (const [key, id] of Object.entries(raw.nav)) {
      if (typeof id === "string" && CATALOG_BY_ID[id]) nav[key] = id;
    }
  }
  const legacy = typeof raw.family === "string" ? LEGACY_FAMILY[raw.family] : undefined;
  const family = legacy?.family ?? base.family;
  const requested = typeof raw.weight === "string" && WEIGHT_IDS.has(raw.weight) ? raw.weight : (legacy?.weight ?? base.weight);
  return {
    family,
    weight: clampWeight(family, requested),
    strokeWidth: typeof raw.strokeWidth === "number" ? raw.strokeWidth : base.strokeWidth,
    nav,
  };
}
