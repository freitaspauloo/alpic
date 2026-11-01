import { Redo2, RotateCcw, SlidersHorizontal, Undo2, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTheme } from "next-themes";
import { RangeSlider } from "@/components/motion/range-slider";
import {
  ColorPicker,
  ColorPickerAlpha,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerHexInput,
  ColorPickerHue,
  ColorPickerSwatch,
  ColorPickerTrigger,
  formatHex,
  parseHex,
} from "@/components/motion/color-picker";
import { cn } from "@/lib/utils";
import { IMAGE_FIELDS, SQUARE_FIELDS, type HeroConfig } from "@/pages/landing-hero";
import { ICON_CATALOG, NAV_ICON_SLOTS, resolveNavIcon } from "./icons";
import { MONO_FONTS, SANS_FONTS, fontStack, uploadFont, useUploadedFonts } from "./fonts";
import {
  ALPHA_COLORS,
  COLOR_GROUPS,
  COLOR_LABELS,
  applyTheme,
  deleteTheme,
  patchDesign,
  radiusSteps,
  readColor,
  redoDesign,
  resetActiveTheme,
  saveTheme,
  scaleRoles,
  selectTheme,
  undoDesign,
  useDesignHistory,
  type Palette,
  useDesign,
  useThemes,
  writeColor,
} from "./theme";

type Section = "color" | "type" | "icons" | "space" | "radius" | "hero";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "color", label: "Color" },
  { id: "type", label: "Type" },
  { id: "icons", label: "Icons" },
  { id: "space", label: "Space" },
  { id: "radius", label: "Radius" },
  { id: "hero", label: "Hero" },
];

function cssColorToPickerValue(raw: string, withAlpha: boolean): string {
  const { hex, alpha } = readColor(raw);
  const rgba = parseHex(hex) ?? { r: 0, g: 0, b: 0, a: 1 };
  return formatHex({ ...rgba, a: withAlpha ? alpha : 1 });
}

function pickerValueToCss(hex: string): string {
  const rgba = parseHex(hex);
  if (!rgba) return hex;
  const rgb = formatHex({ ...rgba, a: 1 }).slice(0, 7);
  return writeColor(rgb, rgba.a);
}

