import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { DEFAULT_HERO, IMAGE_FIELDS, SQUARE_FIELDS, type HeroConfig } from "@/pages/landing-hero";
import {
  ALPHA_COLORS,
  COLOR_GROUPS,
  COLOR_LABELS,
  MONO_FONTS,
  SANS_FONTS,
  deleteTheme,
  patchDesign,
  radiusSteps,
  readColor,
  resetActiveTheme,
  resetEverything,
  saveTheme,
  selectTheme,
  updateActiveTheme,
  type Palette,
  typeRoles,
  useDesign,
  useThemes,
  writeColor,
} from "./theme";

type Section = "color" | "type" | "space" | "radius" | "hero";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "color", label: "Color" },
  { id: "type", label: "Type" },
  { id: "space", label: "Space" },
  { id: "radius", label: "Radius" },
  { id: "hero", label: "Hero" },
];

const RANGE =
  "h-4 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-px [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-border-strong [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-moz-range-track]:h-px [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-border-strong [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground";

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-[6px]">
      <div className="flex items-baseline justify-between gap-[12px]">
        <label htmlFor={id} className="text-[12px] text-muted-foreground">
          {label}
        </label>
        <span className="font-mono text-[11px] text-foreground tabular-nums">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={RANGE}
      />
    </div>
  );
}

function ColorRow({ name, value, onChange }: { name: keyof Palette; value: string; onChange: (value: string) => void }) {
  const { hex, alpha } = readColor(value);
  return (
    <div className="grid gap-[6px]">
      <div className="flex items-center gap-[8px]">
        <input
          type="color"
          aria-label={COLOR_LABELS[name]}
          value={hex}
          onChange={(event) => onChange(writeColor(event.target.value, ALPHA_COLORS.has(name) ? alpha : 1))}
          className="size-[22px] shrink-0 cursor-pointer appearance-none overflow-hidden rounded-[6px] border border-border bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0"
        />
        <span className="min-w-0 flex-1 truncate text-[12px] text-foreground">{COLOR_LABELS[name]}</span>
        {ALPHA_COLORS.has(name) ? (
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{Math.round(alpha * 100)}%</span>
        ) : null}
      </div>
      {ALPHA_COLORS.has(name) ? (
        <input
          type="range"
          aria-label={`${COLOR_LABELS[name]} opacity`}
          min={0}
          max={1}
          step={0.01}
          value={alpha}
          onChange={(event) => onChange(writeColor(hex, Number(event.target.value)))}
          className={RANGE}
        />
      ) : null}
    </div>
  );
}

function Heading({ children }: { children: string }) {
  return <h2 className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{children}</h2>;
}

const ACTION =
  "inline-flex h-[28px] shrink-0 items-center rounded-[8px] px-[10px] text-[12px] leading-none disabled:pointer-events-none disabled:opacity-40";

