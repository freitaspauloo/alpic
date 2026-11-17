"use client";
// beui.dev/components/motion/expanding-arrow-button

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";
import {
  forwardRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { EASE_OUT, SPRING_LAYOUT, SPRING_PRESS } from "@/lib/ease";
import { useHoverCapable } from "@/lib/hooks/use-hover-capable";
import { cn } from "@/lib/utils";

export interface ExpandingArrowButtonProps extends Omit<
  HTMLMotionProps<"button">,
  "children"
> {
  children: ReactNode;
  /** Follow the application theme tokens instead of the registry demo palette. */
  theme?: "default" | "semantic";
  accentClassName?: string;
  labelClassName?: string;
}

const ARROW_OPACITY = [1, 0.78, 0.54, 0.32, 0.16] as const;

function DottedChevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect x="2" y="2" width="4" height="4" fill="currentColor" />
      <rect x="8" y="7" width="4" height="4" fill="currentColor" />
      <rect x="14" y="12" width="4" height="4" fill="currentColor" />
      <rect x="8" y="17" width="4" height="4" fill="currentColor" />
      <rect x="2" y="22" width="4" height="4" fill="currentColor" />
    </svg>
  );
}

export const ExpandingArrowButton = forwardRef<
  HTMLButtonElement,
  ExpandingArrowButtonProps
>(function ExpandingArrowButton(
  {
    children,
    className,
    theme = "default",
    accentClassName,
    labelClassName,
    disabled,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const active = !disabled && ((canHover && hovered) || focused);
  const layoutTransition = reduce ? { duration: 0 } : SPRING_LAYOUT;

  const handleMouseEnter = (event: MouseEvent<HTMLButtonElement>) => {
    setHovered(true);
    onMouseEnter?.(event);
  };

  const handleMouseLeave = (event: MouseEvent<HTMLButtonElement>) => {
    setHovered(false);
    onMouseLeave?.(event);
  };

  const handleFocus = (event: FocusEvent<HTMLButtonElement>) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLButtonElement>) => {
    setFocused(false);
    onBlur?.(event);
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      whileTap={reduce || disabled ? undefined : { scale: 0.97 }}
      transition={SPRING_PRESS}
      className={cn(
        "relative inline-flex h-16 min-w-72 items-center overflow-hidden p-1.5 select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        theme === "semantic" ? "rounded-[var(--radius-control)] bg-foreground text-background focus-visible:ring-ring" : "rounded-[22px] bg-neutral-950 text-white focus-visible:ring-lime-300",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      <motion.span
        layout="size"
        aria-hidden="true"
        transition={layoutTransition}
        style={{
          width: active ? "calc(100% - 12px)" : 52,
          borderRadius: theme === "semantic" ? "var(--radius-control)" : 16,
        }}
        className={cn(
          "absolute inset-y-1.5 left-1.5 z-10 overflow-hidden",
          theme === "semantic" ? "bg-primary text-primary-foreground" : "bg-lime-300 text-neutral-950",
          accentClassName,
        )}
      >
        <motion.span
          animate={{ opacity: active ? 0 : 1 }}
          transition={{ duration: reduce ? 0 : 0.1, ease: EASE_OUT }}
          className="absolute inset-0 grid place-items-center"
        >
          <DottedChevron className="h-7 w-5" />
        </motion.span>

        <span className="absolute inset-0 flex items-center justify-around px-3">
          {ARROW_OPACITY.map((opacity, index) => (
            <motion.span
              key={opacity}
              animate={{
                opacity: active ? 1 : 0,
                transform:
                  active && !reduce ? "translateX(0px)" : "translateX(-6px)",
              }}
              transition={{
                duration: reduce ? 0 : 0.18,
                delay: active && !reduce ? 0.04 + index * 0.025 : 0,
                ease: EASE_OUT,
              }}
              style={theme === "semantic" ? { color: `color-mix(in srgb, var(--primary-foreground) ${opacity * 100}%, transparent)` } : { color: `rgb(10 10 10 / ${opacity})` }}
              className="inline-grid place-items-center"
            >
              <DottedChevron className="h-7 w-5" />
            </motion.span>
          ))}
        </span>
      </motion.span>

      <motion.span
        animate={{
          opacity: active ? 0 : 1,
          transform:
            active && !reduce ? "translateX(6px)" : "translateX(0px)",
        }}
        transition={{ duration: reduce ? 0 : 0.12, ease: EASE_OUT }}
        className={cn(
          "relative z-0 ml-[76px] mr-5 whitespace-nowrap text-lg font-medium tracking-[-0.02em]",
          labelClassName,
        )}
      >
        {children}
      </motion.span>
    </motion.button>
  );
});
