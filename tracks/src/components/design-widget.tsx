import { AnimatePresence, motion, useDragControls, useMotionValue, useReducedMotion, type Variants } from "motion/react";
import { ChevronRight, GripHorizontal, Moon, Palette, RotateCcw, Sun } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { EASE_OUT, SPRING_LAYOUT, SPRING_PRESS } from "@/lib/ease";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStore } from "../store";

const STORAGE_KEY = "tracks-design-widget";
const RADIUS_DEFAULT = 10;

const PANEL_VARIANTS: Variants = {
  closed: {
    opacity: 0,
    clipPath: "inset(100% 0 0 100% round 24px)",
    transition: { duration: 0.16, ease: EASE_OUT },
  },
  open: {
    opacity: 1,
    clipPath: "inset(0% 0 0 0% round 24px)",
    transition: { duration: 0.28, ease: EASE_OUT, delayChildren: 0.04, staggerChildren: 0.04 },
  },
};

const ROW_VARIANTS: Variants = {
  closed: { opacity: 0, y: -6, filter: "blur(3px)" },
  open: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.18, ease: EASE_OUT } },
};

const SECTION_VARIANTS: Variants = {
  closed: {
    opacity: 0,
    height: 0,
    clipPath: "inset(0 0 100% 0 round 8px)",
    transition: { duration: 0.14, ease: EASE_OUT, staggerChildren: 0.02, staggerDirection: -1 },
  },
  open: {
    opacity: 1,
    height: "auto",
    clipPath: "inset(0 0 0% 0 round 8px)",
    transition: { duration: 0.22, ease: EASE_OUT, delayChildren: 0.03, staggerChildren: 0.035 },
  },
};

type ColorId =
  | "primary"
  | "background"
  | "foreground"
  | "muted"
  | "mutedText"
  | "card"
  | "sidebar"
  | "border"
  | "cta"
  | "success"
  | "destructive";

const COLORS: { id: ColorId; label: string; vars: string[]; hover?: boolean }[] = [
  { id: "primary", label: "Primary", vars: ["--primary", "--sidebar-primary"], hover: true },
  { id: "background", label: "Background", vars: ["--bg", "--background"] },
  { id: "foreground", label: "Foreground", vars: ["--fg", "--foreground", "--card-foreground", "--popover-foreground"] },
  { id: "muted", label: "Muted", vars: ["--muted", "--accent", "--secondary", "--sidebar-accent"] },
  { id: "mutedText", label: "Muted text", vars: ["--muted-fg", "--muted-foreground", "--subtle", "--sidebar-fg", "--sidebar-foreground"] },
  { id: "card", label: "Card", vars: ["--card", "--popover"] },
  { id: "sidebar", label: "Sidebar", vars: ["--sidebar"] },
  { id: "border", label: "Border", vars: ["--border", "--border-secondary", "--input", "--sidebar-border"] },
  { id: "cta", label: "Accent", vars: ["--cta"] },
  { id: "success", label: "Success", vars: ["--success"] },
  { id: "destructive", label: "Destructive", vars: ["--destructive"] },
];

const RADIUS_PRESETS = [
  { id: "sharp", label: "Sharp", value: 0 },
  { id: "soft", label: "Soft", value: 10 },
  { id: "round", label: "Round", value: 16 },
  { id: "pill", label: "Pill", value: 24 },
] as const;

const COLORWAYS: { id: string; label: string; colors: Partial<Record<ColorId, string>> | null }[] = [
  { id: "tracks", label: "Tracks", colors: null },
  { id: "ink", label: "Ink", colors: { primary: "#121e1e", cta: "#9ae6e1" } },
  { id: "tide", label: "Tide", colors: { primary: "#0b6e75", cta: "#6eece7" } },
  { id: "amber", label: "Amber", colors: { primary: "#b45309", cta: "#fde68a" } },
];

type SavedWidget = {
  x?: number;
  y?: number;
  radius?: number;
  colors?: Partial<Record<ColorId, string>>;
  colorway?: string;
};

function readSaved(): SavedWidget {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SavedWidget;
  } catch {
    /* keep the defaults */
  }
  return {};
}

