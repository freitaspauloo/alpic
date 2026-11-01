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
  Claude: ["claude-sonnet-5.5", "claude-opus-5.5", "claude-fable-5.1", "claude-haiku-5.5"],
  Codex: ["gpt-6-astra", "gpt-6.1-sol", "gpt-6.1-terra", "gpt-6-sol", "gpt-6-luna"],
  Cursor: ["grok-4.7", "grok-4.6", "grok-4.5", "composer-2.5"],
} as const;

export type Harness = keyof typeof HARNESS_MODELS;

export const HARNESS_CATALOG = [
  {
    name: "Claude Code",
    provider: "Anthropic",
    description: "Anthropic's command-line coding agent",
    models: HARNESS_MODELS.Claude,
  },
  {
    name: "Claude Cowork",
    provider: "Anthropic",
    description: "Anthropic's agent workspace in the Claude desktop app",
    models: HARNESS_MODELS.Claude,
  },
  {
    name: "Codex",
    provider: "OpenAI",
    description: "OpenAI's command-line coding agent",
    models: HARNESS_MODELS.Codex,
  },
  {
    name: "Codex app",
    provider: "OpenAI",
    description: "OpenAI's Codex desktop app",
    models: HARNESS_MODELS.Codex,
  },
  {
    name: "Cursor",
    provider: "Cursor",
    description: "Cursor's command-line coding agent",
    models: HARNESS_MODELS.Cursor,
  },
] as const;

export type HarnessName = (typeof HARNESS_CATALOG)[number]["name"];
export type Provider = (typeof HARNESS_CATALOG)[number]["provider"];

/** Provider marks. A site resolves through its favicon; a file URL is used as given. */
export const PROVIDER_MARK: Record<Provider, string> = {
  Anthropic: "https://claude.ai/apple-touch-icon.png",
  OpenAI: "https://openai.com",
  Cursor: "https://cursor.com",
};

export function harnessesFor(provider: Provider) {
  return HARNESS_CATALOG.filter((item) => item.provider === provider);
}

export function modelsFor(provider: Provider, harness: HarnessName): readonly string[] {
  const match = HARNESS_CATALOG.find((item) => item.provider === provider && item.name === harness);
  return match?.models ?? [];
}

/** What the store charges for a one-off run (`createRun`). */
export const ONE_OFF_COST_CENTS = 75;
