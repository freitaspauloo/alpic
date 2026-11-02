import { useSyncExternalStore } from "react";
import { DEFAULT_HERO, type HeroConfig } from "@/pages/landing-hero";
import { DEFAULT_ICON_SETTINGS, type IconSettings, mergeIconSettings } from "./icons";
import { installUploadedFonts, loadSharedFonts } from "./fonts";
import shippedTheme from "./shipped-theme.json";

export type { IconSettings } from "./icons";

/**
 * One design document for the landing page and the product.
 * Values are written onto the document as the CSS variables beUI already reads,
 * so registry components pick them up without being restyled.
 */

export type Mode = "light" | "dark";

export type Palette = {
  background: string;
  foreground: string;
  card: string;
  muted: string;
  mutedForeground: string;
  border: string;
  /** Line used on lighter raised surfaces, where the canvas border disappears. */
  borderRaised: string;
  borderStrong: string;
  ring: string;
  input: string;
  primary: string;
  primaryForeground: string;
  destructive: string;
  success: string;
  warning: string;
  accent: string;
  accentForeground: string;
  neon: string;
  violet: string;
  glassBg: string;
  glassBorder: string;
  glassStrongBg: string;
  glassThinBg: string;
};

export type TypeSettings = {
  sans: string;
  mono: string;
  /** Modular scale. Moving it rewrites the role sizes from the body size. */
  ratio: number;
  body: number;
  display: number;
  title: number;
  section: number;
  eyebrow: number;
  /** Size of the mono specimen and code blocks, in px. */
  monoSize: number;
  /** Display tracking, in em. */
  tracking: number;
  /** Title tracking, in em. */
  trackingTitle: number;
  /** Body tracking, in em. */
  trackingBody: number;
  /** Eyebrow tracking, in em. */
  trackingEyebrow: number;
  /** UI text weight. */
  weight: number;
  /** Display and title weight. */
  displayWeight: number;
  /** Body line height, unitless. */
  leading: number;
  /** Display line height, unitless. */
  leadingDisplay: number;
  /** Title line height, unitless. */
  leadingTitle: number;
};

export type SpaceSettings = {
  /** Tailwind spacing unit, in px. 4 matches the default scale. */
  base: number;
  page: number;
  section: number;
  control: number;
};

export type RadiusSettings = {
  /** lg corner, in px. The other steps are this times the ratio. */
  base: number;
  ratio: number;
};

export type DesignState = {
  light: Palette;
  dark: Palette;
  type: TypeSettings;
  space: SpaceSettings;
  radius: RadiusSettings;
  icons: IconSettings;
  hero: HeroConfig;
};

const SANS = '"Geist Variable", ui-sans-serif, system-ui, sans-serif';
const MONO = '"Geist Mono Variable", ui-monospace, SFMono-Regular, monospace';

export function scaleRoles(body: number, ratio: number) {
  const section = Math.round(body * ratio * 10) / 10;
  const title = Math.round(section * ratio * 10) / 10;
  const display = Math.round(title * ratio * 1.8 * 10) / 10;
  const eyebrow = Math.round(Math.max(10, body * 0.75) * 10) / 10;
  return { display, title, section, eyebrow, monoSize: eyebrow };
}

function sizedType(type: Pick<TypeSettings, "sans" | "mono" | "ratio" | "body" | "tracking">): TypeSettings {
  return {
    ...type,
    ...scaleRoles(type.body, type.ratio),
    weight: 400,
    displayWeight: 500,
    leading: 1.5,
    leadingDisplay: 1.02,
    leadingTitle: 1.2,
    trackingTitle: Math.round(type.tracking * 0.7 * 1000) / 1000,
    trackingBody: 0,
    trackingEyebrow: 0.16,
  };
}

const LIGHT: Palette = {
  background: "oklch(99% 0 0)",
  foreground: "oklch(15% 0 0)",
  card: "oklch(97% 0 0)",
  muted: "oklch(97% 0 0)",
  mutedForeground: "oklch(50% 0 0)",
  border: "oklch(15% 0 0 / 0.06)",
  borderRaised: "oklch(15% 0 0 / 0.12)",
  borderStrong: "oklch(15% 0 0 / 0.12)",
  ring: "oklch(15% 0 0 / 0.12)",
  input: "oklch(15% 0 0 / 0.06)",
  primary: "#e90060",
  primaryForeground: "#ffffff",
  destructive: "oklch(62% 0.22 25)",
  success: "oklch(70% 0.18 155)",
  warning: "oklch(78% 0.18 75)",
  accent: "oklch(72% 0.18 195)",
  accentForeground: "oklch(15% 0 0)",
  neon: "oklch(80% 0.22 145)",
  violet: "oklch(68% 0.22 295)",
  glassBg: "oklch(99% 0 0 / 0.55)",
  glassBorder: "oklch(15% 0 0 / 0.08)",
  glassStrongBg: "rgb(255 255 255 / 0.7)",
  glassThinBg: "rgb(255 255 255 / 0.45)",
};