function toHex(value: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return "#000000";
  context.fillStyle = "#ffffff";
  context.fillStyle = value.trim() || "#ffffff";
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function hexChannels(hex: string) {
  const raw = hex.replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((char) => char + char).join("") : raw;
  const num = Number.parseInt(full, 16);
  return [16, 8, 0].map((shift) => (num >> shift) & 255);
}

function shade(hex: string, amount: number) {
  return `#${hexChannels(hex)
    .map((channel) => Math.max(0, Math.min(255, channel + amount)).toString(16).padStart(2, "0"))
    .join("")}`;
}

function contrastText(hex: string) {
  const [r, g, b] = hexChannels(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? "#121e1e" : "#ffffff";
}

function readToken(names: string[]) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(names[0]).trim();
  return raw ? toHex(raw) : "#000000";
}

function writeToken(names: string[], value: string) {
  for (const name of names) document.documentElement.style.setProperty(name, value);
}

function clearToken(names: string[]) {
  for (const name of names) document.documentElement.style.removeProperty(name);
}

function applyRadius(px: number) {
  document.documentElement.style.setProperty("--radius", `${px}px`);
}

function applyColors(colors: Partial<Record<ColorId, string>>) {
  for (const token of COLORS) {
    const value = colors[token.id];
    if (!value) continue;
    writeToken(token.vars, value);
    if (!token.hover) continue;
    const ink = contrastText(value);
    document.documentElement.style.setProperty("--primary-hover", shade(value, -28));
    writeToken(["--primary-fg", "--primary-foreground", "--sidebar-primary-foreground"], ink);
  }
}

function clearDesign() {
  for (const token of COLORS) clearToken(token.vars);
  document.documentElement.style.removeProperty("--primary-hover");
  document.documentElement.style.removeProperty("--primary-fg");
  document.documentElement.style.removeProperty("--primary-foreground");
  document.documentElement.style.removeProperty("--sidebar-primary-foreground");
  document.documentElement.style.removeProperty("--radius");
}

export function DesignWidget() {
  const store = useStore();
  const reduce = useReducedMotion() ?? false;
  const dragControls = useDragControls();
  const boundsRef = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const layoutId = useId();
  const [saved] = useState(readSaved);
  const x = useMotionValue(saved.x ?? 0);
  const y = useMotionValue(saved.y ?? 0);
  const [open, setOpen] = useState(false);
  const [radius, setRadius] = useState(saved.radius ?? RADIUS_DEFAULT);
  const [colors, setColors] = useState<Partial<Record<ColorId, string>>>(saved.colors ?? {});
  const [colorway, setColorway] = useState(saved.colorway ?? "tracks");
  const [sections, setSections] = useState({ roundness: true, colors: true, variants: false });

  useLayoutEffect(() => {
    if (saved.radius != null) applyRadius(saved.radius);
    if (saved.colors) applyColors(saved.colors);
  }, [saved]);

  useEffect(() => {
    const payload: SavedWidget = { x: x.get(), y: y.get(), radius, colors, colorway };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [colors, colorway, radius, x, y]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function persistPosition() {
    const payload: SavedWidget = { x: x.get(), y: y.get(), radius, colors, colorway };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function chooseRadius(value: number) {
    setRadius(value);
    applyRadius(value);
  }

  function chooseColor(id: ColorId, value: string) {
    const next = { ...colors, [id]: value };
    setColors(next);
    setColorway("custom");
    applyColors({ [id]: value });
  }

  function chooseColorway(id: string) {
    const preset = COLORWAYS.find((item) => item.id === id);
    setColorway(id);
    if (!preset || !preset.colors) {
      const keptRadius = radius;
      clearDesign();
      applyRadius(keptRadius);
      setColors({});
      return;
    }
    const next = { ...colors, ...preset.colors };
    setColors(next);
    applyColors(preset.colors);
  }

  function reset() {
    clearDesign();
    setRadius(RADIUS_DEFAULT);
    setColors({});
    setColorway("tracks");
  }

  function toggleSection(id: keyof typeof sections) {
    setSections((current) => ({ ...current, [id]: !current[id] }));
  }

  const spring = reduce ? { duration: 0 } : SPRING_LAYOUT;

  return (
    <div ref={boundsRef} className="pointer-events-none fixed inset-3 z-[70]">
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={boundsRef}
        dragElastic={0.08}
        dragMomentum={false}
        style={{ x, y }}
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={() => {
          persistPosition();
          requestAnimationFrame(() => {
            dragged.current = false;
          });
        }}
        className="pointer-events-auto absolute right-0 bottom-0"
      >
        <motion.div
          initial={false}
          animate={{ width: open ? 300 : 52, borderRadius: open ? Math.max(radius * 1.6, 16) : 999 }}
          transition={spring}
          className="overflow-hidden border border-border bg-background text-foreground shadow-lg"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {open ? (
              <motion.section
                key="panel"
                role="dialog"
                aria-label="Design system"
                variants={reduce ? undefined : PANEL_VARIANTS}
                initial="closed"
                animate="open"
                exit="closed"
                className="flex max-h-[min(32rem,calc(100dvh-2rem))] flex-col"
              >
                <header
                  aria-label="Drag design system"
                  className="flex cursor-grab items-center gap-2 border-b border-border px-3 py-3 active:cursor-grabbing"
                  onPointerDown={(event) => dragControls.start(event)}
                >
                  <GripHorizontal aria-hidden="true" className="size-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1 text-sm font-medium">Design</span>
                  <button
                    type="button"
                    className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={reset}
                    aria-label="Reset design system"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => setOpen(false)}
                    aria-label="Close design system"
                  >
                    <span aria-hidden="true" className="text-base leading-none">
                      ×
                    </span>
                  </button>
                </header>
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-2 py-3">
                  <Group label="Appearance">
                    <Choice
                      layoutId={`${layoutId}-theme`}
                      active={store.theme === "light"}
                      onSelect={() => store.setTheme("light")}
                    >
                      <Sun className="size-4" /> Light
                    </Choice>
                    <Choice
                      layoutId={`${layoutId}-theme`}
                      active={store.theme === "dark"}
                      onSelect={() => store.setTheme("dark")}
                    >
                      <Moon className="size-4" /> Dark
                    </Choice>
                  </Group>

                  <Section
                    label="Roundness"
                    open={sections.roundness}
                    onToggle={() => toggleSection("roundness")}
                    reduce={reduce}
                  >
                    {RADIUS_PRESETS.map((preset) => (
                      <Choice
                        key={preset.id}
                        layoutId={`${layoutId}-radius`}
                        active={radius === preset.value}
                        onSelect={() => chooseRadius(preset.value)}
                      >
                        <RadiusMark value={preset.value} />
                        {preset.label}
                      </Choice>
                    ))}
                    <label className="grid gap-2 px-3 py-2 text-xs text-muted-foreground">
                      <span className="flex justify-between">
                        Radius <span className="tabular-nums text-foreground">{radius}px</span>
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={24}
                        value={radius}
                        aria-label="Corner radius"
                        onChange={(event) => chooseRadius(Number(event.target.value))}
                        className="accent-primary"
                      />
                    </label>
                  </Section>

                  <Section
                    label="Colors"
                    open={sections.colors}
                    onToggle={() => toggleSection("colors")}
                    reduce={reduce}
                  >
                    {COLORS.map((token) => (
                      <ColorRow
                        key={token.id}
                        label={token.label}
                        value={colors[token.id] ?? readToken(token.vars)}
                        onChange={(value) => chooseColor(token.id, value)}
                      />
                    ))}
                  </Section>

                  <Section
                    label="Variants"
                    open={sections.variants}
                    onToggle={() => toggleSection("variants")}
                    reduce={reduce}
                  >
                    {COLORWAYS.map((preset) => (
                      <Choice
                        key={preset.id}
                        layoutId={`${layoutId}-colorway`}
                        active={colorway === preset.id}
                        onSelect={() => chooseColorway(preset.id)}
                      >
                        <span
                          aria-hidden="true"
                          className="size-3.5 rounded-full border border-border"
                          style={{ background: preset.colors?.primary ?? "var(--primary)" }}
                        />
                        {preset.label}
                      </Choice>
                    ))}
                    <div className="grid grid-cols-2 gap-2 px-2 pt-1 pb-2">
                      <Button type="button" className="pointer-events-none">
                        Primary
                      </Button>
                      <Button type="button" variant="secondary" className="pointer-events-none">
                        Secondary
                      </Button>
                      <Button type="button" variant="ghost" className="pointer-events-none">
                        Ghost
                      </Button>
                      <Button type="button" variant="destructive" className="pointer-events-none">
                        Danger
                      </Button>
                    </div>
                  </Section>
                </div>
              </motion.section>
            ) : (
              <motion.button
                key="launcher"
                type="button"
                aria-label="Open design system"
                variants={reduce ? undefined : ROW_VARIANTS}
                initial="closed"
                animate="open"
                exit="closed"
                whileTap={reduce ? undefined : { scale: 0.96 }}
                transition={SPRING_PRESS}
                onPointerDown={(event) => dragControls.start(event)}
                onClick={() => {
                  if (dragged.current) return;
                  setOpen(true);
                }}
                className="grid size-[52px] place-items-center bg-primary text-primary-foreground"
              >
                <Palette className="size-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="grid gap-1">
      <h2 className="px-3 text-xs font-medium text-muted-foreground">{label}</h2>
      {children}
    </section>
  );
}

function Section({
  label,
  open,
  onToggle,
  reduce,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  reduce: boolean;
  children: ReactNode;
}) {
  return (
    <section>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex min-h-9 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-medium text-foreground hover:bg-muted"
      >
        <span className="min-w-0 flex-1">{label}</span>
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ rotate: open ? 90 : 0 }}
          transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
          className="grid size-4 place-items-center text-muted-foreground"
        >
          <ChevronRight className="size-3.5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="section"
            variants={reduce ? undefined : SECTION_VARIANTS}
            initial="closed"
            animate="open"
            exit="closed"
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function Choice({
  layoutId,
  active,
  onSelect,
  children,
}: {
  layoutId: string;
  active: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  const reduce = useReducedMotion() ?? false;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        "relative flex min-h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm text-muted-foreground hover:text-foreground",
        active && "text-foreground",
      )}
    >
      {active ? (
        <motion.span
          layoutId={layoutId}
          transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
          className="absolute inset-0 rounded-xl bg-muted"
        />
      ) : null}
      <span className="relative z-10 flex min-w-0 flex-1 items-center gap-2.5">{children}</span>
    </button>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5">
      <span className="min-w-0 flex-1 text-sm text-muted-foreground">{label}</span>
      <input
        type="color"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="size-7 cursor-pointer rounded-md border border-border bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-[5px] [&::-webkit-color-swatch]:border-0"
      />
    </div>
  );
}

function RadiusMark({ value }: { value: number }) {
  return (
    <span
      aria-hidden="true"
      className="size-4 border border-current"
      style={{ borderRadius: value }}
    />
  );
}
