import { useState, type ReactNode } from "react";
import { Page, PageSection } from "@/app/page-layout";
import { Drawer } from "@/components/motion/drawer";
import { useTheme } from "next-themes";
import { Copy, Download, SlidersHorizontal } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { DesignSystemWorkspace, useDesignKeyboardShortcuts } from "@/design/playground";
import { COLOR_GROUPS, COLOR_LABELS, radiusSteps, typeRoles, useDesign, useThemes } from "@/design/theme";
import { NAV_ICON_SLOTS, resolveNavIcon } from "@/design/icons";
import { Button, ButtonLink } from "@/components/motion/button/base";
import { Card, CardContent } from "@/components/motion/card";
import { Input } from "@/components/motion/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Tooltip } from "@/components/motion/tooltip";
import { CommandSearchField } from "@/components/motion/command-search-field";
import { ThemeModeSwitch } from "@/components/motion/theme-mode-switch";
import { Table, type TableColumn } from "@/components/motion/table";
import { EASE_OUT, SPRING_LAYOUT, SPRING_PRESS, SPRING_PANEL } from "@/lib/ease";

const SECTIONS = [
  { id: "foundations", label: "Foundations" },
  { id: "patterns", label: "Patterns" },
  { id: "motion", label: "Motion" },
] as const;

/** Product page sections containing unchanged beUI controls. */
function Specimen({ title, description, children, className }: { title: string; description: string; children: ReactNode; className?: string }) {
  return <PageSection title={title} description={description} className={className}>
    <Card><CardContent><div className="flex flex-col" style={{ gap: "var(--space-section)" }}>{children}</div></CardContent></Card>
  </PageSection>;
}
function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center" style={{ gap: "var(--space-control)" }}>{children}</div>;
}
function SectionIntro({ title, children }: { label?: string; title: string; children: ReactNode }) {
  return <PageSection title={title} description={children} />;
}

export function DesignSystem() {
  useDesignKeyboardShortcuts();
  const design = useDesign();
  const library = useThemes();
  const [section, setSection] = useState("foundations");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState(false);
  const [notice, setNotice] = useState("");
  const activeTheme = library.themes.find((theme) => theme.id === library.activeId);
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setNotice("Copied " + value); }
    catch { setNotice("Copy unavailable. Select the token value to copy it."); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ theme: activeTheme?.name, design }, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "tracks-design-tokens.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Exported the current design tokens.");
  };
  return <main className="min-h-svh bg-background text-foreground">
    <Page
      title="Design system"
      description="Foundations, patterns, and motion."
      width="wide"
      actions={
        <>
          <CommandSearchField
            className="h-9 w-52 flex-none"
            aria-label="Search tokens"
            placeholder="Search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSection("foundations");
            }}
          />
          <ThemeModeSwitch />
          <ButtonLink href="/components" variant="outline" size="sm" className="h-9 px-3 text-sm">Components</ButtonLink>
          <Button variant="outline" size="sm" className="h-9 px-3 text-sm" onClick={download}><Download className="size-4" />Export tokens</Button>
          <Button variant="primary" size="sm" className="h-9 px-3 text-sm" onClick={() => setEditor(true)}><SlidersHorizontal className="size-4" />Customize theme</Button>
        </>
      }
    >
      <Tabs value={section} onValueChange={setSection} variant="underline">
        <TabsList aria-label="Design system sections">{SECTIONS.map((item) => <TabsTrigger key={item.id} value={item.id}>{item.label}</TabsTrigger>)}</TabsList>
        <TabsContent value="foundations"><Foundations copy={copy} query={query} /></TabsContent>
        <TabsContent value="patterns"><Patterns /></TabsContent>
        <TabsContent value="motion"><MotionSpecimens /></TabsContent>
      </Tabs>
      <p role="status" aria-live="polite" className="min-h-5 text-xs text-muted-foreground">{notice}</p>
    </Page>
    <Drawer open={editor} onOpenChange={setEditor} side="right" ariaLabel="Customize theme" className="w-[30rem] max-w-[92vw]">
      <DesignSystemWorkspace title="Customize theme" onClose={() => setEditor(false)} className="max-h-none min-h-0 flex-1" />
    </Drawer>
  </main>;
}