const DARK: Palette = {
  background: "#151515",
  foreground: "oklch(96% 0 0)",
  card: "#1c1c1c",
  muted: "#1c1c1c",
  mutedForeground: "oklch(62% 0 0)",
  border: "rgb(255 255 255 / 0.05)",
  borderRaised: "rgb(255 255 255 / 0.16)",
  borderStrong: "rgb(255 255 255 / 0.1)",
  ring: "rgb(255 255 255 / 0.1)",
  input: "rgb(255 255 255 / 0.05)",
  primary: "#e90060",
  primaryForeground: "#ffffff",
  destructive: "oklch(62% 0.22 25)",
  success: "oklch(70% 0.18 155)",
  warning: "oklch(78% 0.18 75)",
  accent: "oklch(80% 0.18 195)",
  accentForeground: "#151515",
  neon: "oklch(80% 0.22 145)",
  violet: "oklch(68% 0.22 295)",
  glassBg: "rgb(28 28 28 / 0.55)",
  glassBorder: "rgb(255 255 255 / 0.08)",
  glassStrongBg: "rgb(28 28 28 / 0.6)",
  glassThinBg: "rgb(21 21 21 / 0.45)",
};

export const DEFAULT_DESIGN: DesignState = {
  light: LIGHT,
  dark: DARK,
  type: sizedType({ sans: SANS, mono: MONO, ratio: 1.25, body: 15, tracking: -0.04 }),
  space: { base: 4, page: 32, section: 32, control: 8 },
  radius: { base: 8, ratio: 1.5 },
  icons: { ...DEFAULT_ICON_SETTINGS, nav: { ...DEFAULT_ICON_SETTINGS.nav } },
  hero: DEFAULT_HERO,
};

/** A theme is the product look. The hero image stays outside it. */
export type ThemeDesign = Omit<DesignState, "hero">;

export type SavedTheme = {
  id: string;
  name: string;
  builtin: boolean;
  design: ThemeDesign;
};

const SERIF = 'Georgia, "Times New Roman", serif';

const QUIET_LIGHT: Palette = {
  ...LIGHT,
  background: "#f3f2f0",
  foreground: "#262626",
  card: "#faf9f8",
  muted: "#faf9f8",
  mutedForeground: "#8a8682",
  border: "#e4e1dc",
  borderRaised: "rgb(38 38 38 / 0.14)",
  borderStrong: "rgb(38 38 38 / 0.18)",
  ring: "rgb(38 38 38 / 0.16)",
  input: "rgb(38 38 38 / 0.08)",
  primary: "#171717",
  primaryForeground: "#faf9f8",
  accent: "oklch(45% 0.02 260)",
  accentForeground: "#faf9f8",
  glassBg: "rgb(250 249 248 / 0.72)",
  glassBorder: "rgb(38 38 38 / 0.08)",
  glassStrongBg: "rgb(250 249 248 / 0.9)",
  glassThinBg: "rgb(243 242 240 / 0.6)",
};

const QUIET_DARK: Palette = {
  ...DARK,
  primary: "#f4f4f4",
  primaryForeground: "#151515",
  accent: "oklch(78% 0.02 260)",
  accentForeground: "#151515",
};

const INK_LIGHT: Palette = {
  ...LIGHT,
  background: "#ffffff",
  foreground: "#111111",
  card: "#f6f6f6",
  muted: "#f3f3f3",
  mutedForeground: "#5e5e5e",
  border: "rgb(0 0 0 / 0.08)",
  borderRaised: "rgb(0 0 0 / 0.14)",
  borderStrong: "rgb(0 0 0 / 0.16)",
  ring: "rgb(0 0 0 / 0.16)",
  input: "rgb(0 0 0 / 0.08)",
  primary: "#111111",
  primaryForeground: "#ffffff",
  accent: "#111111",
  accentForeground: "#ffffff",
  glassBg: "rgb(255 255 255 / 0.72)",
  glassBorder: "rgb(0 0 0 / 0.08)",
  glassStrongBg: "rgb(255 255 255 / 0.88)",
  glassThinBg: "rgb(255 255 255 / 0.55)",
};

