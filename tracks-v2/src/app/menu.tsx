import { Check, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Same row and surface as the product Select: a background panel, muted fill
 * on the current row, and a check. No separate outline.
 */
export const menuSurface = "border border-border bg-background shadow-lg";

const rowClass =
  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm outline-none transition-colors";

export function MenuAction({
  icon: Icon,
  onSelect,
  trailing,
  active,
  check = true,
  children,
}: {
  icon?: LucideIcon;
  onSelect: () => void;
  trailing?: ReactNode;
  active?: boolean;
  /** Draw the select check. Submenu rows keep the fill and pass false. */
  check?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active || undefined}
      className={cn(
        rowClass,
        "text-foreground",
        active ? "bg-muted" : "hover:bg-muted focus-visible:bg-muted",
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="size-3.5 shrink-0" /> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing ? <span className="flex shrink-0 items-center">{trailing}</span> : null}
      {active && check ? <Check aria-hidden="true" className="size-3.5 shrink-0" /> : null}
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
