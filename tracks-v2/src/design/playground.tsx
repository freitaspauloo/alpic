import { Redo2, RotateCcw, SlidersHorizontal, Undo2, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { Alert, AlertDescription } from "@/components/motion/alert";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button/base";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/motion/card";
import {
  ColorPicker,
  ColorPickerAlpha,
  ColorPickerArea,
  ColorPickerChannels,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerHexInput,
  ColorPickerHue,
  ColorPickerSwatch,
  ColorPickerTrigger,
  formatHex,
  parseHex,
} from "@/components/motion/color-picker";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/motion/combobox";
import { Input } from "@/components/motion/input";
import { MorphPopover, MorphPopoverContent, MorphPopoverTrigger } from "@/components/motion/popover-morph";
import { RangeSlider } from "@/components/motion/range-slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/motion/select";
import { Switch } from "@/components/motion/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { ThemeToggle } from "@/components/motion/theme-toggle";
import { Tooltip } from "@/components/motion/tooltip";
import { IMAGE_FIELDS, SQUARE_FIELDS, type HeroConfig } from "@/pages/landing-hero";
import {
  ICON_FAMILIES,
  NAV_ICON_SLOTS,
  clampWeight,
  familyUsesStroke,
  isPixelFamily,
  resolveIcon,
  resolveNavIcon,
  strokeForWeight,
  weightsFor,
  type AppIcon,
  type IconFamily,
  type IconWeight,
} from "./icons";
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
import { EASE_OUT, SPRING_SWAP } from "@/lib/ease";

type Section = "color" | "type" | "icons" | "space" | "radius" | "hero";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "color", label: "Color" },
  { id: "type", label: "Type" },
  { id: "icons", label: "Icons" },
  { id: "space", label: "Space" },
  { id: "radius", label: "Radius" },
  { id: "hero", label: "Hero" },
];

const SERIF = new Set(["georgia", "newsreader", "fraunces", "source-serif", "literata", "ibm-plex-serif"]);

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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function GroupTitle({ children }: { children: string }) {
  return <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">{children}</h2>;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const steps = max > min && step > 0 ? Math.floor((max - min) / step) : 0;
  return (
    <Field label={`${label} · ${display}`}>
      <RangeSlider
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        showTicks={steps > 0 && steps <= 50}
        formatValueText={() => display}
        onValueChange={onChange}
      />
    </Field>
  );
}

