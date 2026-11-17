import { useLocation } from "react-router-dom";
import { useOrgData } from "@/data";
import type { ComposerDraft } from "./composer";
import { ExperimentSetup } from "./setup";

export function NewExperimentPage() {
  const { orgId } = useOrgData();
  const incoming = useLocation().state as ComposerDraft | null;
  return <ExperimentSetup orgId={orgId} initial={incoming?.prompt ? incoming : undefined} />;
}
