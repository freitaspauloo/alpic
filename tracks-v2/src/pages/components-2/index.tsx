import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Page } from "@/app/page-layout";
import { Button, ButtonLink } from "@/components/motion/button/base";
import { CommandSearchField } from "@/components/motion/command-search-field";
import { Drawer } from "@/components/motion/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { ThemeModeSwitch } from "@/components/motion/theme-mode-switch";
import { DesignSystemWorkspace, useDesignKeyboardShortcuts } from "@/design/playground";
import * as modActionSwap from "./previews/action-swap";
import * as modAdaptiveStepper from "./previews/adaptive-stepper";
import * as modAlert from "./previews/alert";
import * as modAnimatedBadge from "./previews/animated-badge";
import * as modNumberAnimation from "./previews/number-animation";
import * as modAnimatedSidebar from "./previews/animated-sidebar";
import * as modAnimatedToastStack from "./previews/animated-toast-stack";
import * as modAvatarGroup from "./previews/avatar-group";
import * as modBreadcrumb from "./previews/breadcrumb";
import * as modButton from "./previews/button";
import * as modCard from "./previews/card";
import * as modCenterMorphModal from "./previews/center-morph-modal";
import * as modCheckbox from "./previews/checkbox";
import * as modCollapsible from "./previews/collapsible";
import * as modColorPicker from "./previews/color-picker";
import * as modCombobox from "./previews/combobox";
import * as modCommandPalette from "./previews/command-palette";
import * as modContextMenu from "./previews/context-menu";
import * as modDrawer from "./previews/drawer";
import * as modExpandableTabs from "./previews/expandable-tabs";
import * as modExpandingArrowButton from "./previews/expanding-arrow-button";
import * as modInput from "./previews/input";
import * as modLoader from "./previews/loader";
import * as modNotFound from "./previews/not-found";
import * as modPagination from "./previews/pagination";
import * as modPopover from "./previews/popover";
import * as modRadioGroup from "./previews/radio-group";
import * as modRangeSlider from "./previews/range-slider";
import * as modSelect from "./previews/select";
import * as modSharedLayoutBackground from "./previews/shared-layout-background";
import * as modSwitch from "./previews/switch";
import * as modTable from "./previews/table";
import * as modTabs from "./previews/tabs";
import * as modTextAnimation from "./previews/text-animation";
import * as modThemeToggle from "./previews/theme-toggle";
import * as modTooltip from "./previews/tooltip";

const LIBRARY = [
  { title: "Action Swap", category: "Motion", previews: [modActionSwap.ActionSwapCascadePreview, modActionSwap.ActionSwapBlurPreview, modActionSwap.ActionSwapRollPreview] },
  { title: "Adaptive Stepper", category: "Controls", previews: [modAdaptiveStepper.AdaptiveStepperPreview] },
  { title: "Alert", category: "Feedback", previews: [modAlert.AlertPreview] },
  { title: "Animated Badge", category: "Feedback", previews: [modAnimatedBadge.AnimatedBadgePreview] },
  { title: "Number", category: "Motion", previews: [modNumberAnimation.DigitSwapPreview, modNumberAnimation.NumberTickerPreview, modNumberAnimation.AnimatedNumberPreview] },
  { title: "Animated Sidebar", category: "Navigation", previews: [modAnimatedSidebar.AnimatedSidebarPreview] },
  { title: "Animated Toast Stack", category: "Feedback", previews: [modAnimatedToastStack.AnimatedToastStackPreview] },
  { title: "Avatar Group", category: "Structure", previews: [modAvatarGroup.AvatarGroupPreview] },
  { title: "Breadcrumb", category: "Navigation", previews: [modBreadcrumb.BreadcrumbPreview] },
  { title: "Button", category: "Controls", previews: [modButton.ButtonMetallicPreview, modButton.ButtonBasePreview, modButton.ButtonStatefulPreview, modButton.ButtonMagneticPreview] },
  { title: "Card", category: "Structure", previews: [modCard.CardPreview] },
  { title: "Center Morph Modal", category: "Overlays", previews: [modCenterMorphModal.CenterMorphModalPreview] },
  { title: "Checkbox", category: "Controls", previews: [modCheckbox.CheckboxPreview, modCheckbox.CheckboxDescriptionPreview] },
  { title: "Collapsible", category: "Structure", previews: [modCollapsible.CollapsiblePreview] },
  { title: "Color Picker", category: "Controls", previews: [modColorPicker.ColorPickerPreview] },
  { title: "Combobox", category: "Controls", previews: [modCombobox.ComboboxPreview] },
  { title: "Command Palette", category: "Overlays", previews: [modCommandPalette.CommandPalettePreview] },
  { title: "Context Menu", category: "Overlays", previews: [modContextMenu.ContextMenuPreview] },
  { title: "Drawer", category: "Overlays", previews: [modDrawer.DrawerPreview] },
  { title: "Expandable Tabs", category: "Navigation", previews: [modExpandableTabs.ExpandableTabsPreview] },
  { title: "Expanding Arrow Button", category: "Controls", previews: [modExpandingArrowButton.ExpandingArrowButtonPreview, modExpandingArrowButton.HoldActionButtonPreview, modExpandingArrowButton.SlideActionButtonPreview] },
  { title: "Input", category: "Controls", previews: [modInput.InputPreview] },
  { title: "Loader", category: "Feedback", previews: [modLoader.LoaderPreview] },
  { title: "Not Found", category: "Feedback", previews: [modNotFound.NotFoundGlitchPreview, modNotFound.NotFoundMagneticPreview, modNotFound.NotFoundSpotlightPreview, modNotFound.NotFoundStackedPreview, modNotFound.NotFoundTerminalPreview] },
  { title: "Pagination", category: "Navigation", previews: [modPagination.PaginationPreview] },
  { title: "Popover", category: "Overlays", previews: [modPopover.PopoverPreview, modPopover.MorphPopoverPreview] },
  { title: "Radio", category: "Controls", previews: [modRadioGroup.RadioPreview, modRadioGroup.RadioDescriptionPreview] },
  { title: "Range Slider", category: "Controls", previews: [modRangeSlider.InlineSliderPreview, modRangeSlider.RangeSliderPreview, modRangeSlider.RangeSliderFluidPreview, modRangeSlider.RangeSliderWavePreview, modRangeSlider.RangeSliderBubblePreview, modRangeSlider.RangeSliderRulerPreview] },
  { title: "Select", category: "Controls", previews: [modSelect.SelectPreview, modSelect.SelectMorphPreview] },
  { title: "Shared Layout", category: "Motion", previews: [modSharedLayoutBackground.SharedLayoutBgPreview] },
  { title: "Switch", category: "Structure", previews: [modSwitch.SwitchPreview] },
  { title: "Table", category: "Structure", previews: [modTable.TablePreview, modTable.TableEditablePreview, modTable.TableAsyncPreview] },
  { title: "Tabs", category: "Navigation", previews: [modTabs.TabsPreview] },
  { title: "Text", category: "Motion", previews: [modTextAnimation.TextScramblePreview, modTextAnimation.ChromaticTextRevealPreview, modTextAnimation.TextRevealPreview, modTextAnimation.TextShimmerPreview, modTextAnimation.TextCascadePreview] },
  { title: "Theme Toggle", category: "Structure", previews: [modThemeToggle.ThemeTogglePreview] },
  { title: "Tooltip", category: "Overlays", previews: [modTooltip.TooltipPreview, modTooltip.TooltipToolbarPreview] },
] as const;

