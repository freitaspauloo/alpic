import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Rows for menus inside a beUI MorphPopoverContent. beUI ships no standalone menu
 * primitive for popovers, so these reuse the exact row styles of AI Sidebar's own
 * row menu (ResourceMenuAction) to stay visually identical.
 */

export function MenuAction({
  icon: Icon,
  onSelect,
  trailing,
  active,
  children,
}: {
  icon?: LucideIcon;
  onSelect: () => void;
  trailing?: ReactNode;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active || undefined}
      className={cn(
        "flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs text-foreground outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
        active && "bg-muted",
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" /> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing ? <span className="flex shrink-0 items-center text-muted-foreground">{trailing}</span> : null}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </div>
  );
}

export function MenuSeparator() {
  return <div aria-hidden="true" className="my-1 h-px bg-border" />;
}
