import { AnimatedBadge, type AnimatedBadgeStatus } from "@/components/motion/animated-badge";
import type { Run, RunStatus } from "@/data";

const BADGE: Record<RunStatus, AnimatedBadgeStatus> = {
  Passed: "success",
  Failed: "danger",
  Running: "loading",
  Judging: "loading",
  Canceled: "neutral",
};

export function runBadge(status: RunStatus): AnimatedBadgeStatus {
  return BADGE[status];
}

export function isLive(status: RunStatus) {
  return status === "Running" || status === "Judging";
}

export function RunStatusBadge({ status, size = "sm" }: { status: RunStatus; size?: "sm" | "md" }) {
  return (
    <AnimatedBadge status={runBadge(status)} size={size}>
      {status}
    </AnimatedBadge>
  );
}

/** "2m 14s" → 134. null for "—" or anything unparseable. */
export function durationSeconds(duration: string): number | null {
  const match = /^(?:(\d+)m)?\s*(?:(\d+)s)?$/.exec(duration.trim());
  if (!match || (!match[1] && !match[2])) return null;
  return Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0);
}

/** 134 → "2m 14s". */
export function formatDuration(seconds: number) {
  const whole = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(whole / 60);
  const rest = String(whole % 60).padStart(2, "0");
  return minutes ? `${minutes}m ${rest}s` : `${whole}s`;
}

/** Sort key for the seed's "Oct 28, 2026" dates. */
export function startedAt(run: Run) {
  const time = Date.parse(run.started);
  return Number.isNaN(time) ? 0 : time;
}

export function runTitle(run: Run) {
  return run.scenario ?? run.prompt;
}

export const HARNESS_MODELS = {
  Claude: ["claude-sonnet-4.5", "claude-opus-4.5"],
  Codex: ["gpt-5", "gpt-5-mini"],
} as const;

export type Harness = keyof typeof HARNESS_MODELS;

/** What the store charges for a one-off run (`createRun`). */
export const ONE_OFF_COST_CENTS = 75;
