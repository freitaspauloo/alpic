"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "System", Icon: Monitor },
] as const;

export type ThemeModeId = (typeof MODES)[number]["id"];

export function ThemeModeSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active: ThemeModeId =
    theme === "dark" || theme === "light" || theme === "system" ? theme : "light";

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className={cn(
        "inline-flex h-9 shrink-0 items-center rounded-[var(--radius-control)] border border-border bg-muted/50 p-1",
        className,
      )}
    >
      {MODES.map(({ id, label, Icon }) => {
        const selected = mounted && active === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            disabled={!mounted}
            onClick={() => setTheme(id)}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-[var(--radius-sm)] outline-none transition-[color,background-color,box-shadow]",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