function ThemeBar() {
  const { activeId, themes, dirty } = useThemes();
  const active = themes.find((theme) => theme.id === activeId) ?? themes[0];
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const choose = (id: string) => {
    setNaming(false);
    setConfirmDelete(false);
    selectTheme(id);
  };

  const addTheme = (event: FormEvent) => {
    event.preventDefault();
    const id = saveTheme(name);
    if (!id) return;
    setName("");
    setNaming(false);
  };

  return (
    <div className="flex shrink-0 flex-col gap-[8px] border-b border-border px-[14px] py-[10px]">
      <div className="flex items-baseline justify-between gap-[8px]">
        <label htmlFor="design-theme" className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Theme
        </label>
        {dirty ? <span className="text-[11px] text-muted-foreground">Edited</span> : null}
      </div>
      <select
        id="design-theme"
        value={active.id}
        onChange={(event) => choose(event.target.value)}
        className="h-[32px] w-full rounded-[8px] border border-border bg-background px-[8px] text-[12px] text-foreground"
      >
        {themes.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.builtin ? theme.name : `${theme.name} · saved`}
          </option>
        ))}
      </select>
      {confirmDelete ? (
        <div className="flex items-center justify-between gap-[8px]">
          <p className="text-[12px] text-foreground">Delete {active.name}?</p>
          <div className="flex gap-[6px]">
            <button
              type="button"
              onClick={() => {
                deleteTheme(active.id);
                setConfirmDelete(false);
              }}
              className={cn(ACTION, "bg-destructive text-white")}
            >
              Delete
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className={cn(ACTION, "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-[6px]">
          {active.builtin ? null : (
            <button type="button" disabled={!dirty} onClick={updateActiveTheme} className={cn(ACTION, "bg-foreground text-background")}>
              Save
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setConfirmDelete(false);
              setNaming((value) => !value);
            }}
            className={cn(ACTION, naming ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
          >
            Save as
          </button>
          <button
            type="button"
            disabled={!dirty}
            onClick={resetActiveTheme}
            className={cn(ACTION, "text-muted-foreground hover:bg-muted hover:text-foreground")}
          >
            Reset
          </button>
          {active.builtin ? null : (
            <button
              type="button"
              onClick={() => {
                setNaming(false);
                setConfirmDelete(true);
              }}
              className={cn(ACTION, "text-muted-foreground hover:bg-muted hover:text-foreground")}
            >
              Delete
            </button>
          )}
        </div>
      )}
      {naming ? (
        <form onSubmit={addTheme} className="flex gap-[6px]">
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Theme name"
            maxLength={40}
            aria-label="Theme name"
            className="h-[32px] min-w-0 flex-1 rounded-[8px] border border-border bg-background px-[8px] text-[12px] text-foreground"
          />
          <button type="submit" disabled={!name.trim()} className={cn(ACTION, "bg-foreground text-background")}>
            Add
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function DesignPlayground() {
  const design = useDesign();
  const { themes, activeId } = useThemes();
  const saved = themes.find((theme) => theme.id === activeId)?.design;
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section>("color");
  const mode = resolvedTheme === "dark" ? "dark" : "light";
  const palette = design[mode];
  const roles = typeRoles(design.type);
  const radius = radiusSteps(design.radius);

  const setPalette = (patch: Partial<Palette>) => patchDesign({ [mode]: { ...palette, ...patch } });
  const setHero = (patch: Partial<HeroConfig>) => patchDesign({ hero: { ...design.hero, ...patch } });

  const resetSection = () => {
    const base = saved ?? themes[0]?.design;
    if (!base) return;
    if (section === "color") patchDesign({ [mode]: { ...base[mode] } });
    if (section === "type") patchDesign({ type: { ...base.type } });
    if (section === "space") patchDesign({ space: { ...base.space } });
    if (section === "radius") patchDesign({ radius: { ...base.radius } });
    if (section === "hero") patchDesign({ hero: { ...DEFAULT_HERO } });
  };

  return (
    <div className="fixed right-[20px] bottom-[20px] z-40 flex w-[min(340px,calc(100vw-40px))] flex-col items-end gap-[8px]">
      {open ? (
        <aside className="flex max-h-[min(34rem,calc(100svh-5.5rem))] w-full flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl">
          <div className="flex shrink-0 items-start justify-between gap-[12px] border-b border-border px-[14px] py-[12px]">
            <div>
              <p className="text-[13px] font-medium">Playground</p>
              <p className="mt-[2px] text-[11px] text-muted-foreground">Colors, type, space, radius, and the hero.</p>
            </div>
            <div className="flex items-center gap-[6px]">
              <div className="flex rounded-[8px] bg-muted p-[2px] text-[11px]">
                {(["light", "dark"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={mode === item}
                    onClick={() => setTheme(item)}
                    className={cn(
                      "rounded-[6px] px-[8px] py-[3px] capitalize",
                      mode === item ? "bg-background text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-[28px] items-center justify-center rounded-[8px] text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close playground"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
          <ThemeBar />
          <div className="flex shrink-0 items-center gap-[4px] border-b border-border px-[10px] py-[8px]">
            {SECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={section === item.id}
                onClick={() => setSection(item.id)}
                className={cn(
                  "inline-flex h-[28px] shrink-0 items-center rounded-full px-[10px] text-[12px] leading-none",
                  section === item.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-[14px] py-[14px]">
            {section === "color" ? (
              COLOR_GROUPS.map((group) => (
                <section key={group.title} className="flex flex-col gap-[10px]">
                  <Heading>{group.title}</Heading>
                  {group.keys.map((key) => (
                    <ColorRow key={key} name={key} value={palette[key]} onChange={(value) => setPalette({ [key]: value })} />
                  ))}
                </section>
              ))
            ) : null}
            {section === "type" ? (
              <section className="flex flex-col gap-[12px]">
                <Heading>Family</Heading>
                <label className="grid gap-[6px] text-[12px] text-muted-foreground">
                  Sans
                  <select
                    value={design.type.sans}
                    onChange={(event) => patchDesign({ type: { ...design.type, sans: event.target.value } })}
                    className="h-[32px] rounded-[8px] border border-border bg-background px-[8px] text-[12px] text-foreground"
                  >
                    {SANS_FONTS.map((font) => (
                      <option key={font.id} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-[6px] text-[12px] text-muted-foreground">
                  Mono
                  <select
                    value={design.type.mono}
                    onChange={(event) => patchDesign({ type: { ...design.type, mono: event.target.value } })}
                    className="h-[32px] rounded-[8px] border border-border bg-background px-[8px] text-[12px] text-foreground"
                  >
                    {MONO_FONTS.map((font) => (
                      <option key={font.id} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Slider
                  id="type-body"
                  label="Body"
                  value={design.type.body}
                  min={12}
                  max={20}
                  step={1}
                  display={`${Math.round(design.type.body)} px`}
                  onChange={(body) => patchDesign({ type: { ...design.type, body } })}
                />
                <Slider
                  id="type-ratio"
                  label="Ratio"
                  value={design.type.ratio}
                  min={1.1}
                  max={1.5}
                  step={0.01}
                  display={design.type.ratio.toFixed(2)}
                  onChange={(ratio) => patchDesign({ type: { ...design.type, ratio } })}
                />
                <Slider
                  id="type-tracking"
                  label="Tracking"
                  value={design.type.tracking}
                  min={-0.08}
                  max={0.04}
                  step={0.005}
                  display={`${design.type.tracking.toFixed(3)} em`}
                  onChange={(tracking) => patchDesign({ type: { ...design.type, tracking } })}
                />
                <div className="grid gap-[4px] border-t border-border pt-[12px] text-foreground">
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-display)", letterSpacing: "var(--tracking-display)", lineHeight: 1.02 }}>
                    Display {Math.round(roles.display)}
                  </p>
                  <p style={{ fontSize: "var(--text-title)", letterSpacing: "var(--tracking-title)", fontWeight: 600 }}>
                    Title {Math.round(roles.title)}
                  </p>
                  <p style={{ fontSize: "var(--text-section)", fontWeight: 600 }}>Section {Math.round(roles.section)}</p>
                  <p style={{ fontSize: "var(--text-body)" }}>Body {Math.round(roles.body)}</p>
                  <p className="uppercase" style={{ fontSize: "var(--text-eyebrow)", letterSpacing: "var(--tracking-eyebrow)" }}>
                    Eyebrow {Math.round(roles.eyebrow)}
                  </p>
                  <p className="font-mono" style={{ fontSize: "var(--text-eyebrow)" }}>
                    Mono {Math.round(roles.eyebrow)}
                  </p>
                </div>
              </section>
            ) : null}
            {section === "space" ? (
              <section className="flex flex-col gap-[12px]">
                <Slider
                  id="space-base"
                  label="Base unit"
                  value={design.space.base}
                  min={2}
                  max={8}
                  step={1}
                  display={`${design.space.base} px`}
                  onChange={(base) => patchDesign({ space: { ...design.space, base } })}
                />
                <Slider
                  id="space-page"
                  label="Page"
                  value={design.space.page}
                  min={12}
                  max={64}
                  step={1}
                  display={`${design.space.page} px`}
                  onChange={(page) => patchDesign({ space: { ...design.space, page } })}
                />
                <Slider
                  id="space-section"
                  label="Sections"
                  value={design.space.section}
                  min={8}
                  max={64}
                  step={1}
                  display={`${design.space.section} px`}
                  onChange={(sectionGap) => patchDesign({ space: { ...design.space, section: sectionGap } })}
                />
                <Slider
                  id="space-control"
                  label="Controls"
                  value={design.space.control}
                  min={4}
                  max={24}
                  step={1}
                  display={`${design.space.control} px`}
                  onChange={(control) => patchDesign({ space: { ...design.space, control } })}
                />
              </section>
            ) : null}
            {section === "radius" ? (
              <section className="flex flex-col gap-[12px]">
                <Slider
                  id="radius-base"
                  label="Base"
                  value={design.radius.base}
                  min={2}
                  max={20}
                  step={1}
                  display={`${Math.round(radius.lg)} px`}
                  onChange={(base) => patchDesign({ radius: { ...design.radius, base } })}
                />
                <Slider
                  id="radius-ratio"
                  label="Ratio"
                  value={design.radius.ratio}
                  min={1.15}
                  max={2}
                  step={0.01}
                  display={design.radius.ratio.toFixed(2)}
                  onChange={(ratio) => patchDesign({ radius: { ...design.radius, ratio } })}
                />
                <div className="grid grid-cols-4 gap-[8px] border-t border-border pt-[12px]">
                  {(
                    [
                      ["md", radius.md],
                      ["lg", radius.lg],
                      ["xl", radius.xl],
                      ["2xl", radius.xl2],
                    ] as const
                  ).map(([label, size]) => (
                    <div key={label} className="flex flex-col items-center gap-[6px]">
                      <div className="size-[36px] border border-border bg-muted" style={{ borderRadius: size }} />
                      <span className="text-[10px] text-muted-foreground">
                        {label} {Math.round(size)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            {section === "hero" ? (
              <>
                <section className="flex flex-col gap-[12px]">
                  <div className="flex items-center justify-between">
                    <Heading>Grid</Heading>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={design.hero.squares}
                      onClick={() => setHero({ squares: !design.hero.squares })}
                      className={cn("relative h-[20px] w-[36px] rounded-full", design.hero.squares ? "bg-foreground" : "bg-border-strong")}
                    >
                      <span
                        className={cn(
                          "absolute top-[2px] size-[16px] rounded-full bg-background",
                          design.hero.squares ? "left-[18px]" : "left-[2px]",
                        )}
                      />
                      <span className="sr-only">Show grid</span>
                    </button>
                  </div>
                  {SQUARE_FIELDS.map((field) => (
                    <Slider
                      key={field.key}
                      id={`squares-${field.key}`}
                      label={field.label}
                      value={design.hero[field.key]}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      display={field.unit(design.hero[field.key])}
                      onChange={(value) => setHero({ [field.key]: value })}
                    />
                  ))}
                </section>
                <section className="flex flex-col gap-[12px] border-t border-border pt-[14px]">
                  <Heading>Image</Heading>
                  {IMAGE_FIELDS.map((field) => (
                    <Slider
                      key={field.key}
                      id={`image-${field.key}`}
                      label={field.label}
                      value={design.hero[field.key]}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      display={field.unit(design.hero[field.key])}
                      onChange={(value) => setHero({ [field.key]: value })}
                    />
                  ))}
                </section>
              </>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center justify-between border-t border-border px-[14px] py-[10px]">
            <button
              type="button"
              onClick={resetSection}
              className="inline-flex items-center gap-[6px] text-[12px] text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              Reset section
            </button>
            <button
              type="button"
              onClick={resetEverything}
              className="text-[12px] text-muted-foreground hover:text-foreground"
            >
              Reset all
            </button>
          </div>
        </aside>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-[8px] rounded-[10px] bg-foreground px-[14px] py-[8px] text-[14px] font-medium text-background"
      >
        <SlidersHorizontal className="size-4" />
        Playground
      </button>
    </div>
  );
}