function Foundations({ copy, query }: { copy: (value: string) => void; query: string }) {
  const design = useDesign();
  const { resolvedTheme } = useTheme();
  const palette = design[resolvedTheme === "dark" ? "dark" : "light"];
  const radii = radiusSteps(design.radius);
  const needle = query.trim().toLowerCase();
  const groups = COLOR_GROUPS.map((group) => ({
    ...group,
    rows: group.keys
      .map((key) => ({ id: key, name: COLOR_LABELS[key], value: palette[key] }))
      .filter((row) => !needle || (row.name + " " + row.value).toLowerCase().includes(needle)),
  })).filter((group) => group.rows.length > 0);
  return <div className="flex flex-col" style={{ gap: "var(--space-section)" }}>
    <SectionIntro title="Colors">Semantic colors from the active theme. Customize them in the playground; the product and these examples update together.</SectionIntro>
    {groups.map((group) => {
      const rows = group.rows;
      const tokenColumns: TableColumn<(typeof rows)[number]>[] = [
        { key: "name", header: "Token", sortable: true, cell: (row) => <span className="flex items-center gap-3"><span aria-hidden="true" className="size-6 shrink-0 rounded-[var(--radius-sm)] border border-border" style={{ backgroundColor: row.value }} />{row.name}</span> },
        { key: "value", header: "Value", cell: (row) => <code className="break-all font-mono text-xs text-muted-foreground">{row.value}</code> },
        { key: "copy", header: "", width: "56px", cell: (row) => <Tooltip content="Copy value"><Button variant="ghost" size="icon" aria-label={"Copy " + row.name} onClick={() => copy(row.value)}><Copy className="size-3.5" /></Button></Tooltip> },
      ];
      return <PageSection key={group.title} title={group.title}><Table data={rows} columns={tokenColumns} getRowId={(row) => row.id} height={rows.length * 52 + 56} /></PageSection>;
    })}
    {!groups.length ? <p className="text-sm text-muted-foreground">No tokens match that search.</p> : null}
    {!needle ? <>
    <Specimen title="Typography" description={"Sans: " + design.type.sans.split(",")[0] + " · Mono: " + design.type.mono.split(",")[0]}>
      {Object.entries(typeRoles(design.type)).map(([role, size]) => <div key={role} className="grid min-w-0 gap-2 border-b border-border pb-4 sm:grid-cols-[7rem_minmax(0,1fr)]"><span className="pt-2 font-mono text-xs text-muted-foreground">{role} / {size}px</span><p className="min-w-0 break-words" style={{ fontSize: size, fontFamily: role === "mono" ? design.type.mono : design.type.sans, lineHeight: role === "display" ? design.type.leadingDisplay : design.type.leading, fontWeight: ["display", "title"].includes(role) ? design.type.displayWeight : design.type.weight, letterSpacing: role === "display" ? design.type.tracking + "em" : design.type.trackingBody + "em" }}>{role === "mono" ? "run_8f2a · 12 / 24" : role === "display" ? "Built for agents." : "Make every run count."}</p></div>)}
      <p className="text-xs text-muted-foreground">Scale ratio {design.type.ratio} · Body line height {design.type.leading} · UI weight {design.type.weight}</p>
    </Specimen>
    <div className="grid gap-5 xl:grid-cols-2"><Specimen title="Spacing" description="One base unit, with explicit page, section, and control rhythms.">
      {Object.entries(design.space).map(([name, value]) => <div key={name} className="flex items-center gap-4"><span className="w-16 text-xs text-muted-foreground">{name}</span><div className="h-4 bg-primary" style={{ width: value }} /><code className="font-mono text-xs">{value}px</code></div>)}
      <Row>{[1, 2, 3, 4, 6, 8, 12].map((multiple) => <div key={multiple} className="flex flex-col items-center gap-2"><div className="bg-muted" style={{ width: design.space.base * multiple, height: design.space.base * multiple }} /><span className="font-mono text-xs text-muted-foreground">{multiple}×</span></div>)}</Row>
    </Specimen><Specimen title="Corner scale" description="Derived from the theme base and ratio."><div className="grid grid-cols-3 gap-4">{Object.entries(radii).map(([name, value]) => <div key={name} className="flex flex-col gap-2"><div className="h-16 border border-border bg-muted" style={{ borderRadius: value }} /><code className="font-mono text-xs text-muted-foreground">{name} · {Math.round(value * 10) / 10}px</code></div>)}</div></Specimen></div>
    <Specimen title="Icon language" description={design.icons.family + " · Theme-controlled navigation glyphs"}><div className="grid grid-cols-3 gap-5 sm:grid-cols-5">{NAV_ICON_SLOTS.map((slot) => { const Icon = resolveNavIcon(slot.id, design.icons); return <div key={slot.id} className="flex flex-col items-center gap-2 text-center"><Icon className="size-5" /><span className="text-xs text-muted-foreground">{slot.label}</span></div>; })}</div></Specimen>
    </> : null}
  </div>;
}

