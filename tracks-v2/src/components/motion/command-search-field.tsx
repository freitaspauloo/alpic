"use client";

import { Search } from "lucide-react";
import { forwardRef, useEffect, useRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CommandSearchFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  className?: string;
  /** Show ⌘K / Ctrl+K hint. Default true. */
  showShortcut?: boolean;
  onShortcut?: () => void;
}

export const CommandSearchField = forwardRef<HTMLInputElement, CommandSearchFieldProps>(
  function CommandSearchField(
    { className, showShortcut = true, onShortcut, placeholder = "Search", ...rest },
    ref,
  ) {
    const innerRef = useRef<HTMLInputElement | null>(null);
    const setRef = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
        event.preventDefault();
        onShortcut?.();
        innerRef.current?.focus();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [onShortcut]);

    return (
      <label
        className={cn(
          "flex h-9 min-w-[12rem] flex-1 items-center gap-2 rounded-[var(--radius-control)] border border-border bg-muted/50 px-3",
          "has-[:focus-visible]:border-foreground/25 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/40",
          className,
        )}
      >
        <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        <input
          ref={setRef}
          type="search"
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/80"
          {...rest}
        />
        {showShortcut ? (
          <kbd
            aria-hidden
            className="hidden shrink-0 items-center rounded-[var(--radius-sm)] border border-border/80 bg-background px-1.5 py-0.5 font-sans text-[10px] font-medium leading-none text-muted-foreground sm:inline-flex"
          >
            ⌘K
          </kbd>
        ) : null}
      </label>
    );
  },
);
