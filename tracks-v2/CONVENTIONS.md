# Tracks V2 conventions

Read this before building a page. Tracks V2 is built **only** from the [beUI](https://beui.dev) registry, plus Tailwind utilities that use beUI's semantic tokens.

## Ground rules

- **Never copy code from `../tracks/`.** It is a read-only functional spec. Read its pages to learn *what* a screen does, then build it here from beUI parts.
- **Never restyle `src/components/**`.** Those files are registry output. Compose them, and pass `className` only for layout (width, margin, grid placement).
  - If a component is missing a capability, add a small opt-in prop and note it under "Local registry patches" below.
- **No hand-rolled UI primitives.** No custom buttons, cards, tables, menus, or modals. If beUI has it, use it. If it doesn't, add it with `npx shadcn@latest add @beui/<slug> --yes --overwrite`.
- **No legacy class names** (`.btn`, `.card`, `.table-wrap`, `.menu`, `.org-btn`, …). Use Tailwind utilities only.
- **Use semantic tokens only:**
  - `bg-background`, `bg-card`, `bg-muted`
  - `text-foreground`, `text-muted-foreground`
  - `border-border`
  - `bg-primary`, `text-primary`, `text-primary-foreground`
  - `text-destructive`, `text-success`, `text-warning`, `ring-ring`
  
  Never hard-code hex or oklch values in pages. The brand color is `--primary: #e90060`.
- **Typography:** Geist (`font-sans`, the default) and Geist Mono (`font-mono`) for ids, keys, URLs, and code.
- **Icons:** `lucide-react`, sized with `size-4` (inline) or `size-5` (nav).
- **Theme:** `useStore().theme` and `setTheme`, which proxy next-themes. Dark mode is the `dark` class on `<html>`; use `dark:` variants only when a token doesn't already cover it.

## Project map

```
src/
  main.tsx                 StrictMode + <Providers> + <App>
  App.tsx                  all routes
  app/
    providers.tsx          ThemeProvider(next-themes) > BrowserRouter > StoreProvider > ToastProvider
    shell.tsx              layout route for /:org/* (sidebar, topbar, <Outlet/>)
    nav.ts                 NAV_TREE, NAV_PATHS, icons, activeNavId(), breadcrumbs()
    page-layout.tsx        Page, PageHeader, PageSection
    toast.tsx              ToastProvider, useToast()
    router-link.tsx        RouterButtonLink, routerLink()
    menu.tsx               MenuAction, MenuLabel, MenuSeparator (rows inside a MorphPopover)
    not-found.tsx          NotFoundPage
  data/                    types, seed, format helpers, store, hooks (import from "@/data")
  pages/                   one file per area (experiments, runs, library, analytics, account, landing)
  components/motion|agents|charts/   beUI registry output (do not restyle)
  lib/                     beUI shared utils + hooks (cn, ease, focus helpers…)
  styles/globals.css       Tailwind v4 + beUI theme tokens (+ Geist, brand primary)
```

Routes live in `src/App.tsx`. Every org page renders inside `Shell`, which supplies the sidebar, topbar, and breadcrumb, so a page renders only its own content.

- **Breadcrumb:** labels come from `breadcrumbs()` in `src/app/nav.ts`. Extend it there when you add a route with a record name.
- **Sidebar highlighting:** comes from `activeNavId()`.

## Page layout

Every page starts with `Page`:

```tsx
import { Page, PageSection } from "@/app/page-layout";
import { Button } from "@/components/motion/button/base";
import { Plus } from "lucide-react";

export function Repositories() {
  return (
    <Page
      title="Repositories"
      description="Code your agents can check out and work in."
      actions={<Button size="sm"><Plus className="size-4" /> Add repository</Button>}
      // width="narrow" (max-w-3xl) for forms/settings, "wide" (max-w-7xl) for dense tables; default max-w-6xl
    >
      <PageSection title="Connected" description="Optional helper text" actions={/* small buttons */ null}>
        {/* table / cards */}
      </PageSection>
    </Page>
  );
}
```

- `Page` handles padding (`px-4 sm:px-6 lg:px-8`, `py-8`), centering, and an 8-unit vertical gap between header and sections.
- `PageHeader` is exported separately for full-screen pages that don't use `Page`.
- **Section spacing:** `gap-8` between sections (built into `Page`), `gap-4` inside a section, `gap-2` between buttons.
- **Grids of cards:** `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`.
- **Empty states:** a `Card variant="muted"` holding one sentence and one primary action. Don't invent illustrations.

## Data: reading and writing

Everything comes from `@/data`:

```tsx
import { useOrgData, useStore, money, passRate } from "@/data";

const { org, orgId, experiments, runs, repositories, skills, mcpServers, tools,
        apiKeys, members, transactions, executions, sources, traffic } = useOrgData(); // already filtered to the URL org
const { launch, createRun, addRepository } = useStore();                          // actions
```

- **Reads:** use `useOrgData()` for org-scoped collections. `useStore()` exposes the full state (`you`, `organizations`, `invitations`, `theme`, and every collection unfiltered).
  - Other hooks: `useOrgId()`, `useCurrentOrg()`, `usePendingInvitations()`.
- **Writes:** call the actions on `useStore()`. They are stable references, so they're safe in deps arrays. State persists to `sessionStorage` (`tracks-v2:state:v1`); `resetDemo()` restores the seed.
- **Notices:** most actions set `notice` themselves, and `ToastProvider` turns it into a success toast automatically. **Don't** also toast on success.
- **Fallible actions** return `Result<T>`. Always branch on `ok`:

```tsx
const result = launch(experiment.id);
if (!result.ok) {
  toast({ title: "Couldn't launch", description: result.error, status: "error" });
  return;
}
navigate(`/${orgId}/experiments/${experiment.id}?execution=${result.executionId}`);
```

### Store API (`useStore()`)

| Area | Actions |
| --- | --- |
| App | `setTheme(theme)`, `setNotice(text \| null)`, `resetDemo()` |
| Orgs | `renameOrg(orgId, name)`, `createOrg(name) → orgId`, `addFunds(orgId, cents)`, `acceptInvitation(id) → Result<{orgId}>`, `declineInvitation(id)` |
| Experiments | `createExperiment(orgId, name, scenarios) → id`, `updateExperiment(experiment)` (bumps version), `removeExperiment(id)`, `duplicateExperiment(id) → id \| null`, `launch(id) → Result<{executionId}>` |
| Runs | `createRun(NewRunInput) → Result<{runId}>` |
| Account | `createKey(orgId, name) → secret`, `revokeKey(id)`, `inviteMember(orgId, email)`, `removeMember(id) → Result` |
| Library | `addRepository(orgId, {name,url,ref})`, `removeRepository(id)`, `addSkill(orgId, {name,description})`, `removeSkill(id)`, `addMcp(orgId, {name,url,auth})`, `toggleMcp(id)`, `removeMcp(id)`, `addTool(orgId, {name,script})`, `removeTool(id)` |
| Analytics | `connectSource(orgId, provider, target)`, `disconnectSource(orgId, provider)` |

- **Format helpers:** `money(cents)`, `percent(v)`, `passRate(runs)`, `initial(name)`, `slugify`, `newId(prefix)`, `RUN_STATUSES`.
- **Seed constants:** `TODAY`, `DEFAULT_AGENT`, `AGENT_PRESETS`, `SCENARIO_STARTERS`.

## Toasts

```tsx
import { useToast } from "@/app/toast";

const { toast, update, dismiss } = useToast();
const id = toast({ title: "Copied", description: "API key copied to clipboard.", status: "success" });
// status: "neutral" | "info" | "loading" | "success" | "error"; optional action: { label, onClick }, duration (ms)
update(id, { title: "Done", status: "success" }); // e.g. loading → success
```

The stack is mounted once, bottom-right. Never render another `AnimatedToastStack`.

## Navigation and links

- **Link styled as a button:** `RouterButtonLink` from `@/app/router-link`, as `<RouterButtonLink to="/acme/runs/new" variant="primary" size="sm">New run</RouterButtonLink>`.
- **Breadcrumb links:** `<BreadcrumbLink render={routerLink(to)}>`.
- **Plain inline links:** `<Link>` from react-router with `className="text-primary underline-offset-4 hover:underline"`.
- **Imperative navigation:** `useNavigate()`.
- **Mobile sidebar:** closes itself on navigation.

## Modals (CenterMorphModal)

Use this for every create, edit, or confirm dialog. Control it from the page, reset local state when it opens, validate inline with `Input`'s `error`, and close it after the store action. The reference implementation is `CreateOrgModal` in `src/app/shell.tsx`:

```tsx
import { CenterMorphModal, CenterMorphModalClose, CenterMorphModalContent } from "@/components/motion/center-morph-modal";

<CenterMorphModal open={open} onOpenChange={setOpen}>
  <CenterMorphModalContent ariaLabel="Add repository" className="max-w-md">
    <form onSubmit={submit} className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1 pr-8">
        <h2 className="text-lg font-semibold text-foreground">Add repository</h2>
        <p className="text-sm text-muted-foreground">One sentence of context.</p>
      </div>
      <Input label="URL" value={url} onChange={setUrl} error={error ?? undefined} autoFocus />
      <div className="flex justify-end gap-2">
        <CenterMorphModalClose><Button variant="ghost" size="sm">Cancel</Button></CenterMorphModalClose>
        <Button type="submit" size="sm">Add</Button>
      </div>
    </form>
  </CenterMorphModalContent>
</CenterMorphModal>
```

- **Destructive confirms** use the same shell with `<Button variant="primary">` labeled with the verb ("Revoke key"). Long forms belong on a page (e.g. `experiments/:id/edit`), not in a modal.
- **Side panels** (run details, request inspector): use `Drawer` (`open`, `onOpenChange`, `side`, `ariaLabel`, `className`).

## Menus

| Need | Use |
| --- | --- |
| Row/overflow actions behind a button | `MorphPopover` + `MorphPopoverTrigger` (single child button) + `MorphPopoverContent side align className="w-56 p-1.5"`, rows = `MenuAction` / `MenuLabel` / `MenuSeparator` from `@/app/menu` |
| Right-click menu on a surface | `ContextMenu` + `ContextMenuTrigger` + `ContextMenuContent` + `ContextMenuItem onSelect tone="destructive"` |
| Global search / jump-to | `CommandPalette items={[{id,label,group,hint,icon,onSelect}]}` (⌘/Ctrl+K) |
| Small info bubble on hover | `Tooltip content="…"` around the trigger element |

`MenuAction` takes these props: `icon`, `onSelect`, `trailing`, and `active`.

## Tables

Use `Table` from `@/components/motion/table` for every tabular list (experiments, runs, keys, members, transactions, requests).

```tsx
import { Table, type TableColumn } from "@/components/motion/table";

const columns: TableColumn<Run>[] = [
  { key: "scenario", header: "Scenario", sortable: true, cell: (r) => <span className="font-medium">{r.scenario}</span> },
  { key: "status", header: "Status", width: "120px", cell: (r) => <AnimatedBadge status={runBadge(r.status)} size="sm">{r.status}</AnimatedBadge> },
  { key: "cost", header: "Cost", align: "right", width: "100px", sortValue: (r) => r.cost, cell: (r) => money(r.cost) },
];

<Table data={runs} columns={columns} getRowId={(r) => r.id} defaultSort={{ key: "scenario", direction: "asc" }}
       emptyState={<p className="py-10 text-center text-sm text-muted-foreground">No runs yet.</p>} />
```

- **Always** pass `getRowId`.
- **Row click to open:** put a `<Link>` in the primary cell. Don't make the whole row a handler.
- **Optional features:**
  - `selectable` + `onSelectionChange` for bulk actions.
  - `onDeleteRow` enables the row menu's Delete.
  - `rowHeight` + `height` virtualize long lists; pair with `onEndReached` + `loading` for paging.
- **Pagination:** use `Pagination totalPages page onPageChange` for page-based lists. `getHref` + `renderLink` make the page shareable.
- **Status badges:** `AnimatedBadge status` maps run states as follows:

| Run state | `status` |
| --- | --- |
| passed | `success` |
| failed | `danger` |
| running or queued | `loading` |
| blocked | `warning` |
| other | `neutral` |

## Charts

Series colors must be CSS variables: `var(--primary)`, `var(--success)`, `var(--warning)`, `var(--destructive)`, and `var(--muted-foreground)`.

| Chart | Usage |
| --- | --- |
| Line / area over time | `<LineChart series={[{id,name,color,values}]} categories={labels} variant="area" label="Requests, last 24h" formatValue={…} />` from `@/components/charts/line-chart` |
| Bars (grouped / stacked / horizontal) | `<BarChart series categories layout="stacked" orientation="vertical" label="…" />` from `@/components/charts/bar-chart` |
| Share of a whole | `<DonutChart segments={[{id,name,color,value}]} label="…" />` from `@/components/charts/donut-chart` (compose `DonutChartPlot`, `DonutChartCenter`, `DonutChartLegend` for custom layouts) |
| Inline trend in a stat card / table cell | `<Sparkline data={values} label="Pass rate, last 10 runs" variant="area" height={32} showDelta />` from `@/components/charts/sparkline` |

- **Rendering:** with no `children`, a chart renders complete (plot, tooltip, and legend).
- **Loading:** `status="loading"` on LineChart shows a placeholder. Keep the chart mounted and flip to `"ready"`.
- **Stat cards:** `Card` > `CardHeader` (`CardDescription` label, `CardTitle` value via `NumberTicker`/`AnimatedNumber`) > `CardContent` (`Sparkline`).

## Forms

Lay forms out as `flex flex-col gap-5` with labels on the controls (beUI renders them). Validate on submit, showing errors inline.

| Control | Usage |
| --- | --- |
| Text | `<Input label value onChange={(v) => …} error="msg" leftIcon={<Search className="size-4"/>} placeholder />`. `onChange` gets the **string**, not an event. `reserveErrorLine` avoids layout shift |
| Multiline (prompts, scripts) | No beUI textarea is installed. Use `<textarea className="min-h-32 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />`, or add one from beUI if it appears in the registry |
| Select (short list) | `<Select value onValueChange><SelectTrigger><SelectValue placeholder="…"/></SelectTrigger><SelectContent><SelectItem value="a">A</SelectItem></SelectContent></Select>` from `@/components/motion/select`. `MorphSelect*` (`select-morph`) is the same API with a trigger-morph animation, for toolbars |
| Searchable select | `Combobox value onValueChange` > `ComboboxTrigger` (`ComboboxInput` or `ComboboxValue`) > `ComboboxContent` > `ComboboxList` > `ComboboxItem value keywords` / `ComboboxEmpty` |
| Checkbox | `<Checkbox checked onCheckedChange label description />` |
| Toggle | `<Switch checked onCheckedChange label />` (MCP enable, settings) |
| One of N | `<RadioGroup value onValueChange><RadioGroupItem value label description/></RadioGroup>`. For selectable cards, wrap items in `Card interactive selected` and spread `CARD_TARGET_CLASS` |
| Section switcher | `<Tabs defaultValue variant="pill"\|"underline"\|"segment"><TabsList><TabsTrigger value icon>…</TabsTrigger></TabsList><TabsContent value>…</TabsContent></Tabs>` |
| Submit with async feedback | `<StatefulButton state={"idle"\|"loading"\|"success"\|"error"} loadingText successText>Save</StatefulButton>` |
| Show/hide advanced fields | `Collapsible` > `CollapsibleTrigger` (+ `CollapsibleIndicator`) > `CollapsibleContent` |
| Inline status message | `<Alert variant="info"\|"success"\|"warning"\|"destructive"><AlertIcon/><AlertContent><AlertTitle/><AlertDescription/></AlertContent></Alert>` |

## Component catalogue

These come from the beUI registry. The import path is `@/components/...` unless noted.

### Layout and surfaces

| Component | Import | Usage |
| --- | --- | --- |
| AnimatedSidebar* | `motion/animated-sidebar` | App shell only (already wired in `shell.tsx`). `useAnimatedSidebar()` gives `{open, setOpen, isMobile, toggleSidebar}` |
| AISidebar | `agents/ai-sidebar` | Resource tree. The shell uses it with `editable={false}` for navigation |
| Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter, CARD_TARGET_CLASS | `motion/card` | Content blocks. `variant="outlined"\|"muted"`, `size="default"\|"compact"`, `interactive`, `selected` |
| CenterMorphModal, …Trigger, …Content, …Close | `motion/center-morph-modal` | Dialogs (see Modals) |
| Drawer | `motion/drawer` | Side panel: `open`, `onOpenChange`, `side`, `ariaLabel` |
| Collapsible, …Trigger, …Content, …Indicator | `motion/collapsible` | Disclosure sections |
| Tabs, TabsList, TabsTrigger, TabsContent | `motion/tabs` | Sub-views on a page |
| SharedLayoutBg | `motion/shared-layout-bg` | Sliding hover/active background shared across a row of items |

### Actions

| Component | Import | Usage |
| --- | --- | --- |
| Button, ButtonLink | `motion/button/base` | `variant="primary"\|"secondary"\|"ghost"\|"outline"`, `size="sm"\|"md"\|"lg"\|"icon"`. For in-app links use `RouterButtonLink` (`@/app/router-link`) |
| StatefulButton | `motion/button/stateful` | Button with idle, loading, success, and error states |
| ActionSwapButton | `motion/action-swap` | One button that cycles labels/icons, e.g. Copy → Copied: `items={[{id,label,icon}]}` with `value` and `onValueChange` |
| ThemeToggle | `motion/theme-toggle` | `variant="circle"`. Already in the user menu |

### Inputs

| Component | Import | Usage |
| --- | --- | --- |
| Input | `motion/input` | Text field (see Forms) |
| Select, SelectTrigger, SelectValue, SelectContent, SelectItem | `motion/select` | Dropdown select |
| MorphSelect, MorphSelectTrigger, MorphSelectValue, MorphSelectContent, MorphSelectItem | `motion/select-morph` | Select with a morphing trigger |
| Combobox (+ Trigger, Input, Value, Content, List, Group, Label, Item, Empty, Separator) | `motion/combobox` | Searchable select |
| Checkbox | `motion/checkbox` | Boolean with label |
| Switch | `motion/switch` | On/off setting |
| RadioGroup, RadioGroupItem | `motion/radio` | Single choice |

### Overlays and menus

| Component | Import | Usage |
| --- | --- | --- |
| MorphPopover, MorphPopoverTrigger, MorphPopoverContent | `motion/popover-morph` | Menus and pickers. Used by the org switcher and user menu |
| Popover, PopoverTrigger, PopoverContent | `motion/popover` | "Gooey" popover. `trigger="click"\|"hover"`, `side`, `align`. Use for playful inline info, not menus |
| Tooltip (+ TooltipProvider, TooltipTrigger, TooltipContent) | `motion/tooltip` | `<Tooltip content="Copy" side="top"><Button size="icon">…</Button></Tooltip>` |
| ContextMenu (+ Trigger, Content, Item, CheckboxItem, RadioGroup, RadioItem, Label, Separator, Shortcut) | `motion/context-menu` | Right-click menus |
| CommandPalette | `motion/command-palette` | ⌘K palette: `items`, `open`, `onOpenChange` |
| MenuAction, MenuLabel, MenuSeparator | `@/app/menu` (app) | Rows inside `MorphPopoverContent` |

### Data display

| Component | Import | Usage |
| --- | --- | --- |
| Table | `motion/table` | Sortable, selectable, virtualizable table (see Tables) |
| Pagination | `motion/pagination` | `totalPages`, `page`, `onPageChange` |
| AnimatedBadge | `motion/animated-badge` | Status pill: `status="neutral"\|"info"\|"success"\|"warning"\|"danger"\|"loading"`, `size="sm"\|"md"`, `pulse` |
| Avatar, AvatarGroup | `motion/avatar-group` | `<Avatar name size="sm"\|"md"\|"lg" src? />`, `<AvatarGroup members={[{id,name}]} max={4} />` |
| Breadcrumb (+ List, Item, Link, Page, Separator) | `motion/breadcrumb` | Already rendered by the topbar |
| CodeBlock | `agents/code-block` | `<CodeBlock code language="bash"\|"diff"\|"json"\|"text"\|"tsx"\|"typescript" filename copyable showLineNumbers />` for commands, scripts, and run logs |
| AgentCode | `agents/agent-code` | Low-level highlighted code renderer used by CodeBlock |
| Alert (+ Icon, Content, Title, Description, Action, Close) | `motion/alert` | Inline callouts, e.g. a zero balance or blocked org |
| LineChart, BarChart, DonutChart, Sparkline | `charts/*` | See Charts |

### Numbers, text, and feedback

| Component | Import | Usage |
| --- | --- | --- |
| NumberTicker | `motion/number-ticker` | Rolling digits for KPIs: `value`, `prefix="$"`, `decimals={2}`, `locale` |
| AnimatedNumber | `motion/animated-number` | Tweened number: `value`, `format={(n) => money(n)}` |
| DigitSwap | `motion/digit-swap` | Per-glyph swap for short changing strings (counters, masked keys) |
| TextShimmer | `motion/text-shimmer` | `<TextShimmer>Running…</TextShimmer>` for in-progress labels |
| TextReveal | `motion/text-reveal` | Landing-page headline reveal: `text`, `as="h1"`, `split` |
| Loader | `motion/loader` | `<Loader variant="spinner"\|"dots"\|"ascii"… size={16} label="Loading runs" />` |
| AnimatedToastStack | `motion/animated-toast-stack` | Mounted once by `ToastProvider`; call `useToast()` |
| NotFoundStacked | `motion/not-found/stacked` | Wrapped by `NotFoundPage` (`@/app/not-found`) |

## Local registry patches

Keep this list current. Re-adding a component with `--overwrite` drops these patches, so reapply them afterwards.

1. **`agents/ai-sidebar.tsx`:** adds the `editable?: boolean` prop (default `true`). `false` removes the row menu, drag, rename, and keyboard moves, for the navigation tree.
2. **`motion/text-shimmer.tsx`:** the import was fixed to `@/lib/text-shimmer`, because the CLI rewrote it into a self-import.
3. **`styles/globals.css`:** `html { --sidebar-width-mobile: 18rem }`, because the mobile sidebar sheet is portaled outside the provider that defines it.
4. **`agents/code-block.tsx`:** the `<pre>` gets `min-w-max` only when `wrap` is false. Before this, `min-w-max` always applied, so `wrap` had no effect.
5. **`motion/button/stateful.tsx`:** a `ResizeObserver` re-measures the label. Before this, a label measured before Geist loaded stayed clipped (e.g. "Start rur").

## Commands

From the repo root: `npm run tracks:v2` (dev server on http://127.0.0.1:4175).

Inside `tracks-v2/`:

- `npm run dev`
- `npm run build` (runs `tsc --noEmit` then `vite build`)
- `npm run typecheck`
- `npx shadcn@latest add @beui/<slug> --yes` (add a registry component; the index is at `https://beui.dev/r/registry.json`)
