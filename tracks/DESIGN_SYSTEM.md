# Tracks design system

beUI is the prime base. Tracks does not invent a parallel visual language. Color, type, radius, motion, and components come from [beui.dev](https://beui.dev), captured from the guides and the live theme on 31 Oct 2026.

Product screens still use Tracks copy and sample data. The chrome around them uses this system.

## Sources

| Guide | URL |
| --- | --- |
| Agent guide | https://beui.dev/docs/ai-agents |
| Motion guides | https://beui.dev/docs/motion-patterns |
| OpenUI | https://beui.dev/docs/openui |
| React Native setup (theme source) | https://beui.dev/docs/native-setup |
| Catalogue | https://beui.dev/llms.txt |
| Registry | https://beui.dev/r |

The published palette in the React Native guide is the default beUI palette (`ui-components/lib/themes.ts`). The website uses that palette. Radius, type, and easing below are what the live site actually computes.

## 1. How we add UI

Never hand-roll a control that already exists in the registry.

1. Search https://beui.dev/llms.txt or https://beui.dev/r.
2. Install from `tracks/`:

```sh
npx shadcn@latest add @beui/<slug> --yes
```

`components.json` already points `@beui` at `https://beui.dev/r/{name}.json`.

3. Write every file the registry returns to its declared path. Helpers such as `@/lib/utils` and `@/lib/ease` ship inside the entry as `type: util`.
4. Install the listed npm dependencies. The usual set is `motion`, `lucide-react`, `clsx`, and `tailwind-merge`.
5. Theme only through the tokens in this document. Components use shadcn semantic classes (`bg-primary`, `text-muted-foreground`, `border-border`). They do not read Tracks-only variables.

Agent skill, if a coding agent needs the live registry:

```sh
npx skills add starc007/ui-components --skill beui
```

MCP server: `https://mcp.beui.dev/mcp`. Tools: `list_components`, `search_components`, `get_component`, `get_install_command`.

Direct endpoints when the CLI is not enough:

| Endpoint | What it returns |
| --- | --- |
| `/llms.txt` | Markdown index |
| `/r` | JSON catalogue |
| `/r/{slug}` | Files, dependencies, source |
| `/r/{slug}.json` | shadcn install item |
| `/r/{slug}/raw` | Plain `.tsx` |
| `/components/{category}/{slug}.md` | Component doc |
| `/registry.json` | shadcn catalogue |

## 2. Color

Semantic tokens only. No one-off hex in components.

Light and dark share one primary. Surface, ink, border, and status colors change with the theme. Native `surface` is web `card`. Native `muted` is web `muted-foreground`.

### Light

| Token | Value | Use |
| --- | --- | --- |
| `background` | `oklch(99% 0 0)` | Page |
| `card`, `popover`, `secondary` | `oklch(97% 0 0)` | Raised surface |
| `foreground` | `oklch(15% 0 0)` | Primary text |
| `muted-foreground` | `oklch(50% 0 0)` | Secondary text |
| `border` | `oklch(15% 0 0 / 0.06)` | Hairline |
| `border-strong`, `ring` | `oklch(15% 0 0 / 0.16)` | Strong edge, focus |
| `primary` | `#0285f7` | Actions |
| `primary-foreground` | `#ffffff` | Text on primary |
| `destructive` | `#dc2626` | Danger |
| `success` | `#059669` | Positive status |
| `warning` | `#d97706` | Caution |

### Dark

| Token | Value |
| --- | --- |
| `background` | `#151515` |
| `card`, `popover`, `secondary`, `muted` | `#1c1c1c` |
| `foreground` | `oklch(96% 0 0)` |
| `muted-foreground` | `oklch(62% 0 0)` |
| `border` | `rgb(255 255 255 / 0.05)` |
| `border-strong`, `ring` | `rgb(255 255 255 / 0.14)` |
| `primary` / `primary-foreground` | `#0285f7` / `#ffffff` |
| `destructive` | `#f87171` |
| `success` | `#34d399` |
| `warning` | `#fbbf24` |

Also set the Tailwind aliases the components already use: `--color-background`, `--color-foreground`, `--color-card`, `--color-muted`, `--color-muted-foreground`, `--color-border`, `--color-primary`, `--color-primary-foreground`, `--color-destructive`, `--color-ring`, `--color-input`, `--color-popover`, `--color-secondary`.

`glass-border` on the live site is foreground at 8% in light and `#ffffff14` in dark. Use it for glass panels (command palette, search), not for ordinary cards.

Map these onto both the shadcn names and any legacy names still read by old CSS (`--bg`, `--fg`, `--card`, `--primary`). New CSS does not add names outside this list.

## 3. Type

| Role | Family |
| --- | --- |
| Sans, UI, display | Geist, then ui-sans-serif, system-ui, sans-serif |
| Mono | Geist Mono, then ui-monospace, monospace |

Weights in use: 400 regular, 500 medium, 600 semibold, 700 bold. UI labels are medium. Do not introduce a second sans.

## 4. Radius and shape

The live site does not scale every corner from one multiplier. The scale is fixed:

| Token | Value |
| --- | --- |
| `--radius-sm` | `0.25rem` |
| `--radius-md` | `0.375rem` |
| `--radius-lg` | `0.5rem` |
| `--radius-xl` | `0.75rem` |
| `--radius-2xl` | `1rem` |
| `--radius-3xl` | `1.5rem` |
| `--radius-4xl` | `2rem` |

Shape rules from the button source:

- Text buttons are pills: `rounded-full`.
- Icon buttons are `rounded-lg` (`h-8 w-8` at the icon size).
- Sizes: `sm` h-8, `md` h-10, `lg` h-12.
- Cards, dialogs, and menus use the radius scale, not a hardcoded `12px`.

Button variants: `primary`, `secondary`, `ghost`, `outline`.

| Variant | Classes |
| --- | --- |
| primary | `bg-primary text-primary-foreground hover:bg-primary/90` |
| secondary | `border border-border bg-card text-foreground` |
| ghost | `text-muted-foreground hover:text-foreground hover:bg-muted/60` |
| outline | `border border-border bg-transparent hover:bg-muted/60` |

Press scale is `0.93` with `SPRING_PRESS`. Hover scale is `1.02`, and only when the device has a real hover and reduced motion is off.

## 5. Motion

Ask four questions before animating:

1. **Frequency.** Something used all day stays nearly instant. Save expressive motion for rare moments.
2. **Purpose.** Motion explains space, confirms input, shows state, or softens a change. If it has no purpose, remove it.
3. **Physics.** Ease-out for entrances. Ease-in-out for things already on screen. Linear for progress. Springs for gestures.
4. **Fallback.** Reduced motion keeps opacity and color. It removes travel, scale, parallax, and spring overshoot.

### Tokens

These match `src/lib/ease.ts` and the registry copy of `lib/ease.ts`. CSS curves on the live site are the same.

| Token | Value | Job |
| --- | --- | --- |
| `EASE_OUT` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances and exits. Fast start, quiet settle. |
| `EASE_IN_OUT` | `cubic-bezier(0.77, 0, 0.175, 1)` | Movement of something already visible. |
| `EASE_DRAWER` | `cubic-bezier(0.32, 0.72, 0, 1)` | Large panels. |
| `SPRING_PRESS` | stiffness 500, damping 30, mass 0.6 | Buttons and other presses. |
| `SPRING_SWAP` | stiffness 460, damping 30, mass 0.55 | Label or icon swapping inside a control. |
| `SPRING_PANEL` | stiffness 420, damping 40, mass 0.5 | Modals and sheets. |
| `SPRING_LAYOUT` | stiffness 360, damping 32, mass 0.6 | Shared pills, indicators, morphing panels. |
| `SPRING_MOUSE` | stiffness 200, damping 15, mass 0.3 | Magnetic and tilt follow. |
| `SPRING_GLIDE` | stiffness 700, damping 50, mass 0.5 | Slider fills. Critically damped, no rebound. |

### Timing

| Interaction | Range | Feel |
| --- | --- | --- |
| Press | 100–160ms | Immediate |
| Tooltip, popover | 125–200ms | Quick, from the trigger |
| Dropdown, select | 150–250ms | No waiting |
| Modal, drawer | 200–500ms | Enough time to show where it came from |
| Interface default | under 300ms | — |
| Marketing demo | longer is allowed | Clarity over speed |

### Recipes

- **Press.** Acknowledge the pointer before the action finishes. Small scale, `SPRING_PRESS`.
- **Icon.** The icon imitates the action (a bell swings from its hinge). Hover motion only on `(hover: hover) and (pointer: fine)`.
- **Reveal.** One surface, a short lift, restrained blur. It finishes before the user has to read it.
- **Layout continuity.** The same surface changes size. The shape moves first, then the label appears. This is the sidebar highlight and the design widget.
- **Swap.** Old content leaves faster than new content arrives. Travel is a few pixels.

Reduced motion is a designed state, not `transition: none` on everything.

## 6. Catalogue

Install by slug. Docs live at `https://beui.dev/components/{category}/{slug}`.

### Agents (18)

Voice Orb, Message Bubble, Message, Message Scroller, Prompt Input, Todo List, Code Block, Approval Card, File Diff, Tool Result, Streaming Response, Image Generation, Tool Approval, Citations, Agent Activity, Agent Loading States, AI Sidebar, Chat App.

Tracks already uses AI Sidebar for the resource tree.

### Motion (56)

Timeline, Animated Alert, Animated Collapsible, Aspect Ratio, Arc Picker, Sortable List, Image Viewer, Date Range Picker, Card, Color Picker, Animated Color Selector, Animated Pagination, Animated Avatar Group, Animated Breadcrumb, Tilt Card, Button, Animated CTA Buttons, Expandable Control, Adaptive Stepper, Marquee, Tabs, Switch, Input, Select, Combobox, Multi Select, Checkbox, Radio Group, Bottom Sheet, Pull to Refresh, Shared Layout Background, Bounce Sidebar, Animated Sidebar, File Tree, Preview Rail, Dock, Tooltip, Animated Context Menu, Popover, Morphing Modal, Center Morph Modal, Text Animation, Number Animation, Animated Badge, Action Swap, Animated Toast Stack, Theme Toggle, Bouncy Accordion, Drawer, Scroll Animation, Range Slider, Wheel Picker, Table, Shader Background, Cylinder Carousel, Loader.

Tracks already uses Animated Sidebar, Popover (morph), Table, and the shared ease tokens.

### Blocks (24)

Infinite Masonry, Notification Stack, Project Folder, Card Folder, Fixtures, Availability Scheduler, Multi-chain Swap, Dynamic Island, Command Palette, Morphing Search, Expandable Action Bar, Overflow Actions, Expandable Tabs, Morphing Tabs, Swipeable List, File Upload, Prediction Market, Wallet Card, OTP Input, Sign Up Form, Card Dealer, Bloom Menu, Feedback Widget, 404 / Not Found.

### Charts (17)

Line, Bar, Sparkline, Sankey, Treemap, Candlestick, Donut, Volume Profile, Status Bar, Composition, Funnel, Liquidity Heatmap, Bump, Order Book, Heat Calendar, Returns Calendar, Price Target Fan.

## 7. What Tracks still has to change

The app still carries an older Alpic skin. Matching this base means:

1. Replace the pink primary (`#e90060`) and teal accent with the palette in section 2, in both light and dark.
2. Point `--font` and the Tailwind sans/mono stacks at Geist and Geist Mono. Drop Inter.
3. Replace the single `--radius` multiplier with the fixed scale in section 4. Text buttons become pills.
4. Add `success`, `warning`, `border-strong`, and `glass-border`. Stop introducing `--cta` and other names outside section 2.
5. Keep using `@/lib/ease.ts`. New motion follows section 5, including reduced motion and the hover-capable check.
6. New controls come from the catalogue. Do not extend `.btn`, `.card`, `.table-wrap`, `.org-btn`, or `.menu`.
7. Retarget the floating design widget so its presets, radius stops, and color list are this system, not the old pink theme.

## 8. Native and OpenUI

Tracks is a web app. These two guides are part of the system, and they stay out of the web UI until we need them.

**React Native.** One-time setup is Reanimated 4, Gesture Handler, and Uniwind. Theme file is `src/styles/theme.css` using the palette in section 2. Add a component with `npx beui-native add <slug>`. Every native component honors Reduce Motion and accepts `disableAnimation`. Catalogue: https://beui.dev/native/r.

**OpenUI.** Only if a model should render live UI. Register beUI components with `defineComponent`, assemble them with `createLibrary`, generate the spec, and render with `<Renderer>`. Generated UI is limited to the components we register, and it inherits these tokens.