const INK_DARK: Palette = {
  ...DARK,
  background: "#0c0c0c",
  foreground: "#f4f4f4",
  card: "#161616",
  muted: "#161616",
  mutedForeground: "#a1a1a1",
  border: "rgb(255 255 255 / 0.08)",
  borderRaised: "rgb(255 255 255 / 0.18)",
  borderStrong: "rgb(255 255 255 / 0.16)",
  ring: "rgb(255 255 255 / 0.16)",
  input: "rgb(255 255 255 / 0.08)",
  primary: "#f4f4f4",
  primaryForeground: "#0c0c0c",
  accent: "#f4f4f4",
  accentForeground: "#0c0c0c",
  glassBg: "rgb(12 12 12 / 0.72)",
  glassBorder: "rgb(255 255 255 / 0.1)",
  glassStrongBg: "rgb(22 22 22 / 0.8)",
  glassThinBg: "rgb(12 12 12 / 0.5)",
};

function themeDesign(design: ThemeDesign): ThemeDesign {
  return {
    light: { ...design.light },
    dark: { ...design.dark },
    type: { ...design.type },
    space: { ...design.space },
    radius: { ...design.radius },
    icons: { ...design.icons, nav: { ...design.icons.nav } },
  };
}

const BUILT_IN_THEMES: SavedTheme[] = [
  {
    id: "tracks",
    name: "Tracks",
    builtin: true,
    design: themeDesign({
      light: LIGHT,
      dark: DARK,
      type: DEFAULT_DESIGN.type,
      space: DEFAULT_DESIGN.space,
      radius: DEFAULT_DESIGN.radius,
      icons: DEFAULT_DESIGN.icons,
    }),
  },
  {
    id: "quiet",
    name: "Quiet",
    builtin: true,
    design: themeDesign({
      light: QUIET_LIGHT,
      dark: QUIET_DARK,
      type: sizedType({ sans: SANS, mono: MONO, ratio: 1.2, body: 15, tracking: -0.02 }),
      space: { base: 4, page: 28, section: 24, control: 8 },
      radius: { base: 12, ratio: 1.4 },
      icons: DEFAULT_DESIGN.icons,
    }),
  },
  {
    id: "ink",
    name: "Ink",
    builtin: true,
    design: themeDesign({
      light: INK_LIGHT,
      dark: INK_DARK,
      type: sizedType({ sans: SERIF, mono: MONO, ratio: 1.15, body: 17, tracking: -0.02 }),
      space: { base: 4, page: 40, section: 40, control: 10 },
      radius: { base: 4, ratio: 1.25 },
      icons: DEFAULT_DESIGN.icons,
    }),
  },
];

export const COLOR_GROUPS: { title: string; keys: (keyof Palette)[] }[] = [
  { title: "Surface", keys: ["background", "foreground", "card", "muted", "mutedForeground"] },
  { title: "Line", keys: ["border", "borderRaised", "borderStrong", "ring", "input"] },
  { title: "Brand", keys: ["primary", "primaryForeground"] },
  { title: "Status", keys: ["destructive", "success", "warning"] },
  { title: "Accent", keys: ["accent", "accentForeground", "neon", "violet"] },
  { title: "Glass", keys: ["glassBg", "glassBorder", "glassStrongBg", "glassThinBg"] },
];

export const COLOR_LABELS: Record<keyof Palette, string> = {
  background: "Background",
  foreground: "Foreground",
  card: "Card",
  muted: "Muted",
  mutedForeground: "Muted text",
  border: "Border",
  borderRaised: "Raised border",
  borderStrong: "Strong border",
  ring: "Ring",
  input: "Input",
  primary: "Primary",
  primaryForeground: "On primary",
  destructive: "Destructive",
  success: "Success",
  warning: "Warning",
  accent: "Accent",
  accentForeground: "On accent",
  neon: "Neon",
  violet: "Violet",
  glassBg: "Glass",
  glassBorder: "Glass line",
  glassStrongBg: "Strong glass",
  glassThinBg: "Thin glass",
};

export const ALPHA_COLORS = new Set<keyof Palette>([
  "border",
  "borderRaised",
  "borderStrong",
  "ring",
  "input",
  "glassBg",
  "glassBorder",
  "glassStrongBg",
  "glassThinBg",
]);

const CSS_VAR: Record<keyof Palette, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  border: "--border",
  borderRaised: "--border-raised",
  borderStrong: "--border-strong",
  ring: "--ring",
  input: "--input",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  destructive: "--destructive",
  success: "--success",
  warning: "--warning",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  neon: "--neon",
  violet: "--violet",
  glassBg: "--glass-bg",
  glassBorder: "--glass-border",
  glassStrongBg: "--glass-strong-bg",
  glassThinBg: "--glass-thin-bg",
};

export function typeRoles(type: TypeSettings) {
  return {
    display: type.display,
    title: type.title,
    section: type.section,
    body: type.body,
    eyebrow: type.eyebrow,
    mono: type.monoSize,
  };
}

