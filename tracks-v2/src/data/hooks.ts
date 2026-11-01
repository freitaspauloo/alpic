import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { emptySources, emptyTraffic } from "./seed";
import { useStore } from "./store";

/** The `:org` route param. Empty string outside an org route. */
export function useOrgId() {
  return useParams().org ?? "";
}

/** The organization in the URL, or undefined when the id is unknown. */
export function useCurrentOrg() {
  const orgId = useOrgId();
  const { organizations } = useStore();
  return organizations.find((org) => org.id === orgId);
}

/**
 * Every collection already filtered to the organization in the URL.
 * Use it for reads; call actions on `useStore()`.
 */
export function useOrgData() {
  const orgId = useOrgId();
  const store = useStore();
  return useMemo(() => {
    const own = <T extends { orgId: string }>(items: T[]) => items.filter((item) => item.orgId === orgId);
    return {
      orgId,
      org: store.organizations.find((org) => org.id === orgId),
      experiments: own(store.experiments),
      executions: own(store.executions),
      runs: own(store.runs),
      repositories: own(store.repositories),
      skills: own(store.skills),
      mcpServers: own(store.mcpServers),
      tools: own(store.tools),
      apiKeys: own(store.apiKeys),
      members: own(store.members),
      transactions: own(store.transactions),
      sources: store.sources[orgId] ?? emptySources(),
      traffic: store.traffic[orgId] ?? emptyTraffic(),
    };
  }, [orgId, store]);
}

/** Pending invitations addressed to the signed-in user. */
export function usePendingInvitations() {
  const { invitations, you } = useStore();
  return invitations.filter((item) => item.status === "pending" && item.email === you.email);
}