function OptionPicker({
  label,
  value,
  options,
  onValueChange,
  disabled,
  strokeWidth,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; group?: string; icon?: AppIcon }[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
  strokeWidth?: number;
}) {
  const groups = [...new Set(options.map((option) => option.group ?? ""))];
  return (
    <Field label={label}>
      <Combobox value={value} onValueChange={onValueChange} disabled={disabled}>
        <ComboboxTrigger className="h-8 min-w-0 rounded-[var(--radius-control)]">
          <ComboboxInput aria-label={label} placeholder={label} />
        </ComboboxTrigger>
        <ComboboxContent className="z-[70]">
          <ComboboxList ariaLabel={label}>
            {groups.map((group) => (
              <ComboboxGroup key={group || "all"}>
                {group ? <ComboboxLabel>{group}</ComboboxLabel> : null}
                {options
                  .filter((option) => (option.group ?? "") === group)
                  .map((option) => {
                    const Icon = option.icon;
                    return (
                      <ComboboxItem key={option.value} value={option.value} textValue={option.label}>
                        <span className="flex items-center gap-2">
                          {Icon ? <Icon className="size-4 shrink-0" strokeWidth={strokeWidth} aria-hidden /> : null}
                          {option.label}
                        </span>
                      </ComboboxItem>
                    );
                  })}
              </ComboboxGroup>
            ))}
            <ComboboxEmpty>No match.</ComboboxEmpty>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}

const COLOR_FORMATS = ["hex", "rgb", "hsl"] as const;
type ColorFormat = (typeof COLOR_FORMATS)[number];

function ColorRow({
  name,
  value,
  format,
  onFormat,
  onChange,
}: {
  name: keyof Palette;
  value: string;
  format: ColorFormat;
  onFormat: (format: ColorFormat) => void;
  onChange: (value: string) => void;
}) {
  const withAlpha = ALPHA_COLORS.has(name);
  const pickerValue = cssColorToPickerValue(value, withAlpha);
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{COLOR_LABELS[name]}</span>
      <ColorPicker
        aria-label={COLOR_LABELS[name]}
        value={pickerValue}
        alpha={withAlpha}
        onValueChange={(next) => onChange(pickerValueToCss(next))}
      >
        <ColorPickerTrigger className="h-8" />
        <ColorPickerContent align="end" className="z-[70]">
          <ColorPickerArea />
          <div className="flex items-center gap-3">
            <ColorPickerEyeDropper />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <ColorPickerHue />
              {withAlpha ? <ColorPickerAlpha /> : null}
            </div>
          </div>
          <div className="flex gap-1" role="group" aria-label="Color mode">
            {COLOR_FORMATS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={format === item ? "secondary" : "ghost"}
                aria-pressed={format === item}
                className="h-7 flex-1 px-2 font-mono text-[11px] uppercase"
                onClick={() => onFormat(item)}
              >
                {item}
              </Button>
            ))}
          </div>
          <div className="flex items-start gap-1.5">
            <ColorPickerHexInput className="min-w-0 flex-1" />
            <ColorPickerSwatch />
          </div>
          {format === "rgb" || format === "hsl" ? <ColorPickerChannels format={format} /> : null}
        </ColorPickerContent>
      </ColorPicker>
    </div>
  );
}

const FONT_WEIGHTS = [
  { value: "100", label: "Thin" },
  { value: "200", label: "Extra light" },
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
];

function TypeNumber({ label, value, onCommit }: { label: string; value: number; onCommit: (value: number) => void }) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    setText((current) => (Number(current) === value ? current : String(value)));
  }, [value]);

  return (
    <Input
      label={label}
      value={text}
      inputMode="decimal"
      onChange={(next) => {
        setText(next);
        if (!/^-?\d*\.?\d+$/.test(next.trim())) return;
        const parsed = Number(next);
        if (Number.isFinite(parsed)) onCommit(parsed);
      }}
    />
  );
}

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
    <div className="flex flex-col gap-4">
      <GroupTitle>Family</GroupTitle>
      <OptionPicker
        label="Sans"
        value={design.type.sans}
        onValueChange={(sans) => setType({ sans })}
        options={sansFonts.map((font) => ({
          value: font.value,
          label: font.label,
          group: SERIF.has(font.id) ? "Serif" : "Sans",
        }))}
      />
      <Field label="Weight">
        <Select
          value={String(design.type.weight)}
          onValueChange={(value) => {
            const weight = Number(value);
            setType({ weight, displayWeight: weight });
          }}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Weight" />
          </SelectTrigger>
          <SelectContent>
            {FONT_WEIGHTS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <TypeNumber
          label="Line height"
          value={design.type.leading}
          onCommit={(leading) => setType({ leading, leadingDisplay: leading, leadingTitle: leading })}
        />
        <TypeNumber
          label="Tracking"
          value={design.type.tracking}
          onCommit={(tracking) => setType({ tracking, trackingTitle: tracking, trackingBody: tracking })}
        />
      </div>
      <div>
        <Button type="button" variant="ghost" size="sm" onClick={() => sansFile.current?.click()}>
          Upload sans
        </Button>
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
      </div>
      <OptionPicker
        label="Mono"
        value={design.type.mono}
        onValueChange={(mono) => setType({ mono })}
        options={monoFonts.map((font) => ({ value: font.value, label: font.label }))}
      />
      <div>
        <Button type="button" variant="ghost" size="sm" onClick={() => monoFile.current?.click()}>
          Upload mono
        </Button>
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
      </div>
      {note ? (
        <Alert variant="destructive">
          <AlertDescription>{note}</AlertDescription>
        </Alert>
      ) : null}
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
    </div>
  );
}

