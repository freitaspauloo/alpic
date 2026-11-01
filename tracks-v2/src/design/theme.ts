import { useSyncExternalStore } from "react";
import { DEFAULT_HERO, loadHeroConfig, type HeroConfig } from "@/pages/landing-hero";

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
  /** Modular scale between body, section, and title. Display sits above title. */
  ratio: number;
  /** Body size in px. The other roles are derived from this and the ratio. */
  body: number;
  /** Display and title tracking, in em. */
  tracking: number;
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
  hero: HeroConfig;
};

const SANS = '"Geist Variable", ui-sans-serif, system-ui, sans-serif';
const MONO = '"Geist Mono Variable", ui-monospace, SFMono-Regular, monospace';

export const SANS_FONTS = [
  { id: "geist", label: "Geist", value: SANS },
  { id: "system", label: "System", value: "ui-sans-serif, system-ui, sans-serif" },
  { id: "serif", label: "Serif", value: 'Georgia, "Times New Roman", serif' },
] as const;

export const MONO_FONTS = [
  { id: "geist-mono", label: "Geist Mono", value: MONO },
  { id: "system-mono", label: "System mono", value: "ui-monospace, SFMono-Regular, monospace" },
] as const;

const LIGHT: Palette = {
  background: "oklch(99% 0 0)",
  foreground: "oklch(15% 0 0)",
  card: "oklch(97% 0 0)",
  muted: "oklch(97% 0 0)",
  mutedForeground: "oklch(50% 0 0)",
  border: "oklch(15% 0 0 / 0.06)",
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
  type: { sans: SANS, mono: MONO, ratio: 1.25, body: 15, tracking: -0.04 },
  space: { base: 4, page: 32, section: 32, control: 8 },
  radius: { base: 8, ratio: 1.5 },
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
  primary: "#171717",
  primaryForeground: "#ffffff",
  accent: "oklch(45% 0.02 260)",
  accentForeground: "#ffffff",
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
    }),
  },
  {
    id: "quiet",
    name: "Quiet",
    builtin: true,
    design: themeDesign({
      light: QUIET_LIGHT,
      dark: QUIET_DARK,
      type: { sans: SANS, mono: MONO, ratio: 1.2, body: 15, tracking: -0.02 },
      space: { base: 4, page: 28, section: 24, control: 8 },
      radius: { base: 12, ratio: 1.4 },
    }),
  },
  {
    id: "ink",
    name: "Ink",
    builtin: true,
    design: themeDesign({
      light: INK_LIGHT,
      dark: INK_DARK,
      type: { sans: SERIF, mono: MONO, ratio: 1.15, body: 17, tracking: -0.02 },
      space: { base: 4, page: 40, section: 40, control: 10 },
      radius: { base: 4, ratio: 1.25 },
    }),
  },
];

export const COLOR_GROUPS: { title: string; keys: (keyof Palette)[] }[] = [
  { title: "Surface", keys: ["background", "foreground", "card", "muted", "mutedForeground"] },
  { title: "Line", keys: ["border", "borderStrong", "ring", "input"] },
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
  const body = type.body;
  const section = body * type.ratio;
  const title = section * type.ratio;
  const display = title * type.ratio * 1.8;
  const eyebrow = Math.max(10, body * 0.75);
  return { body, section, title, display, eyebrow };
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

function readLibrary(): ThemeLibrary {
  try {
    const raw = JSON.parse(localStorage.getItem(THEMES_KEY) || "") as { activeId?: unknown; custom?: unknown };
    const custom = Array.isArray(raw.custom) ? raw.custom.flatMap((item) => sanitizeSaved(item) ?? []) : [];
    const ids = new Set([...BUILT_IN_IDS, ...custom.map((theme) => theme.id)]);
    const activeId = typeof raw.activeId === "string" && ids.has(raw.activeId) ? raw.activeId : "tracks";
    return { activeId, custom };
  } catch {
    return { activeId: "tracks", custom: [] };
  }
}

let library: ThemeLibrary = { activeId: "tracks", custom: [] };
let libraryView: ThemeLibraryView | null = null;

function allThemes() {
  return [...BUILT_IN_THEMES, ...library.custom];
}

function activeTheme() {
  return allThemes().find((theme) => theme.id === library.activeId) ?? BUILT_IN_THEMES[0];
}

function persistLibrary() {
  localStorage.setItem(THEMES_KEY, JSON.stringify({ activeId: library.activeId, custom: library.custom }));
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
  library = { activeId: saved.id, custom: [...library.custom, saved] };
  libraryView = null;
  persistLibrary();
  emit();
  return saved.id;
}

export function updateActiveTheme() {
  const current = library.custom.find((theme) => theme.id === library.activeId);
  if (!current) return;
  library = {
    ...library,
    custom: library.custom.map((theme) =>
      theme.id === current.id ? { ...theme, design: themeDesign(sliceDesign(state)) } : theme,
    ),
  };
  libraryView = null;
  persistLibrary();
  emit();
}

export function deleteTheme(id: string) {
  if (!library.custom.some((theme) => theme.id === id)) return;
  const wasActive = library.activeId === id;
  library = {
    activeId: wasActive ? "tracks" : library.activeId,
    custom: library.custom.filter((theme) => theme.id !== id),
  };
  libraryView = null;
  persistLibrary();
  if (wasActive) {
    setDesign({ ...themeDesign(BUILT_IN_THEMES[0].design), hero: { ...state.hero } });
    return;
  }
  emit();
}

/** Put the selected theme back. Hero settings stay. */
export function resetActiveTheme() {
  const theme = activeTheme();
  setDesign({ ...themeDesign(theme.design), hero: { ...state.hero } });
}

/** Put the selected theme back, and the hero back to its defaults. */
export function resetEverything() {
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
    type: mergeNumber(DEFAULT_DESIGN.type, raw.type),
    space: mergeNumber(DEFAULT_DESIGN.space, raw.space),
    radius: mergeNumber(DEFAULT_DESIGN.radius, raw.radius),
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

function emit() {
  libraryView = null;
  listeners.forEach((listener) => listener());
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

export function hydrateDesign() {
  const stored = readStored();
  state = stored ?? { ...DEFAULT_DESIGN, hero: loadHeroConfig() };
  library = readLibrary();
  libraryView = null;
  const saved = localStorage.getItem("tracks-v2:theme");
  mode = saved === "dark" ? "dark" : "light";
}

export function setDesign(next: DesignState) {
  state = next;
  localStorage.setItem(KEY, JSON.stringify(state));
  applyDesign(document, state, mode);
  emit();
}

export function setDesignMode(next: Mode) {
  mode = next;
  applyDesign(document, state, mode);
  emit();
}

export function patchDesign(patch: Partial<DesignState>) {
  setDesign({ ...state, ...patch });
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
  el.style.setProperty("--leading-display", "1.02");
  el.style.setProperty("--tracking-display", `${design.type.tracking}em`);
  el.style.setProperty("--tracking-title", `${design.type.tracking * 0.7}em`);
  el.style.setProperty("--tracking-eyebrow", "0.16em");

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
