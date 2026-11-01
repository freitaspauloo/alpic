import type { Run, RunStatus } from "./types";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** 12840 → "$128.40". Negative cents keep their sign. */
export function money(cents: number) {
  return usd.format(cents / 100);
}

/** Share of judged runs (Passed / Failed) that passed, 0–1. null when nothing is judged yet. */
export function passRate(runs: Run[]) {
  const judged = runs.filter((run) => run.status === "Passed" || run.status === "Failed");
  if (!judged.length) return null;
  return judged.filter((run) => run.status === "Passed").length / judged.length;
}

/** 0.75 → "75%". null → "—". */
export function percent(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

export function initial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

export function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const RUN_STATUSES: RunStatus[] = ["Passed", "Failed", "Running", "Judging", "Canceled"];
