import { useAnimatedSidebarPanel } from "@/components/motion/animated-sidebar";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef } from "react";

export function SidebarResizeHandle({
  width,
  onWidthChange,
  minWidth = 220,
  maxWidth = 420,
}: {
  width: number;
  onWidthChange: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
}) {
  const panel = useAnimatedSidebarPanel();
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(width);

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!dragging.current) return;
      const next = Math.min(maxWidth, Math.max(minWidth, startWidth.current + event.clientX - startX.current));
      onWidthChange(next);
    },
    [maxWidth, minWidth, onWidthChange],
  );

  const onPointerUp = useCallback((event: PointerEvent) => {
    dragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    const target = event.target;
    if (target instanceof Element && target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  if (panel.collapsed) return null;

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      tabIndex={-1}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        dragging.current = true;
        startX.current = event.clientX;
        startWidth.current = width;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      className={cn(
        "absolute top-0 right-0 z-30 h-full w-1.5 translate-x-1/2 cursor-col-resize touch-none",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-border after:transition-colors",
        "hover:after:bg-primary/40 active:after:bg-primary/60",
      )}
    />
  );
}