function IconSection() {
  const design = useDesign();
  const icons = design.icons;
  const weight = icons.weight ?? "regular";
  const setIcons = (patch: Partial<typeof icons>) => patchDesign({ icons: { ...icons, ...patch } });
  const stroke = familyUsesStroke(icons.family, weight);
  const families = ICON_FAMILIES.map((family) => ({
    value: family.id,
    label: family.label,
    group: family.group,
    icon: resolveIcon("sparkles", family.id, "regular"),
  }));
  const weights = weightsFor(icons.family).map((item) => ({
    value: item.id,
    label: item.label,
    icon: resolveIcon("sparkles", icons.family, item.id),
  }));

  const chooseFamily = (value: string) => {
    const family = value as IconFamily;
    const nextWeight = clampWeight(family, weight);
    const strokeWidth = familyUsesStroke(family, nextWeight) ? strokeForWeight(nextWeight) : null;
    setIcons({ family, weight: nextWeight, ...(strokeWidth == null ? {} : { strokeWidth }) });
  };

  const chooseWeight = (value: string) => {
    const nextWeight = value as IconWeight;
    const strokeWidth = familyUsesStroke(icons.family, nextWeight) ? strokeForWeight(nextWeight) : null;
    setIcons({ weight: nextWeight, ...(strokeWidth == null ? {} : { strokeWidth }) });
  };

  return (
    <div className="flex flex-col gap-4">
      <GroupTitle>Style</GroupTitle>
      <OptionPicker label="Family" value={icons.family} options={families} strokeWidth={icons.strokeWidth} onValueChange={chooseFamily} />
      <OptionPicker label="Weight" value={weight} options={weights} strokeWidth={icons.strokeWidth} onValueChange={chooseWeight} />
      {stroke ? (
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
      ) : null}
      <div className="flex flex-wrap gap-3 rounded-[var(--radius-lg)] border border-border bg-card p-3">
        {NAV_ICON_SLOTS.map(({ id }) => {
          const Icon = resolveNavIcon(id, icons);
          return (
            <Icon
              key={id}
              className={isPixelFamily(icons.family) ? "size-6 text-foreground" : "size-4 text-foreground"}
              strokeWidth={icons.strokeWidth}
              aria-hidden
            />
          );
        })}
      </div>
    </div>
  );
}

type ThemeActions = {
  naming: boolean;
  setNaming: (value: boolean | ((prev: boolean) => boolean)) => void;
  confirmDelete: boolean;
  setConfirmDelete: (value: boolean) => void;
  name: string;
  setName: (value: string) => void;
};

