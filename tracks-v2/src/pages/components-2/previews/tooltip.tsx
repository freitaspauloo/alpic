import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bold, Italic, Link2, Strikethrough, Underline } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/motion/tooltip";
import { cn } from "@/lib/utils";
import { useState } from "react";
const placements = [
  { side: "top", label: "Top", icon: ArrowUp, position: "col-start-2 row-start-1" },
  { side: "left", label: "Left", icon: ArrowLeft, position: "col-start-1 row-start-2" },
  { side: "right", label: "Right", icon: ArrowRight, position: "col-start-3 row-start-2" },
  { side: "bottom", label: "Bottom", icon: ArrowDown, position: "col-start-2 row-start-3" },
] as const;

export function TooltipPreview() {
  return (
    <div className="flex w-full flex-col items-center gap-8 py-6">
      <div className="grid grid-cols-3 gap-x-3 gap-y-5">
        {placements.map(({ side, label, icon: Icon, position }) => (
          <Tooltip key={side} content="More context" side={side} arrow>
            <button
              type="button"
              className={cn(
                position,
                "inline-flex h-10 w-20 items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
              )}
            >
              <Icon aria-hidden="true" className="size-3.5 text-muted-foreground" />
              {label}
            </button>
          </Tooltip>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">Hover or focus. Press Esc to dismiss.</p>
    </div>
  );
}

const actions = [
  { id: "bold", label: "Bold", shortcut: "⌘B", keys: "Meta+B", icon: Bold },
  { id: "italic", label: "Italic", shortcut: "⌘I", keys: "Meta+I", icon: Italic },
  { id: "underline", label: "Underline", shortcut: "⌘U", keys: "Meta+U", icon: Underline },
  { id: "strike", label: "Strikethrough", shortcut: "⌘⇧X", keys: "Meta+Shift+X", icon: Strikethrough },
] as const;

export function TooltipToolbarPreview() {
  const [active, setActive] = useState<string[]>(["bold"]);
  const toggle = (id: string) =>
    setActive((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  return (
    <TooltipProvider delay={300} skipDelay={400}>
      <div className="flex w-full flex-col items-center gap-8 py-6">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          {actions.map(({ id, label, shortcut, keys, icon: Icon }) => (
            <Tooltip key={id} asLabel>
              <TooltipTrigger
                aria-pressed={active.includes(id)}
                aria-keyshortcuts={keys}
                onClick={() => toggle(id)}
                className={cn(
                  "grid size-8 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                  active.includes(id) && "bg-muted text-foreground",
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="bottom" arrow>
                <span className="flex items-center gap-2">
                  {label}
                  {/* The shortcut is announced through aria-keyshortcuts, not as part of the name. */}
                  <span aria-hidden="true" className="text-[10px] text-muted-foreground">
                    {shortcut}
                  </span>
                </span>
              </TooltipContent>
            </Tooltip>
          ))}
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
          <Tooltip asLabel disabled={active.length === 0}>
            <TooltipTrigger
              disabled={active.length === 0}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              <Link2 aria-hidden="true" className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end" arrow>
              Insert link
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          The first label waits, the next ones open instantly. Click hides it until the pointer leaves.
        </p>
      </div>
    </TooltipProvider>
  );
}

