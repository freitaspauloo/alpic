import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, MoreHorizontal, type LucideIcon } from "lucide-react";
import { MenuAction } from "@/app/menu";
import { useToast } from "@/app/toast";
import { ActionSwapButton, type ActionSwapButtonSize, type ActionSwapButtonVariant } from "@/components/motion/action-swap";
import { Button } from "@/components/motion/button/base";
import { Card, CardContent } from "@/components/motion/card";
import {
  CenterMorphModal,
  CenterMorphModalClose,
  CenterMorphModalContent,
} from "@/components/motion/center-morph-modal";
import { MorphPopover, MorphPopoverContent, MorphPopoverTrigger } from "@/components/motion/popover-morph";
import { ThemeToggle } from "@/components/motion/theme-toggle";
import { cn } from "@/lib/utils";

export const ROW_HEIGHT = 56;

/** Table viewport that fits `count` rows plus the header, scrolling past `max` rows. */
export function tableHeight(count: number, max = 8) {
  return (Math.min(Math.max(count, 1), max) + 1) * ROW_HEIGHT + 2;
}

/**
 * Re-renders whenever web fonts finish loading. StatefulButton measures its
 * label on render, so one shown on first paint is sized with the fallback font.
 */
export function useFontsReady() {
  const [, setLoads] = useState(0);
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts) return;
    const bump = () => setLoads((count) => count + 1);
    fonts.addEventListener("loadingdone", bump);
    return () => fonts.removeEventListener("loadingdone", bump);
  }, []);
}

/** Sort key for the seed's "Oct 28, 2026" dates. */
export function dateValue(date: string) {
  const time = Date.parse(date);
  return Number.isNaN(time) ? 0 : time;
}

/**
 * A modal's subject kept apart from its open state, so the content doesn't
 * blank out while the panel folds shut.
 */
export function useModalTarget<T>() {
  const [target, setTarget] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  const show = useCallback((next: T) => {
    setTarget(next);
    setOpen(true);
  }, []);
  return { target, open, setOpen, show };
}

export function ModalHeading({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 pr-8">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel={title} className="max-w-md">
        <div className="flex flex-col gap-5 p-6">
          <ModalHeading title={title} description={description} />
          {children}
          <div className="flex justify-end gap-2">
            <CenterMorphModalClose>
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
            </CenterMorphModalClose>
            <Button size="sm" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card variant="muted">
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{children}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

export type RowMenuItem = { label: string; icon: LucideIcon; onSelect: () => void };

/** Overflow actions for one table row. */
export function RowMenu({ label, items }: { label: string; items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <MorphPopover open={open} onOpenChange={setOpen}>
      <MorphPopoverTrigger>
        <Button variant="ghost" size="icon" aria-label={label}>
          <MoreHorizontal aria-hidden="true" className="size-4" />
        </Button>
      </MorphPopoverTrigger>
      <MorphPopoverContent side="bottom" align="end" radius={12} className="w-48 p-1.5">
        {items.map((item) => (
          <MenuAction
            key={item.label}
            icon={item.icon}
            onSelect={() => {
              setOpen(false);
              item.onSelect();
            }}
          >
            {item.label}
          </MenuAction>
        ))}
      </MorphPopoverContent>
    </MorphPopover>
  );
}

/** Copies `value` and swaps to a check for a moment. */
export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  variant = "secondary",
  size = "sm",
  className,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  variant?: ActionSwapButtonVariant;
  size?: ActionSwapButtonSize;
  className?: string;
}) {
  const { toast } = useToast();
  const [state, setState] = useState("copy");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      toast({ title: "Couldn't copy", description: "Your browser blocked clipboard access.", status: "error" });
      return;
    }
    setState("copied");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("copy"), 1600);
  };

  return (
    <ActionSwapButton
      items={[
        { id: "copy", label, icon: <Copy aria-hidden="true" className="size-4" />, ariaLabel: label },
        { id: "copied", label: copiedLabel, icon: <Check aria-hidden="true" className="size-4" />, ariaLabel: copiedLabel },
      ]}
      value={state}
      cycle={false}
      variant={variant}
      size={size}
      className={className}
      onClick={() => void copy()}
    />
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-xl text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-7 place-items-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground"
      >
        T
      </span>
      Tracks
    </Link>
  );
}

/** Top bar for the full-screen pages outside the shell. */
export function StandaloneHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <BrandMark />
      <div className="flex items-center gap-2">
        <ThemeToggle
          variant="circle"
          className="size-9 rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          iconClassName="size-4"
        />
        {children}
      </div>
    </header>
  );
}
