import { Button } from "@/components/motion/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/motion/popover";
import { ChevronDown, Copy, Pencil, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { MorphPopover, MorphPopoverContent, MorphPopoverTrigger } from "@/components/motion/popover-morph";
export function PopoverPreview() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <Popover side="bottom" align="start">
        <PopoverTrigger>
          <Button variant="secondary">Edit profile</Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <p className="text-sm font-medium text-foreground">Dimensions</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Set the width and height for the layer.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Width</span>
              <input
                defaultValue="100%"
                className="h-8 w-32 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Height</span>
              <input
                defaultValue="auto"
                className="h-8 w-32 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
              />
            </label>
          </div>
        </PopoverContent>
      </Popover>

      <Popover trigger="hover" side="top">
        <PopoverTrigger>
          <Button variant="outline">Hover me</Button>
        </PopoverTrigger>
        <PopoverContent className="w-56">
          <p className="text-sm text-foreground">
            Opens on hover, with a grace window so you can move into the panel.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}

const ACTIONS = [
  { icon: Pencil, label: "Edit" },
  { icon: Copy, label: "Duplicate" },
  { icon: Share2, label: "Share" },
  { icon: Trash2, label: "Delete" },
];

export function MorphPopoverPreview() {
  const [open, setOpen] = useState(false);

  return (
    <MorphPopover open={open} onOpenChange={setOpen}>
      <MorphPopoverTrigger>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground outline-none transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring"
        >
          Options
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </MorphPopoverTrigger>

      <MorphPopoverContent align="start" className="w-48 p-1.5">
        {ACTIONS.map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            {label}
          </button>
        ))}
      </MorphPopoverContent>
    </MorphPopover>
  );
}