export function radiusSteps(radius: RadiusSettings) {
  const { base, ratio } = radius;
  return {
    sm: base / ratio ** 2,
    md: base / ratio,
    lg: base,
    xl: base * ratio,
    xl2: base * ratio ** 2,
    xl3: base * ratio ** 3,
  };
}

const KEY = "tracks-design:v1";
const THEMES_KEY = "tracks-themes:v1";

const BUILT_IN_IDS = new Set(BUILT_IN_THEMES.map((theme) => theme.id));

type ThemeLibrary = {
  activeId: string;
  custom: SavedTheme[];
  /** Saved edits of Tracks, Quiet, and Ink. The code copies stay the first-run defaults. */
  overrides: Record<string, ThemeDesign>;
};

export type ThemeLibraryView = {
  activeId: string;
  themes: SavedTheme[];
  dirty: boolean;
};

function sliceDesign(design: DesignState): ThemeDesign {
  return {
    light: design.light,
    dark: design.dark,
    type: design.type,
    space: design.space,
    radius: design.radius,
    icons: design.icons,
  };
}

function fingerprint(design: ThemeDesign) {
  return JSON.stringify(design);
}

function sanitizeSaved(value: unknown): SavedTheme | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { id?: unknown; name?: unknown; design?: unknown };
  if (typeof raw.id !== "string" || typeof raw.name !== "string") return null;
  const name = raw.name.trim().slice(0, 40);
  if (!name || BUILT_IN_IDS.has(raw.id)) return null;
  return { id: raw.id, name, builtin: false, design: sliceDesign(sanitizeDesign(raw.design)) };
}

function sanitizeOverrides(value: unknown): Record<string, ThemeDesign> {
  if (!value || typeof value !== "object") return {};
  const overrides: Record<string, ThemeDesign> = {};
  for (const [id, design] of Object.entries(value as Record<string, unknown>)) {
    if (!BUILT_IN_IDS.has(id)) continue;
    overrides[id] = sliceDesign(sanitizeDesign(design));
  }
  return overrides;
}

type StoredLibrary = {
  design?: unknown;
  activeId?: unknown;
  custom?: unknown;
  overrides?: unknown;
  removed?: unknown;
  revision?: unknown;
};

const shipped = shippedTheme as StoredLibrary;

function shippedRevision() {
  return typeof shipped.revision === "number" ? shipped.revision : 0;
}

function rememberRemoved(value: unknown) {
  if (!Array.isArray(value)) return;
  value.forEach((id) => {
    if (typeof id === "string") removedIds.add(id);
  });
}

function takeLibrary(raw: StoredLibrary): ThemeLibrary {
  const custom = Array.isArray(raw.custom) ? raw.custom.flatMap((item) => sanitizeSaved(item) ?? []) : [];
  const ids = new Set([...BUILT_IN_IDS, ...custom.map((theme) => theme.id)]);
  const activeId = typeof raw.activeId === "string" && ids.has(raw.activeId) ? raw.activeId : "tracks";
  rememberRemoved(raw.removed);
  if (typeof raw.revision === "number") revision = Math.max(revision, raw.revision);
  return { activeId, custom, overrides: sanitizeOverrides(raw.overrides) };
}

function readLibrary(): ThemeLibrary {
  try {
    return takeLibrary(JSON.parse(localStorage.getItem(THEMES_KEY) || "") as StoredLibrary);
  } catch {
    return { activeId: "tracks", custom: [], overrides: {} };
  }
}

let library: ThemeLibrary = { activeId: "tracks", custom: [], overrides: {} };
const removedIds = new Set<string>();
let libraryView: ThemeLibraryView | null = null;

function allThemes() {
  return [...BUILT_IN_THEMES, ...library.custom].map((theme) => {
    const override = library.overrides[theme.id];
    return override ? { ...theme, design: override } : theme;
  });
}

function activeTheme() {
  return allThemes().find((theme) => theme.id === library.activeId) ?? BUILT_IN_THEMES[0];
}

function writeLibrary() {
  localStorage.setItem(
    THEMES_KEY,
    JSON.stringify({
      activeId: library.activeId,
      custom: library.custom,
      overrides: library.overrides,
      revision,
    }),
  );
}

function persistLibrary() {
  if (!applyingRemote) {
    revision = Date.now();
    editedAt = revision;
  }
  writeLibrary();
  if (applyingRemote) return;
  channel?.postMessage(sharedPayload());
  schedulePush();
}

function readLibraryView(): ThemeLibraryView {
  if (!libraryView) {
    const active = activeTheme();
    libraryView = {
      activeId: active.id,
      themes: allThemes(),
      dirty: fingerprint(sliceDesign(state)) !== fingerprint(active.design),
    };
  }
  return libraryView;
}

export function useThemes() {
  return useSyncExternalStore(subscribeDesign, readLibraryView, readLibraryView);
}

