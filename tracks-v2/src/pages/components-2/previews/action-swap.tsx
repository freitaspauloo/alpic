import { Check, Copy, Moon, Send, Sparkles, Sun } from "lucide-react";
import { useState } from "react";
import { ActionSwapBlurButton } from "@/components/motion/action-swap-blur";
import { ActionSwapCascadeButton, type ActionSwapItem } from "@/components/motion/action-swap-cascade";
import { ActionSwapRollButton } from "@/components/motion/action-swap-roll";
const CTA_ITEMS: ActionSwapItem[] = [
  {
    id: "copy",
    label: "Copy link",
    icon: <Copy className="h-4 w-4" />,
    ariaLabel: "Copy link",
  },
  {
    id: "copied",
    label: "Copied!",
    icon: <Check className="h-4 w-4" />,
    ariaLabel: "Copied",
  },
];

export function ActionSwapCascadePreview() {
  return (
    <div className="flex w-full justify-center">
      <ActionSwapCascadeButton items={CTA_ITEMS} variant="primary" />
    </div>
  );
}

const TEXT_ITEMS: ActionSwapItem[] = [
  { id: "copy", label: "Copy" },
  { id: "copied", label: "Copied" },
];

const ICON_ITEMS: ActionSwapItem[] = [
  {
    id: "light",
    label: "Light",
    icon: <Sun className="h-4 w-4" />,
    ariaLabel: "Use light theme",
  },
  {
    id: "dark",
    label: "Dark",
    icon: <Moon className="h-4 w-4" />,
    ariaLabel: "Use dark theme",
  },
];

const CTA_ITEMS_ActionSwapBlurPreview: ActionSwapItem[] = [
  {
    id: "copy",
    label: "Copy link",
    icon: <Copy className="h-4 w-4" />,
    ariaLabel: "Copy link",
  },
  {
    id: "copied",
    label: "Copied",
    icon: <Check className="h-4 w-4" />,
    ariaLabel: "Copied",
  },
];

export function ActionSwapBlurPreview() {
  const [textValue, setTextValue] = useState(TEXT_ITEMS[0]?.id);
  const [iconValue, setIconValue] = useState(ICON_ITEMS[0]?.id);
  const [ctaValue, setCtaValue] = useState(CTA_ITEMS_ActionSwapBlurPreview[0]?.id);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <ActionSwapBlurButton
        items={TEXT_ITEMS}
        value={textValue}
        onValueChange={setTextValue}
        variant="secondary"
      />
      <ActionSwapBlurButton
        items={ICON_ITEMS}
        value={iconValue}
        onValueChange={setIconValue}
        variant="outline"
        size="icon"
        iconOnly
      />
      <ActionSwapBlurButton
        items={CTA_ITEMS_ActionSwapBlurPreview}
        value={ctaValue}
        onValueChange={setCtaValue}
        variant="primary"
      />
    </div>
  );
}

const TEXT_ITEMS_ActionSwapRollPreview: ActionSwapItem[] = [
  { id: "idle", label: "Save" },
  { id: "done", label: "Saved" },
];

const ICON_ITEMS_ActionSwapRollPreview: ActionSwapItem[] = [
  {
    id: "light",
    label: "Light",
    icon: <Sun className="h-4 w-4" />,
    ariaLabel: "Use light theme",
  },
  {
    id: "dark",
    label: "Dark",
    icon: <Moon className="h-4 w-4" />,
    ariaLabel: "Use dark theme",
  },
];

const CTA_ITEMS_ActionSwapRollPreview: ActionSwapItem[] = [
  {
    id: "send",
    label: "Send invite",
    icon: <Send className="h-4 w-4" />,
    ariaLabel: "Send invite",
  },
  {
    id: "sent",
    label: "Invite sent",
    icon: <Sparkles className="h-4 w-4" />,
    ariaLabel: "Invite sent",
  },
];

export function ActionSwapRollPreview() {
  const [textValue, setTextValue] = useState(TEXT_ITEMS_ActionSwapRollPreview[0]?.id);
  const [iconValue, setIconValue] = useState(ICON_ITEMS_ActionSwapRollPreview[0]?.id);
  const [ctaValue, setCtaValue] = useState(CTA_ITEMS_ActionSwapRollPreview[0]?.id);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <ActionSwapRollButton
        items={TEXT_ITEMS_ActionSwapRollPreview}
        value={textValue}
        onValueChange={setTextValue}
        variant="secondary"
      />
      <ActionSwapRollButton
        items={ICON_ITEMS_ActionSwapRollPreview}
        value={iconValue}
        onValueChange={setIconValue}
        variant="outline"
        size="icon"
        iconOnly
      />
      <ActionSwapRollButton
        items={CTA_ITEMS_ActionSwapRollPreview}
        value={ctaValue}
        onValueChange={setCtaValue}
        variant="primary"
      />
    </div>
  );
}

