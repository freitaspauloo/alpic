import { MorphPopover, MorphPopoverContent, MorphPopoverTrigger } from "@/components/motion/popover-morph";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function ShellMenu({
  open,
  onOpenChange,
  trigger,
  children,
  contentClassName,
  side = "bottom",
  align = "start",
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  side?: "top" | "bottom";
  align?: "start" | "end";
}) {
  return (
    <MorphPopover open={open} onOpenChange={onOpenChange} className="relative flex min-w-0 flex-1">
      <MorphPopoverTrigger>{trigger}</MorphPopoverTrigger>
      <MorphPopoverContent
        side={side}
        align={align}
        sideOffset={6}
        radius={12}
        className={cn("w-[min(100%,20rem)] p-1.5", contentClassName)}
      >
        {children}
      </MorphPopoverContent>
    </MorphPopover>
  );
}

export function ShellMenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{children}</div>;
}

export function ShellMenuItem({
  children,
  onClick,
  className,
  asChild,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  asChild?: boolean;
}) {
  const classes = cn(
    "flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs text-foreground outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
    className,
  );
  if (asChild) {
    return <div className={classes}>{children}</div>;
  }
  return (
    <button type="button" role="menuitem" className={classes} onClick={onClick}>
      {children}
    </button>
  );
}

/** Matches AnimatedSidebarMenuButton surface tokens. */
export const shellMenuTriggerClassName =
  "flex min-h-9 w-full min-w-0 items-center gap-2.5 rounded-xl px-3 text-left text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring";
