import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, MoreHorizontal, Pencil, Play, SquareArrowOutUpRight, Trash2 } from "lucide-react";
import { MenuAction, MenuSeparator } from "@/app/menu";
import { useToast } from "@/app/toast";
import type { AnimatedBadgeStatus } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button/base";
import { Card } from "@/components/motion/card";
import {
  CenterMorphModal,
  CenterMorphModalClose,
  CenterMorphModalContent,
} from "@/components/motion/center-morph-modal";
import { MorphPopover, MorphPopoverContent, MorphPopoverTrigger } from "@/components/motion/popover-morph";
import {
  passRate,
  useOrgData,
  useStore,
  type Execution,
  type ExecutionStatus,
  type Experiment,
  type Run,
  type RunStatus,
} from "@/data";

export function runBadge(status: RunStatus): AnimatedBadgeStatus {
  if (status === "Passed") return "success";
  if (status === "Failed") return "danger";
  if (status === "Running" || status === "Judging") return "loading";
  return "neutral";
}

export function executionBadge(status: ExecutionStatus): AnimatedBadgeStatus {
  if (status === "Judged") return "success";
  if (status === "Running" || status === "Judging") return "loading";
  return "neutral";
}

export type ExecutionSummary = { execution: Execution; runs: Run[]; rate: number | null };

/** Newest first, as the store prepends each launch. */
export function summarizeExecutions(experimentId: string, executions: Execution[], runs: Run[]): ExecutionSummary[] {
  return executions
    .filter((execution) => execution.experimentId === experimentId)
    .map((execution) => {
      const own = runs.filter((run) => run.executionId === execution.id);
      return { execution, runs: own, rate: passRate(own) };
    });
}

/** Pass rates as 0–100, oldest launch first, for sparklines and charts. */
export function rateTrend(history: ExecutionSummary[]) {
  return history
    .slice()
    .reverse()
    .map((item) => (item.rate === null ? null : Math.round(item.rate * 100)));
}

export function useExperimentHistory(experimentId: string | undefined) {
  const { executions, runs } = useOrgData();
  return useMemo(
    () => (experimentId ? summarizeExecutions(experimentId, executions, runs) : []),
    [experimentId, executions, runs],
  );
}

export function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

/** Launches an experiment and reports a refusal as an error toast with a way to add funds. */
export function useLaunch() {
  const { launch } = useStore();
  const { orgId } = useOrgData();
  const { toast } = useToast();
  const navigate = useNavigate();
  return useCallback(
    (experiment: Experiment) => {
      const result = launch(experiment.id);
      if (!result.ok) {
        toast({
          title: "Couldn't launch",
          description: result.error,
          status: "error",
          action: needsFunds(result.error)
            ? { label: "Add funds", onClick: () => navigate(`/${orgId}/billing`) }
            : undefined,
        });
      }
      return result;
    },
    [launch, navigate, orgId, toast],
  );
}

/** Launch refusals about the balance get an "Add funds" way out. */
export function needsFunds(error: string) {
  return /balance|funds/i.test(error);
}

export function EmptyCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Card variant="muted" className={className}>
      <div className="flex flex-col items-center gap-3 px-6 py-4 text-center text-sm text-muted-foreground">{children}</div>
    </Card>
  );
}

/** Row and page overflow menu. Every action is optional so each surface shows what fits it. */
export function ExperimentMenu({
  experiment,
  onOpen,
  onEdit,
  onDuplicate,
  onLaunch,
  onRemove,
  align = "end",
}: {
  experiment: Experiment;
  onOpen?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onLaunch?: () => void;
  onRemove: () => void;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const run = (action?: () => void) => () => {
    setOpen(false);
    action?.();
  };
  return (
    <MorphPopover open={open} onOpenChange={setOpen}>
      <MorphPopoverTrigger>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${experiment.name}`}>
          <MoreHorizontal aria-hidden="true" className="size-4" />
        </Button>
      </MorphPopoverTrigger>
      <MorphPopoverContent side="bottom" align={align} radius={12} className="w-52 p-1.5">
        {onOpen ? (
          <MenuAction icon={SquareArrowOutUpRight} onSelect={run(onOpen)}>
            Open
          </MenuAction>
        ) : null}
        {onLaunch ? (
          <MenuAction icon={Play} onSelect={run(onLaunch)}>
            Launch
          </MenuAction>
        ) : null}
        {onEdit ? (
          <MenuAction icon={Pencil} onSelect={run(onEdit)}>
            Edit
          </MenuAction>
        ) : null}
        {onDuplicate ? (
          <MenuAction icon={Copy} onSelect={run(onDuplicate)}>
            Duplicate
          </MenuAction>
        ) : null}
        <MenuSeparator />
        <MenuAction icon={Trash2} onSelect={run(onRemove)}>
          Remove
        </MenuAction>
      </MorphPopoverContent>
    </MorphPopover>
  );
}

/**
 * Confirms removal. The caller keeps `experiment` set while the modal closes so
 * the title doesn't blank out mid-animation.
 */
export function RemoveExperimentModal({
  experiment,
  open,
  onOpenChange,
  onRemoved,
}: {
  experiment: Experiment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoved?: () => void;
}) {
  const { removeExperiment } = useStore();
  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel={`Remove ${experiment?.name ?? "experiment"}`} className="max-w-md">
        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-1 pr-8">
            <h2 className="text-lg font-semibold text-foreground">Remove {experiment?.name}?</h2>
            <p className="text-sm text-muted-foreground">
              Its scenarios and settings are lost, and its executions are no longer shown.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <CenterMorphModalClose>
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
            </CenterMorphModalClose>
            <Button
              size="sm"
              onClick={() => {
                if (!experiment) return;
                removeExperiment(experiment.id);
                onOpenChange(false);
                onRemoved?.();
              }}
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
              Remove
            </Button>
          </div>
        </div>
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
}

/** Holds the removal target apart from `open` so the modal can animate out with its title intact. */
export function useRemoveDialog() {
  const [target, setTarget] = useState<Experiment | null>(null);
  const [open, setOpen] = useState(false);
  const ask = useCallback((experiment: Experiment) => {
    setTarget(experiment);
    setOpen(true);
  }, []);
  return { target, open, setOpen, ask };
}