export function selectTheme(id: string) {
  const theme = allThemes().find((item) => item.id === id);
  if (!theme || theme.id === library.activeId) return;
  recordStep();
  library = { ...library, activeId: theme.id };
  libraryView = null;
  persistLibrary();
  setDesign({ ...themeDesign(theme.design), hero: { ...state.hero } });
}

export function saveTheme(name: string) {
  const trimmed = name.trim().slice(0, 40);
  if (!trimmed) return null;
  const saved: SavedTheme = {
    id: `theme_${Date.now().toString(36)}`,
    name: trimmed,
    builtin: false,
    design: themeDesign(sliceDesign(state)),
  };
  library = { ...library, activeId: saved.id, custom: [...library.custom, saved] };
  libraryView = null;
  persistLibrary();
  emit();
  return saved.id;
}

/** Write the current look onto the selected theme, built in or saved, and apply it in every window. */
export function applyTheme() {
  flushStep();
  const snapshot = themeDesign(sliceDesign(state));
  const current = library.custom.find((theme) => theme.id === library.activeId);
  if (current) {
    library = {
      ...library,
      custom: library.custom.map((theme) => (theme.id === current.id ? { ...theme, design: snapshot } : theme)),
    };
  } else if (BUILT_IN_IDS.has(library.activeId)) {
    library = { ...library, overrides: { ...library.overrides, [library.activeId]: snapshot } };
  }
  libraryView = null;
  persistLibrary();
  emit();
}

export function updateActiveTheme() {
  applyTheme();
}

export function deleteTheme(id: string) {
  if (!library.custom.some((theme) => theme.id === id)) return;
  removedIds.add(id);
  const wasActive = library.activeId === id;
  library = {
    ...library,
    activeId: wasActive ? "tracks" : library.activeId,
    custom: library.custom.filter((theme) => theme.id !== id),
  };
  libraryView = null;
  persistLibrary();
  if (wasActive) {
    const tracks = allThemes().find((theme) => theme.id === "tracks") ?? BUILT_IN_THEMES[0];
    setDesign({ ...themeDesign(tracks.design), hero: { ...state.hero } });
    return;
  }
  emit();
}

/** Put the selected theme back. Hero settings stay. */
export function resetActiveTheme() {
  recordStep();
  const theme = activeTheme();
  setDesign({ ...themeDesign(theme.design), hero: { ...state.hero } });
}

/** Put the selected theme back, and the hero back to its defaults. */
export function resetEverything() {
  recordStep();
  const theme = activeTheme();
  setDesign({ ...themeDesign(theme.design), hero: { ...DEFAULT_HERO } });
}

function mergePalette(base: Palette, value: unknown): Palette {
  if (!value || typeof value !== "object") return base;
  const next = { ...base };
  (Object.keys(base) as (keyof Palette)[]).forEach((key) => {
    const item = (value as Partial<Palette>)[key];
    if (typeof item === "string" && item.trim()) next[key] = item;
  });
  return next;
}

function mergeNumber<T extends Record<string, number | string>>(base: T, value: unknown): T {
  if (!value || typeof value !== "object") return base;
  const next = { ...base };
  (Object.keys(base) as (keyof T)[]).forEach((key) => {
    const item = (value as Partial<T>)[key];
    if (typeof item === typeof base[key]) next[key] = item as T[keyof T];
  });
  return next;
}

function mergeType(value: unknown): TypeSettings {
  const fallback = DEFAULT_DESIGN.type;
  if (!value || typeof value !== "object") return { ...fallback };
  const raw = value as Partial<TypeSettings>;
  const body = typeof raw.body === "number" ? raw.body : fallback.body;
  const ratio = typeof raw.ratio === "number" ? raw.ratio : fallback.ratio;
  const scaled = scaleRoles(body, ratio);
  const size = (key: "display" | "title" | "section" | "eyebrow" | "monoSize") =>
    typeof raw[key] === "number" ? raw[key] : scaled[key];
  return {
    sans: typeof raw.sans === "string" && raw.sans.trim() ? raw.sans : fallback.sans,
    mono: typeof raw.mono === "string" && raw.mono.trim() ? raw.mono : fallback.mono,
    ratio,
    body,
    tracking: typeof raw.tracking === "number" ? raw.tracking : fallback.tracking,
    trackingTitle: typeof raw.trackingTitle === "number" ? raw.trackingTitle : Math.round((typeof raw.tracking === "number" ? raw.tracking : fallback.tracking) * 0.7 * 1000) / 1000,
    trackingBody: typeof raw.trackingBody === "number" ? raw.trackingBody : fallback.trackingBody,
    trackingEyebrow: typeof raw.trackingEyebrow === "number" ? raw.trackingEyebrow : fallback.trackingEyebrow,
    weight: typeof raw.weight === "number" ? raw.weight : fallback.weight,
    displayWeight: typeof raw.displayWeight === "number" ? raw.displayWeight : fallback.displayWeight,
    leading: typeof raw.leading === "number" ? raw.leading : fallback.leading,
    leadingDisplay: typeof raw.leadingDisplay === "number" ? raw.leadingDisplay : fallback.leadingDisplay,
    leadingTitle: typeof raw.leadingTitle === "number" ? raw.leadingTitle : fallback.leadingTitle,
    display: size("display"),
    title: size("title"),
    section: size("section"),
    eyebrow: size("eyebrow"),
    monoSize: size("monoSize"),
  };
}

