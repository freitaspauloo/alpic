import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function InlineAlert({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: "default" | "destructive" | "success";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 rounded-lg border px-3 py-2 text-sm",
        variant === "destructive" && "border-destructive/30 bg-destructive/10",
        variant === "success" && "border-emerald-500/30 bg-emerald-500/10",
        variant === "default" && "border-border bg-muted/40",
        className,
      )}
      role="status"
    >
      {children}
    </div>
  );
}