function Slider({
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
  const steps = max > min && step > 0 ? Math.floor((max - min) / step) : 0;
  return (
    <div className="grid gap-[6px]">
      <div className="flex items-baseline justify-between gap-[12px]">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        <span className="font-mono text-[11px] text-foreground tabular-nums">{display}</span>
      </div>
      <RangeSlider
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        showTicks={steps > 0 && steps <= 50}
        onValueChange={onChange}
        className="h-9 rounded-[var(--radius-lg)]"
      />
    </div>
  );
}

function ColorRow({ name, value, onChange }: { name: keyof Palette; value: string; onChange: (value: string) => void }) {
  const withAlpha = ALPHA_COLORS.has(name);
  const pickerValue = cssColorToPickerValue(value, withAlpha);
  return (
    <div className="flex items-center justify-between gap-[10px]">
      <span className="min-w-0 flex-1 truncate text-[12px] text-foreground">{COLOR_LABELS[name]}</span>
      <ColorPicker
        aria-label={COLOR_LABELS[name]}
        value={pickerValue}
        alpha={withAlpha}
        onValueChange={(next) => onChange(pickerValueToCss(next))}
      >
        <ColorPickerTrigger className="h-8 shrink-0 gap-2 rounded-[var(--radius-lg)] pr-2 pl-1.5 text-[11px]" />
        <ColorPickerContent align="end" className="z-[60] w-[min(100vw-2rem,18rem)]">
          <ColorPickerArea />
          <div className="flex items-center gap-3">
            <ColorPickerEyeDropper />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <ColorPickerHue />
              {withAlpha ? <ColorPickerAlpha /> : null}
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <ColorPickerHexInput className="min-w-0 flex-1" />
            <ColorPickerSwatch />
          </div>
        </ColorPickerContent>
      </ColorPicker>
    </div>
  );
}

function IconSection() {
  const design = useDesign();
  const icons = design.icons;
  const setIcons = (patch: Partial<typeof icons>) => patchDesign({ icons: { ...icons, ...patch } });
  const setNavIcon = (navId: string, iconId: string) =>
    patchDesign({ icons: { ...icons, nav: { ...icons.nav, [navId]: iconId } } });

  return (
    <section className="flex flex-col gap-[12px]">
      <p className="text-[12px] leading-[1.45] text-muted-foreground">
        Sidebar and library icons. Stroke applies everywhere Lucide icons render in the product shell.
      </p>
      <Heading>Style</Heading>
      <label className="grid gap-[6px] text-[12px] text-muted-foreground">
        Family
        <select
          value={icons.family}
          disabled
          className={cn("h-[32px] border border-border bg-background px-[8px] text-[12px] text-foreground", FIELD)}
        >
          <option value="lucide">Lucide</option>
        </select>
      </label>
      <Slider
        id="icon-stroke"
        label="Stroke"
        value={icons.strokeWidth}
        min={1.25}
        max={2.5}
        step={0.25}
        display={icons.strokeWidth.toFixed(2)}
        onChange={(strokeWidth) => setIcons({ strokeWidth })}
      />
      <Heading>Navigation</Heading>
      <div className="flex flex-wrap gap-[8px] border border-border p-[10px]">
        {NAV_ICON_SLOTS.slice(0, 5).map(({ id }) => {
          const Icon = resolveNavIcon(id, icons);
          return <Icon key={id} className="size-4 text-foreground" strokeWidth={icons.strokeWidth} aria-hidden />;
        })}
      </div>
      {NAV_ICON_SLOTS.map(({ id, label }) => (
        <label key={id} className="grid gap-[6px] text-[12px] text-muted-foreground">
          {label}
          <select
            value={icons.nav[id] ?? ""}
            onChange={(event) => setNavIcon(id, event.target.value)}
            className={cn("h-[32px] border border-border bg-background px-[8px] text-[12px] text-foreground", FIELD)}
          >
            {ICON_CATALOG.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </section>
  );
}

function Heading({ children }: { children: string }) {
  return <h2 className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{children}</h2>;
}

const CONTROL = "rounded-[var(--radius-control)]";
const FIELD = "rounded-[var(--radius-lg)]";

function TypeSection() {
  const design = useDesign();
  const uploaded = useUploadedFonts();
  const sansFile = useRef<HTMLInputElement>(null);
  const monoFile = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const sansFonts = [
    ...SANS_FONTS,
    ...uploaded.filter((font) => font.role === "sans").map((font) => ({ id: font.file, label: font.family, value: fontStack(font) })),
  ];
  const monoFonts = [
    ...MONO_FONTS,
    ...uploaded.filter((font) => font.role === "mono").map((font) => ({ id: font.file, label: font.family, value: fontStack(font) })),
  ];
  if (!sansFonts.some((font) => font.value === design.type.sans)) {
    sansFonts.push({ id: "current-sans", label: "Current", value: design.type.sans });
  }
  if (!monoFonts.some((font) => font.value === design.type.mono)) {
    monoFonts.push({ id: "current-mono", label: "Current", value: design.type.mono });
  }

  const setType = (patch: Partial<typeof design.type>) => patchDesign({ type: { ...design.type, ...patch } });
  const addFont = async (file: File | undefined, role: "sans" | "mono") => {
    if (!file) return;
    const stack = await uploadFont(file, role);
    if (!stack) {
      setNote("Use a woff2, woff, ttf, or otf file under 2 MB.");
      return;
    }
    setNote("");
    setType(role === "sans" ? { sans: stack } : { mono: stack });
  };

  return (
    <section className="flex flex-col gap-[12px]">
      <p className="text-[12px] leading-[1.45] text-muted-foreground">
        Display is the landing headline. Title is the page name. Section is a block heading. Eyebrow is the small label. Mono is the code line under it. Scale rebuilds those sizes from body.
      </p>
      <Heading>Family</Heading>
      <label className="grid gap-[6px] text-[12px] text-muted-foreground">
        Sans
        <select
          value={design.type.sans}
          onChange={(event) => setType({ sans: event.target.value })}
          className={cn("h-[32px] border border-border bg-background px-[8px] text-[12px] text-foreground", FIELD)}
          style={{ fontFamily: design.type.sans }}
        >
          <optgroup label="Sans">
            {sansFonts.filter((font) => !["georgia", "newsreader", "fraunces", "source-serif", "literata"].includes(font.id)).map((font) => (
              <option key={font.id} value={font.value} style={{ fontFamily: font.value }}>
                {font.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Serif">
            {sansFonts.filter((font) => ["georgia", "newsreader", "fraunces", "source-serif", "literata"].includes(font.id)).map((font) => (
              <option key={font.id} value={font.value} style={{ fontFamily: font.value }}>
                {font.label}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <button type="button" onClick={() => sansFile.current?.click()} className={cn(ACTION, "w-fit text-muted-foreground hover:bg-muted hover:text-foreground")}>
        Upload sans
      </button>
      <input
        ref={sansFile}
        type="file"
        accept=".woff2,.woff,.ttf,.otf"
        className="hidden"
        onChange={(event) => {
          void addFont(event.target.files?.[0], "sans");
          event.target.value = "";
        }}
      />
      <label className="grid gap-[6px] text-[12px] text-muted-foreground">
        Mono
        <select
          value={design.type.mono}
          onChange={(event) => setType({ mono: event.target.value })}
          className={cn("h-[32px] border border-border bg-background px-[8px] text-[12px] text-foreground", FIELD)}
          style={{ fontFamily: design.type.mono }}
        >
          {monoFonts.map((font) => (
            <option key={font.id} value={font.value} style={{ fontFamily: font.value }}>
              {font.label}
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={() => monoFile.current?.click()} className={cn(ACTION, "w-fit text-muted-foreground hover:bg-muted hover:text-foreground")}>
        Upload mono
      </button>
      <input
        ref={monoFile}
        type="file"
        accept=".woff2,.woff,.ttf,.otf"
        className="hidden"
        onChange={(event) => {
          void addFont(event.target.files?.[0], "mono");
          event.target.value = "";
        }}
      />
      {note ? <p className="text-[12px] text-muted-foreground">{note}</p> : null}
      <Slider
        id="type-ratio"
        label="Scale"
        value={design.type.ratio}
        min={1.1}
        max={1.5}
        step={0.01}
        display={design.type.ratio.toFixed(2)}
        onChange={(ratio) => {
          const scale = scaleRoles(design.type.body, ratio);
          setType({ ratio, display: scale.display, title: scale.title, section: scale.section, eyebrow: scale.eyebrow, monoSize: scale.monoSize });
        }}
      />
      <Slider id="type-display" label="Display" value={design.type.display} min={24} max={96} step={1} display={`${Math.round(design.type.display)} px`} onChange={(display) => setType({ display })} />
      <Slider id="type-title" label="Title" value={design.type.title} min={16} max={64} step={1} display={`${Math.round(design.type.title)} px`} onChange={(title) => setType({ title })} />
      <Slider id="type-section" label="Section" value={design.type.section} min={13} max={40} step={1} display={`${Math.round(design.type.section)} px`} onChange={(sectionSize) => setType({ section: sectionSize })} />
      <Slider id="type-body" label="Body" value={design.type.body} min={11} max={24} step={1} display={`${Math.round(design.type.body)} px`} onChange={(body) => setType({ body })} />
      <Slider id="type-eyebrow" label="Eyebrow" value={design.type.eyebrow} min={9} max={20} step={1} display={`${Math.round(design.type.eyebrow)} px`} onChange={(eyebrow) => setType({ eyebrow })} />
      <Slider id="type-mono" label="Mono" value={design.type.monoSize} min={10} max={22} step={1} display={`${Math.round(design.type.monoSize)} px`} onChange={(monoSize) => setType({ monoSize })} />
      <Slider
        id="type-tracking"
        label="Tracking"
        value={design.type.tracking}
        min={-0.08}
        max={0.04}
        step={0.005}
        display={`${design.type.tracking.toFixed(3)} em`}
        onChange={(tracking) => setType({ tracking })}
      />
    </section>
  );
}

const ACTION = cn(
  "inline-flex h-[28px] shrink-0 items-center px-[10px] text-[12px] leading-none disabled:pointer-events-none disabled:opacity-40",
  CONTROL,
);

const ICON_ACTION = cn(
  "inline-flex size-[28px] shrink-0 items-center justify-center disabled:pointer-events-none disabled:opacity-40",
  FIELD,
  "text-muted-foreground hover:bg-muted hover:text-foreground",
);

type ThemeActions = {
  naming: boolean;
  setNaming: (value: boolean | ((prev: boolean) => boolean)) => void;
  confirmDelete: boolean;
  setConfirmDelete: (value: boolean) => void;
};

function PlaygroundFooter({ setNaming, confirmDelete, setConfirmDelete, setName }: ThemeActions & { setName: (value: string) => void }) {
  const { activeId, themes, dirty } = useThemes();
  const { canUndo, canRedo } = useDesignHistory();
  const active = themes.find((theme) => theme.id === activeId) ?? themes[0];

  const openNaming = () => {
    setConfirmDelete(false);
    setNaming((value) => {
      if (!value) setName("");
      return !value;
    });
  };

  return (
    <div className="flex shrink-0 items-center justify-between gap-[8px] border-t border-border px-[14px] py-[10px]">
      <div className="flex items-center gap-[4px]">
        <button type="button" disabled={!canUndo} onClick={undoDesign} className={ICON_ACTION} aria-label="Undo">
          <Undo2 className="size-3.5" />
        </button>
        <button type="button" disabled={!canRedo} onClick={redoDesign} className={ICON_ACTION} aria-label="Redo">
          <Redo2 className="size-3.5" />
        </button>
        <button type="button" disabled={!dirty} onClick={resetActiveTheme} className={ICON_ACTION} aria-label="Reset theme">
          <RotateCcw className="size-3.5" />
        </button>
      </div>
      {confirmDelete ? (
        <div className="flex items-center gap-[6px]">
          <span className="text-[12px] text-foreground">Delete {active.name}?</span>
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
      ) : (
        <div className="flex flex-wrap justify-end gap-[6px]">
          <button
            type="button"
            disabled={active.builtin}
            onClick={() => {
              setNaming(false);
              setConfirmDelete(true);
            }}
            className={cn(ACTION, "text-muted-foreground hover:bg-muted hover:text-foreground")}
          >
            Delete
          </button>
          <button type="button" onClick={openNaming} className={cn(ACTION, "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            New theme
          </button>
          <button
            type="button"
            disabled={!dirty}
            onClick={applyTheme}
            className={cn(ACTION, dirty ? "bg-foreground text-background" : "text-muted-foreground")}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

function ThemeBar({ naming, setNaming, setConfirmDelete, name, setName }: ThemeActions & { name: string; setName: (value: string) => void }) {
  const { activeId, themes, dirty } = useThemes();

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
    <div className="flex shrink-0 flex-col gap-[8px] border-b border-border px-[14px] py-[12px]">
      <div className="flex items-baseline justify-between gap-[8px]">
        <label htmlFor="design-theme" className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Theme
        </label>
        {dirty ? <span className="text-[11px] text-foreground">Edited</span> : null}
      </div>
      <select
        id="design-theme"
        value={activeId}
        onChange={(event) => choose(event.target.value)}
        className={cn("h-[32px] w-full border border-border bg-background px-[8px] text-[12px] text-foreground", FIELD)}
      >
        {themes.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.builtin ? theme.name : `${theme.name} · saved`}
          </option>
        ))}
      </select>
      {naming ? (
        <form onSubmit={addTheme} className="flex flex-col gap-[6px]">
          <div className="flex gap-[6px]">
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Theme name"
              maxLength={40}
              aria-label="Theme name"
              className={cn("h-[32px] min-w-0 flex-1 border border-border bg-background px-[8px] text-[12px] text-foreground", FIELD)}
            />
            <button type="submit" disabled={!name.trim()} className={cn(ACTION, "bg-primary text-primary-foreground")}>
              Create
            </button>
          </div>
          <p className="text-[11px] leading-[1.4] text-muted-foreground">
            Saves the colors, type, space, and radius on screen. Light and dark are both included.
          </p>
        </form>
      ) : null}
    </div>
  );
}

export function DesignPlayground() {
  const design = useDesign();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.isContentEditable) return;
      if (target instanceof HTMLTextAreaElement) return;
      if (target instanceof HTMLInputElement && target.type !== "range" && target.type !== "color") return;
      const meta = event.metaKey || event.ctrlKey;
      if (!meta) return;
      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        redoDesign();
      } else if (key === "z") {
        event.preventDefault();
        undoDesign();
      } else if (key === "y") {
        event.preventDefault();
        redoDesign();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section>("color");
  const [naming, setNaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [themeName, setThemeName] = useState("");
  const themeActions = { naming, setNaming, confirmDelete, setConfirmDelete };
  const mode = resolvedTheme === "dark" ? "dark" : "light";
  const palette = design[mode];
  const radius = radiusSteps(design.radius);

  const setPalette = (patch: Partial<Palette>) => patchDesign({ [mode]: { ...palette, ...patch } });
  const setHero = (patch: Partial<HeroConfig>) => patchDesign({ hero: { ...design.hero, ...patch } });

  return (
    <div className="fixed right-[20px] bottom-[20px] z-40 flex w-[min(400px,calc(100vw-32px))] flex-col items-end gap-[8px]">
      {open ? (
        <aside className="flex max-h-[min(52rem,calc(100svh-4.5rem))] w-full flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-popover text-popover-foreground shadow-xl">
          <div className="flex shrink-0 items-start justify-between gap-[12px] border-b border-border px-[14px] py-[12px]">
            <p className="text-[13px] font-medium">Playground</p>
            <div className="flex items-center gap-[6px]">
              <div className={cn("flex bg-muted p-[2px] text-[11px]", FIELD)}>
                {(["light", "dark"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={mode === item}
                    onClick={() => setTheme(item)}
                    className={cn(
                      "inline-flex h-[24px] items-center px-[8px] capitalize",
                      FIELD,
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
                className={cn("inline-flex size-[28px] items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground", FIELD)}
                aria-label="Close playground"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
          <ThemeBar {...themeActions} name={themeName} setName={setThemeName} />
          <div className="flex shrink-0 items-center gap-[4px] border-b border-border px-[10px] py-[8px]">
            {SECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={section === item.id}
                onClick={() => setSection(item.id)}
                className={cn(
                  "inline-flex h-[28px] shrink-0 items-center rounded-[var(--radius-control)] px-[10px] text-[12px] leading-none",
                  section === item.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-[14px] py-[14px]">
            {section === "color" ? (
              <>
              {COLOR_GROUPS.map((group) => (
                <section key={group.title} className="flex flex-col gap-[10px]">
                  <Heading>{group.title}</Heading>
                  {group.keys.map((key) => (
                    <ColorRow key={key} name={key} value={palette[key]} onChange={(value) => setPalette({ [key]: value })} />
                  ))}
                </section>
              ))}
              </>
            ) : null}
            {section === "type" ? <TypeSection /> : null}
            {section === "icons" ? <IconSection /> : null}
            {section === "space" ? (
              <section className="flex flex-col gap-[12px]">
                <p className="text-[12px] leading-[1.45] text-muted-foreground">
                  Page is the outer padding. Section is the gap between blocks. Control is the gap between buttons. The base unit scales Tailwind spacing.
                </p>
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
                <p className="text-[12px] leading-[1.45] text-muted-foreground">
                  One base and one ratio. Buttons, inputs, and the Playground button use the xl step. Cards and this popup use 2xl. Fields in here use lg.
                </p>
                <Slider
                  id="radius-base"
                  label="Base"
                  value={design.radius.base}
                  min={0}
                  max={32}
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
                <div className="flex flex-col gap-[8px] border-t border-border pt-[12px]">
                  <div className="flex items-center justify-between gap-[12px]">
                    <span className="text-[12px] text-foreground">Button</span>
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">xl {Math.round(radius.xl)} px</span>
                  </div>
                  <button type="button" className={cn("inline-flex h-[36px] items-center bg-primary px-[14px] text-[13px] font-medium text-primary-foreground", CONTROL)}>
                    New experiment
                  </button>
                  <div className="flex items-center justify-between gap-[12px]">
                    <span className="text-[12px] text-foreground">Card and popup</span>
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">2xl {Math.round(radius.xl2)} px</span>
                  </div>
                  <div className="h-[48px] border border-border bg-card" style={{ borderRadius: radius.xl2 }} />
                  <div className="flex items-center justify-between gap-[12px]">
                    <span className="text-[12px] text-foreground">Field</span>
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">lg {Math.round(radius.lg)} px</span>
                  </div>
                  <div className={cn("h-[32px] border border-border bg-background", FIELD)} />
                </div>
              </section>
            ) : null}
            {section === "hero" ? (
              <>
                <p className="text-[12px] leading-[1.45] text-muted-foreground">
                  Only the landing image. Switching or resetting a theme keeps the hero. Reset in this section restores the default image.
                </p>
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
          <PlaygroundFooter {...themeActions} setName={setThemeName} />
        </aside>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn("inline-flex h-[40px] items-center gap-[8px] bg-foreground px-[14px] text-[14px] font-medium text-background", CONTROL)}
      >
        <SlidersHorizontal className="size-4" />
        Playground
      </button>
    </div>
  );
}