function mergeHero(value: unknown): HeroConfig {
  const next = { ...DEFAULT_HERO };
  if (!value || typeof value !== "object") return next;
  (Object.keys(DEFAULT_HERO) as (keyof HeroConfig)[]).forEach((key) => {
    const item = (value as Partial<HeroConfig>)[key];
    if (typeof item === typeof DEFAULT_HERO[key]) Object.assign(next, { [key]: item });
  });
  return next;
}

export function sanitizeDesign(value: unknown): DesignState {
  const raw = value && typeof value === "object" ? (value as Partial<DesignState>) : {};
  return {
    light: mergePalette(LIGHT, raw.light),
    dark: mergePalette(DARK, raw.dark),
    type: mergeType(raw.type),
    space: mergeNumber(DEFAULT_DESIGN.space, raw.space),
    radius: mergeNumber(DEFAULT_DESIGN.radius, raw.radius),
    icons: mergeIconSettings(raw.icons),
    hero: mergeHero(raw.hero),
  };
}

function readStored(): DesignState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return sanitizeDesign(JSON.parse(raw));
  } catch {
    return null;
  }
}

let state: DesignState = DEFAULT_DESIGN;
let mode: Mode = "light";
const listeners = new Set<() => void>();

const past: DesignState[] = [];
const future: DesignState[] = [];
let checkpoint: DesignState | null = null;
let checkpointTimer = 0;
let historyView = { canUndo: false, canRedo: false };
let applyingRemote = false;
let editedAt = 0;
let revision = 0;
let announcedLocal = false;
let pushTimer = 0;
let lastPushed = "";
let hadStored = false;
let channel: BroadcastChannel | null = null;

function cloneDesign(design: DesignState): DesignState {
  return JSON.parse(JSON.stringify(design)) as DesignState;
}

function refreshHistory() {
  const canUndo = past.length > 0 || checkpoint !== null;
  const canRedo = future.length > 0;
  if (historyView.canUndo === canUndo && historyView.canRedo === canRedo) return;
  historyView = { canUndo, canRedo };
}

function emit() {
  libraryView = null;
  refreshHistory();
  listeners.forEach((listener) => listener());
}

function flushStep() {
  window.clearTimeout(checkpointTimer);
  if (checkpoint && JSON.stringify(checkpoint) !== JSON.stringify(state)) {
    past.push(checkpoint);
    if (past.length > 80) past.shift();
    future.length = 0;
  }
  checkpoint = null;
}

function recordStep() {
  flushStep();
  past.push(cloneDesign(state));
  if (past.length > 80) past.shift();
  future.length = 0;
}

function sharedPayload() {
  return {
    design: state,
    activeId: library.activeId,
    custom: library.custom,
    overrides: library.overrides,
    removed: [...removedIds],
    revision,
  };
}

function schedulePush() {
  if (applyingRemote) return;
  window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    void pushShared();
  }, 200);
}

async function pushShared() {
  const body = JSON.stringify(sharedPayload());
  if (body === lastPushed) return true;
  lastPushed = body;
  try {
    const res = await fetch("/api/design", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body,
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) {
      lastPushed = "";
      return false;
    }
    return true;
  } catch {
    lastPushed = "";
    return false;
  }
}