const CATEGORIES = ["Controls", "Navigation", "Overlays", "Feedback", "Motion", "Structure"] as const;

/** Official beUI previews, rendered with the Tracks playground theme. */
export function ComponentsTwo() {
  useDesignKeyboardShortcuts();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Controls");
  const [editor, setEditor] = useState(false);
  const needle = query.trim().toLowerCase();
  const groups = useMemo(() => {
    return CATEGORIES.map((name) => ({
      category: name,
      items: LIBRARY.filter((item) => item.category === name && (!needle || item.title.toLowerCase().includes(needle) || item.previews.some((preview) => preview.name.toLowerCase().includes(needle)))),
    })).filter((group) => group.items.length > 0);
  }, [needle]);
  const active = groups.find((group) => group.category === category) ?? groups[0];

  return (
    <main className="min-h-svh bg-background text-foreground">
      <Page
        title="Components"
        description="Official beUI previews, painted with the Tracks theme."
        width="wide"
        actions={
          <>
            <CommandSearchField
              className="h-9 w-52 flex-none"
              aria-label="Search components"
              placeholder="Search"
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                const next = value.trim().toLowerCase();
                const match = CATEGORIES.find((name) =>
                  LIBRARY.some((item) => item.category === name && (item.title.toLowerCase().includes(next) || item.previews.some((preview) => preview.name.toLowerCase().includes(next)))),
                );
                if (match) setCategory(match);
              }}
            />
            <ThemeModeSwitch />
            <ButtonLink href="/design-system" variant="outline" size="sm" className="h-9 px-3 text-sm">Design system</ButtonLink>
            <Button variant="outline" size="sm" className="h-9 px-3 text-sm" onClick={() => setEditor(true)}>
              <SlidersHorizontal className="size-4" />
              Customize theme
            </Button>
          </>
        }
      >
        {!active ? (
          <p className="text-sm text-muted-foreground">No components match that search.</p>
        ) : (
          <Tabs value={active.category} onValueChange={(value) => setCategory(value as typeof category)} variant="underline">
            <TabsList aria-label="Component categories">
              {groups.map((group) => (
                <TabsTrigger key={group.category} value={group.category}>{group.category}</TabsTrigger>
              ))}
            </TabsList>
            {groups.map((group) => (
              <TabsContent key={group.category} value={group.category}>
                <div className="flex flex-col gap-8">
                  {group.items.map((item) => (
                    <section key={item.title} className="flex flex-col gap-3">
                      <h2 className="text-base font-medium">{item.title}</h2>
                      {item.previews.map((Preview) => (
                        <div key={Preview.name} className="rounded-[var(--radius-lg)] border border-border bg-card p-6">
                          <Preview />
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </Page>
      <Drawer open={editor} onOpenChange={setEditor} side="right" ariaLabel="Customize theme" className="w-[30rem] max-w-[92vw]">
        <DesignSystemWorkspace title="Customize theme" onClose={() => setEditor(false)} className="max-h-none min-h-0 flex-1" />
      </Drawer>
    </main>
  );
}