function ThemeField({ naming, setNaming, setConfirmDelete, name, setName }: ThemeActions) {
  const { activeId, themes, dirty } = useThemes();
  const reduce = useReducedMotion();

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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Theme</span>
        {dirty ? (
          <AnimatedBadge status="warning" size="sm" showIcon={false}>
            Edited
          </AnimatedBadge>
        ) : null}
      </div>
      <Select value={activeId} onValueChange={choose}>
        <SelectTrigger>
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent>
          {themes.map((theme) => (
            <SelectItem key={theme.id} value={theme.id}>
              {theme.builtin ? theme.name : `${theme.name} · saved`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <AnimatePresence initial={false}>
        {naming ? (
          <motion.form
            key="theme-name"
            onSubmit={addTheme}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="flex items-end gap-2 overflow-hidden"
          >
            <div className="min-w-0 flex-1">
              <Input label="Theme name" value={name} onChange={setName} maxLength={40} autoFocus />
            </div>
            <Button type="submit" size="sm" disabled={!name.trim()}>
              Create
            </Button>
          </motion.form>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PlaygroundFooter({ setNaming, confirmDelete, setConfirmDelete, setName }: ThemeActions) {
  const { activeId, themes, dirty } = useThemes();
  const { canUndo, canRedo } = useDesignHistory();
  const reduce = useReducedMotion();
  const active = themes.find((theme) => theme.id === activeId) ?? themes[0];

  const openNaming = () => {
    setConfirmDelete(false);
    setNaming((value) => {
      if (!value) setName("");
      return !value;
    });
  };

  return (
    <CardFooter className="justify-between border-t border-border py-3">
      <div className="flex items-center gap-1">
        <Tooltip content="Undo">
          <Button type="button" variant="ghost" size="icon" disabled={!canUndo} aria-label="Undo" onClick={undoDesign}>
            <Undo2 className="size-4" />
          </Button>
        </Tooltip>
        <Tooltip content="Redo">
          <Button type="button" variant="ghost" size="icon" disabled={!canRedo} aria-label="Redo" onClick={redoDesign}>
            <Redo2 className="size-4" />
          </Button>
        </Tooltip>
        <Tooltip content="Reset theme">
          <Button type="button" variant="ghost" size="icon" disabled={!dirty} aria-label="Reset theme" onClick={resetActiveTheme}>
            <RotateCcw className="size-4" />
          </Button>
        </Tooltip>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {confirmDelete ? (
          <motion.div
            key="confirm"
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: 8 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="flex items-center gap-2"
          >
            <span className="text-xs text-foreground">Delete {active.name}?</span>
            <Button
              type="button"
              size="sm"
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                deleteTheme(active.id);
                setConfirmDelete(false);
              }}
            >
              Delete
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="actions"
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -8 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="flex flex-wrap justify-end gap-1"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={active.builtin}
              onClick={() => {
                setNaming(false);
                setConfirmDelete(true);
              }}
            >
              Delete
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={openNaming}>
              New theme
            </Button>
            <Button type="button" size="sm" disabled={!dirty} onClick={applyTheme} className="disabled:opacity-40">
              Save
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </CardFooter>
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
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section>("color");
  const [colorFormat, setColorFormat] = useState<ColorFormat>("hex");
  const [naming, setNaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [themeName, setThemeName] = useState("");
  const themeActions = { naming, setNaming, confirmDelete, setConfirmDelete, name: themeName, setName: setThemeName };
  const mode = resolvedTheme === "dark" ? "dark" : "light";
  const palette = design[mode];
  const radius = radiusSteps(design.radius);
  const panelRadius = Math.round(radius.xl2);
  const reduce = useReducedMotion();
  const setPalette = (patch: Partial<Palette>) => patchDesign({ [mode]: { ...palette, ...patch } });
  const setHero = (patch: Partial<HeroConfig>) => patchDesign({ hero: { ...design.hero, ...patch } });

  return (
    <MorphPopover open={open} onOpenChange={setOpen} className="fixed right-5 bottom-5 z-40">
      <MorphPopoverTrigger>
        <Button type="button" size="icon" aria-label="Playground">
          <motion.span
            className="inline-flex"
            initial={false}
            animate={{ rotate: open ? 90 : 0, scale: open ? 0.92 : 1 }}
            transition={reduce ? { duration: 0.15, ease: EASE_OUT } : SPRING_SWAP}
          >
            <SlidersHorizontal className="size-4" />
          </motion.span>
        </Button>
      </MorphPopoverTrigger>
      <MorphPopoverContent
        side="top"
        align="end"
        sideOffset={10}
        radius={panelRadius}
        className="flex w-[min(24rem,calc(100vw-2rem))] max-h-[min(52rem,calc(100svh-4.5rem))] flex-col overflow-hidden p-0"
      >
        <Card size="compact" className="flex max-h-[min(52rem,calc(100svh-4.5rem))] w-full flex-col gap-0 border-0 bg-transparent py-0 shadow-none">
          <CardHeader className="border-b border-border py-3">
            <CardTitle>Playground</CardTitle>
            <CardAction className="gap-1">
              <ThemeToggle
                variant="circle"
                className="size-8 rounded-[var(--radius-control)] text-muted-foreground hover:bg-muted hover:text-foreground"
                iconClassName="size-4"
              />
              <Button type="button" variant="ghost" size="icon" aria-label="Close playground" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </CardAction>
          </CardHeader>
          <div className="flex min-h-0 flex-1 flex-col">
            <motion.div
              layout={!reduce}
              className="relative z-30 shrink-0 border-b border-border px-4 py-3"
              transition={{ layout: SPRING_SWAP }}
            >
              <ThemeField {...themeActions} />
            </motion.div>
            <Tabs value={section} onValueChange={(value) => setSection(value as Section)} variant="underline" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="px-2">
                {SECTIONS.map((item) => (
                  <TabsTrigger key={item.id} value={item.id}>
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <CardContent className="min-h-0 flex-1 overflow-y-auto py-4">
                <TabsContent value="color" className="mt-0 flex flex-col gap-5">
                  {COLOR_GROUPS.map((group) => (
                    <section key={group.title} className="flex flex-col gap-3">
                      <GroupTitle>{group.title}</GroupTitle>
                      {group.keys.map((key) => (
                        <ColorRow
                          key={key}
                          name={key}
                          value={palette[key]}
                          format={colorFormat}
                          onFormat={setColorFormat}
                          onChange={(value) => setPalette({ [key]: value })}
                        />
                      ))}
                    </section>
                  ))}
                </TabsContent>
                <TabsContent value="type" className="mt-0">
                  <TypeSection />
                </TabsContent>
                <TabsContent value="icons" className="mt-0">
                  <IconSection />
                </TabsContent>
                <TabsContent value="space" className="mt-0 flex flex-col gap-4">
                  <Slider id="space-base" label="Base unit" value={design.space.base} min={2} max={8} step={1} display={`${design.space.base} px`} onChange={(base) => patchDesign({ space: { ...design.space, base } })} />
                  <Slider id="space-page" label="Page" value={design.space.page} min={12} max={64} step={1} display={`${design.space.page} px`} onChange={(page) => patchDesign({ space: { ...design.space, page } })} />
                  <Slider id="space-section" label="Sections" value={design.space.section} min={8} max={64} step={1} display={`${design.space.section} px`} onChange={(sectionGap) => patchDesign({ space: { ...design.space, section: sectionGap } })} />
                  <Slider id="space-control" label="Controls" value={design.space.control} min={4} max={24} step={1} display={`${design.space.control} px`} onChange={(control) => patchDesign({ space: { ...design.space, control } })} />
                </TabsContent>
                <TabsContent value="radius" className="mt-0 flex flex-col gap-4">
                  <Slider id="radius-base" label="Base" value={design.radius.base} min={0} max={32} step={1} display={`${Math.round(radius.lg)} px`} onChange={(base) => patchDesign({ radius: { ...design.radius, base } })} />
                  <Slider id="radius-ratio" label="Ratio" value={design.radius.ratio} min={1.15} max={2} step={0.01} display={design.radius.ratio.toFixed(2)} onChange={(ratio) => patchDesign({ radius: { ...design.radius, ratio } })} />
                  <div className="flex flex-col gap-3 border-t border-border pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Button</span>
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">xl {Math.round(radius.xl)} px</span>
                    </div>
                    <Button type="button" size="sm" className="w-fit">
                      New experiment
                    </Button>
                    <div className="flex items-center justify-between text-sm">
                      <span>Card</span>
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">2xl {Math.round(radius.xl2)} px</span>
                    </div>
                    <div className="h-12 border border-border bg-card" style={{ borderRadius: radius.xl2 }} />
                  </div>
                </TabsContent>
                <TabsContent value="hero" className="mt-0 flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <GroupTitle>Grid</GroupTitle>
                    <Switch checked={design.hero.squares} onCheckedChange={(squares) => setHero({ squares })} ariaLabel="Show grid" />
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
                  <GroupTitle>Image</GroupTitle>
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
                </TabsContent>
              </CardContent>
            </Tabs>
          </div>
          <PlaygroundFooter {...themeActions} />
        </Card>
      </MorphPopoverContent>
    </MorphPopover>
  );
}