function adoptShared(raw: unknown) {
  if (!raw || typeof raw !== "object") return;
  const data = raw as {
    design?: unknown;
    activeId?: unknown;
    custom?: unknown;
    overrides?: unknown;
    removed?: unknown;
    revision?: unknown;
  };
  if (!data.design) return;
  if (Date.now() - editedAt < 800) return;
  if (Array.isArray(data.removed)) {
    data.removed.forEach((id) => {
      if (typeof id === "string") removedIds.add(id);
    });
  }
  const incomingRev = typeof data.revision === "number" ? data.revision : 0;
  const incoming = Array.isArray(data.custom) ? data.custom.flatMap((item) => sanitizeSaved(item) ?? []) : [];
  const kept = library.custom.filter(
    (theme) => !removedIds.has(theme.id) && !incoming.some((item) => item.id === theme.id),
  );
  const custom = [...incoming.filter((theme) => !removedIds.has(theme.id)), ...kept];
  const incomingOverrides = data.overrides === undefined ? null : sanitizeOverrides(data.overrides);
  const overrides =
    incomingOverrides === null
      ? library.overrides
      : incomingRev < revision
        ? { ...incomingOverrides, ...library.overrides }
        : incomingOverrides;
  const localTheme = kept.find((theme) => theme.id === library.activeId);

  // This window still has a saved theme the shared file has never seen. Publish it once.
  if (localTheme && !announcedLocal) {
    announcedLocal = true;
    revision = Date.now();
    editedAt = revision;
    library = { ...library, custom, overrides };
    libraryView = null;
    writeLibrary();
    schedulePush();
    emit();
    return;
  }

  if (incomingRev < revision) {
    const customChanged = JSON.stringify(library.custom) !== JSON.stringify(custom);
    const overridesChanged = JSON.stringify(library.overrides) !== JSON.stringify(overrides);
    if (customChanged || overridesChanged) {
      library = { ...library, custom, overrides };
      libraryView = null;
      writeLibrary();
      if (kept.length || overridesChanged) schedulePush();
      emit();
    }
    return;
  }

  const nextState = sanitizeDesign(data.design);
  const ids = new Set([...BUILT_IN_IDS, ...custom.map((theme) => theme.id)]);
  const activeId = typeof data.activeId === "string" && ids.has(data.activeId) ? data.activeId : "tracks";
  const designChanged = JSON.stringify(state) !== JSON.stringify(nextState);
  const libraryChanged =
    library.activeId !== activeId ||
    JSON.stringify(library.custom) !== JSON.stringify(custom) ||
    JSON.stringify(library.overrides) !== JSON.stringify(overrides);
  revision = Math.max(revision, incomingRev);
  if (!designChanged && !libraryChanged) return;
  applyingRemote = true;
  state = nextState;
  library = { activeId, custom, overrides };
  if (designChanged) {
    past.length = 0;
    future.length = 0;
    checkpoint = null;
  }
  localStorage.setItem(KEY, JSON.stringify(state));
  writeLibrary();
  lastPushed = JSON.stringify(sharedPayload());
  applyDesign(document, state, mode);
  applyingRemote = false;
  emit();
  if (kept.length) schedulePush();
}

async function pullShared() {
  if (Date.now() - editedAt < 800) return;
  const seen = revision;
  try {
    const res = await fetch("/api/design", { cache: "no-store" });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.includes("json") || seen !== revision || Date.now() - editedAt < 800) return;
    const text = await res.text();
    if (!text || text === "{}") {
      if (hadStored) void pushShared();
      return;
    }
    if (text === lastPushed || seen !== revision) return;
    adoptShared(JSON.parse(text));
  } catch {
    // The dev server is the shared copy. Local storage still covers this window.
  }
}

/** Load the shared copy, then keep every open window on it. */
export function syncDesign() {
  channel = new BroadcastChannel("tracks-design");
  channel.onmessage = (event) => adoptShared(event.data);
  window.addEventListener("storage", (event) => {
    if (event.key !== KEY && event.key !== THEMES_KEY) return;
    try {
      adoptShared({
        design: JSON.parse(localStorage.getItem(KEY) || "null"),
        ...JSON.parse(localStorage.getItem(THEMES_KEY) || "{}"),
      });
    } catch {
      // Ignore a partial write from another window.
    }
  });
  window.addEventListener("focus", () => {
    void pullShared();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) void pullShared();
  });
  window.setInterval(() => {
    if (document.hidden) return;
    void pullShared();
    void loadSharedFonts();
  }, 2000);
  void loadSharedFonts();
  void pullShared().then(() => {
    if (!lastPushed) void pushShared();
  });
}

export function getDesign() {
  return state;
}

export function getMode() {
  return mode;
}