type SampleRun = { id: string; scenario: string; agent: string; result: string };
const SAMPLE_RUNS: SampleRun[] = [ { id: "run_01", scenario: "Find the price", agent: "Claude Code", result: "Passed" }, { id: "run_02", scenario: "Create an account", agent: "Codex", result: "Running" }, { id: "run_03", scenario: "Get support", agent: "Cursor", result: "Needs review" } ];
const columns: TableColumn<SampleRun>[] = [{ key: "scenario", header: "Scenario", sortable: true }, { key: "agent", header: "Agent", sortable: true }, { key: "result", header: "Result", cell: (run) => <AnimatedBadge semantic status={run.result === "Passed" ? "success" : run.result === "Running" ? "loading" : "warning"}>{run.result}</AnimatedBadge> }];
function Patterns() {
  const [prompt, setPrompt] = useState("");
  return <div className="flex flex-col" style={{ gap: "var(--space-section)" }}><SectionIntro title="Parts working together.">Tracks compositions use the same primitives as the product. These examples are isolated from your experiments.</SectionIntro><Specimen title="Experiment configuration" description="A clear title, focused input, and one primary action."><Input label="Scenario" placeholder="Find the product price" value={prompt} onChange={setPrompt} /><Row><AnimatedBadge semantic status="neutral">1 scenario</AnimatedBadge><AnimatedBadge semantic status="neutral">2 agents</AnimatedBadge><span className="ml-auto text-xs text-muted-foreground">$2.00 maximum</span></Row><Row><Button disabled={!prompt.trim()}>Launch experiment</Button><Button variant="ghost">Save draft</Button></Row></Specimen><Specimen title="Run results" description="Sortable columns, selectable rows, and explicit status labels."><div className="min-w-0 overflow-x-auto"><Table data={SAMPLE_RUNS} columns={columns} getRowId={(row) => row.id} selectable height={240} /></div></Specimen><Specimen title="Empty state" description="Explain the next useful action in plain language."><div className="flex flex-col items-center gap-3 py-8 text-center"><h3 className="font-medium">Your first experiment starts here</h3><p className="max-w-sm text-sm text-muted-foreground">Add a scenario, choose your agents, and define what success looks like.</p><Button size="sm">New experiment</Button></div></Specimen></div>;
}
function MotionSpecimens() {
  const [replay, setReplay] = useState(0); const reduce = useReducedMotion();
  return <div className="flex flex-col" style={{ gap: "var(--space-section)" }}><SectionIntro label="04 / Motion" title="Feedback that feels connected.">Press feedback, layout continuity, and overlays share the product’s motion tokens. Reduced-motion preferences are respected by the components.</SectionIntro><p className="text-sm text-muted-foreground">Reduced motion: {reduce ? "on" : "off"}</p><Specimen title="Spring roles" description="Replay to compare how each interaction settles."><Button variant="outline" size="sm" className="w-fit" onClick={() => setReplay(replay + 1)}>Replay motion</Button>{Object.entries({ Press: SPRING_PRESS, Layout: SPRING_LAYOUT, Panel: SPRING_PANEL }).map(([name, spring]) => <div key={name} className="grid items-center gap-4 sm:grid-cols-[5rem_minmax(0,1fr)]"><span className="text-sm">{name}</span><div className="overflow-hidden rounded-[var(--radius-control)] bg-muted p-3"><motion.div key={name + replay} initial={reduce ? false : { x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={reduce ? { duration: 0 } : spring} className="h-5 w-20 rounded-[var(--radius-control)] bg-primary" /></div><code className="font-mono text-xs text-muted-foreground sm:col-start-2">{JSON.stringify(spring)}</code></div>)}</Specimen><Specimen title="Easing & interaction rules" description="One vocabulary for transitions."><code className="break-all font-mono text-sm">cubic-bezier({EASE_OUT.join(", ")})</code><ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground"><li>Use press feedback for actions and layout springs for related changes.</li><li>Keep labels stable and preserve keyboard focus.</li><li>Use a simple fade for compact menus; reserve morphs for focused surfaces.</li><li>Honor reduced motion and accompany status color with text.</li></ul></Specimen></div>;
}

