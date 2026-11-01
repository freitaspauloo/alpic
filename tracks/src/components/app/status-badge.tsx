import {
  AnimatedBadge,
  type AnimatedBadgeStatus,
} from "@/components/motion/animated-badge";

function mapStatus(status: string): AnimatedBadgeStatus {
  if (status === "Passed" || status === "Judged") return "success";
  if (status === "Failed" || status === "Canceled") return "danger";
  if (status === "Running" || status === "Judging") return "loading";
  return "neutral";
}

export function AppStatusBadge({ status }: { status: string }) {
  return (
    <AnimatedBadge status={mapStatus(status)} size="sm" pulse={status === "Running" || status === "Judging"}>
      {status}
    </AnimatedBadge>
  );
}