export function subscribeDesign(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function adoptShippedTheme() {
  state = sanitizeDesign(shipped.design);
  revision = 0;
  library = takeLibrary(shipped);
  revision = shippedRevision();
  localStorage.setItem(KEY, JSON.stringify(state));
  writeLibrary();
}

export function hydrateDesign() {
  hadStored = Boolean(localStorage.getItem(KEY) || localStorage.getItem(THEMES_KEY));
  const stored = readStored();
  library = readLibrary();
  // The shipped file is the theme that was saved. A newer edit in this browser wins.
  if (!stored || shippedRevision() > revision) {
    adoptShippedTheme();
    hadStored = true;
  } else {
    state = stored;
  }
  libraryView = null;
  const saved = localStorage.getItem("tracks-v2:theme");
  mode = saved === "dark" ? "dark" : "light";
}

export function setDesign(next: DesignState) {
  state = next;
  localStorage.setItem(KEY, JSON.stringify(state));
  if (!applyingRemote) {
    revision = Date.now();
    editedAt = revision;
    channel?.postMessage(sharedPayload());
    schedulePush();
  }
  applyDesign(document, state, mode);
  emit();
}

export function setDesignMode(next: Mode) {
  mode = next;
  applyDesign(document, state, mode);
  emit();
}

export function patchDesign(patch: Partial<DesignState>) {
  if (!checkpoint) checkpoint = cloneDesign(state);
  window.clearTimeout(checkpointTimer);
  checkpointTimer = window.setTimeout(() => {
    flushStep();
    emit();
  }, 350);
  setDesign({ ...state, ...patch });
}

export function undoDesign() {
  flushStep();
  const prev = past.pop();
  if (!prev) {
    emit();
    return;
  }
  future.push(cloneDesign(state));
  setDesign(prev);
}

export function redoDesign() {
  flushStep();
  const next = future.pop();
  if (!next) {
    emit();
    return;
  }
  past.push(cloneDesign(state));
  setDesign(next);
}

export function useDesignHistory() {
  return useSyncExternalStore(subscribeDesign, () => historyView, () => historyView);
}

export function useDesign() {
  return useSyncExternalStore(subscribeDesign, getDesign, getDesign);
}

export function applyDesign(doc: Document, design: DesignState, active: Mode) {
  const el = doc.documentElement;
  const palette = design[active];
  (Object.keys(CSS_VAR) as (keyof Palette)[]).forEach((key) => {
    el.style.setProperty(CSS_VAR[key], palette[key]);
  });
  el.style.setProperty("--danger", palette.destructive);
  el.style.setProperty("--accent-fg", palette.accentForeground);
  el.style.setProperty("--card-foreground", palette.foreground);
  el.style.setProperty("--popover", palette.card);
  el.style.setProperty("--popover-foreground", palette.foreground);
  el.style.setProperty("--secondary", palette.card);
  el.style.setProperty("--secondary-foreground", palette.foreground);

  el.style.setProperty("--font-sans", design.type.sans);
  el.style.setProperty("--font-mono", design.type.mono);
  const roles = typeRoles(design.type);
  el.style.setProperty("--text-display", `${roles.display}px`);
  el.style.setProperty("--text-title", `${roles.title}px`);
  el.style.setProperty("--text-section", `${roles.section}px`);
  el.style.setProperty("--text-body", `${roles.body}px`);
  el.style.setProperty("--text-eyebrow", `${roles.eyebrow}px`);
  el.style.setProperty("--text-mono", `${roles.mono}px`);
  el.style.setProperty("--icon-stroke-width", String(design.icons.strokeWidth));
  installUploadedFonts(el.ownerDocument);
  el.style.setProperty("--font-weight", String(design.type.weight));
  el.style.setProperty("--font-weight-display", String(design.type.displayWeight));
  el.style.setProperty("--leading-body", String(design.type.leading));
  el.style.setProperty("--leading-display", String(design.type.leadingDisplay));
  el.style.setProperty("--leading-title", String(design.type.leadingTitle));
  el.style.setProperty("--tracking-display", `${design.type.tracking}em`);
  el.style.setProperty("--tracking-title", `${design.type.trackingTitle}em`);
  el.style.setProperty("--tracking-body", `${design.type.trackingBody}em`);
  el.style.setProperty("--tracking-eyebrow", `${design.type.trackingEyebrow}em`);

  el.style.setProperty("--spacing", `${design.space.base}px`);
  el.style.setProperty("--space-page", `${design.space.page}px`);
  el.style.setProperty("--space-section", `${design.space.section}px`);
  el.style.setProperty("--space-control", `${design.space.control}px`);

  const radius = radiusSteps(design.radius);
  el.style.setProperty("--radius-sm", `${radius.sm}px`);
  el.style.setProperty("--radius-md", `${radius.md}px`);
  el.style.setProperty("--radius-lg", `${radius.lg}px`);
  el.style.setProperty("--radius-xl", `${radius.xl}px`);
  el.style.setProperty("--radius-2xl", `${radius.xl2}px`);
  el.style.setProperty("--radius-3xl", `${radius.xl3}px`);
  el.style.setProperty("--radius-control", `${radius.xl}px`);
}

export function readColor(input: string): { hex: string; alpha: number } {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return { hex: "#000000", alpha: 1 };
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = "#000000";
  context.fillStyle = input;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
  const hex = `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  return { hex, alpha: Math.round((a / 255) * 100) / 100 };
}

export function writeColor(hex: string, alpha: number) {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  if (alpha >= 0.999) return hex;
  return `rgb(${r} ${g} ${b} / ${Math.round(alpha * 100) / 100})`;
}
