import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { newId, slugify } from "./format";
import { DEFAULT_AGENT, TODAY, emptySources, emptyTraffic, sampleTraffic, seed } from "./seed";
import type {
  Experiment,
  McpAuth,
  NewRunInput,
  Run,
  Scenario,
  State,
  Theme,
  TrafficProvider,
} from "./types";

const STORAGE_KEY = "tracks-v2:state:v1";

export type Failure = { ok: false; error: string };
export type Success<T extends object = object> = { ok: true } & T;
export type Result<T extends object = object> = Success<T> | Failure;

export type Actions = {
  setTheme: (theme: Theme) => void;
  /** Show a one-line confirmation toast. Most actions below set it for you. */
  setNotice: (notice: string | null) => void;
  /** Restore the sample data. */
  resetDemo: () => void;

  renameOrg: (orgId: string, name: string) => void;
  /** Returns the new organization id (a slug of the name). */
  createOrg: (name: string) => string;
  addFunds: (orgId: string, cents: number) => void;
  acceptInvitation: (invitationId: string) => Result<{ orgId: string }>;
  declineInvitation: (invitationId: string) => void;

  /** Returns the new experiment id. */
  createExperiment: (orgId: string, name: string, scenarios: Scenario[]) => string;
  /** Saves the whole experiment and bumps its version. */
  updateExperiment: (experiment: Experiment) => void;
  removeExperiment: (experimentId: string) => void;
  /** Returns the copy's id, or null when the source is gone. */
  duplicateExperiment: (experimentId: string) => string | null;
  /** Starts an execution: one run per scenario up to runsPerLaunch, charged to the balance. */
  launch: (experimentId: string) => Result<{ executionId: string }>;
  /** Starts a one-off run (or an experiment run when experimentId is set). */
  createRun: (input: NewRunInput) => Result<{ runId: string }>;

  /** Returns the secret. Show it once; it's never readable again. */
  createKey: (orgId: string, name: string) => string;
  revokeKey: (keyId: string) => void;
  inviteMember: (orgId: string, email: string) => void;
  removeMember: (memberId: string) => Result;

  addRepository: (orgId: string, input: { name: string; url: string; ref: string }) => void;
  removeRepository: (repositoryId: string) => void;
  addSkill: (orgId: string, input: { name: string; description: string }) => void;
  removeSkill: (skillId: string) => void;
  addMcp: (orgId: string, input: { name: string; url: string; auth: McpAuth }) => void;
  toggleMcp: (mcpId: string) => void;
  removeMcp: (mcpId: string) => void;
  addTool: (orgId: string, input: { name: string; script: string }) => void;
  removeTool: (toolId: string) => void;

  connectSource: (orgId: string, provider: TrafficProvider, target: string) => void;
  disconnectSource: (orgId: string, provider: TrafficProvider) => void;
};

export type Store = State & { theme: Theme } & Actions;

const StoreContext = createContext<Store | null>(null);

function load(): State {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    /* fall back to the sample data */
  }
  return seed();
}

function fail(error: string): Failure {
  return { ok: false, error };
}

/** Why an organization can't start a run right now, or null when it can. */
function runBlocker(state: State, orgId: string, costCents: number) {
  const org = state.organizations.find((item) => item.id === orgId);
  if (!org || org.balanceCents <= 0) return "Your balance is $0. Add funds to start a run.";
  if (org.blocked) return "This organization is blocked: its new runs are refused.";
  if (org.balanceCents < costCents) return "This launch would pass the balance. Add funds or lower the maximum spend.";
  return null;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);
  const stateRef = useRef(state);
  stateRef.current = state;
  const { resolvedTheme, setTheme: setNextTheme } = useTheme();
  const theme: Theme = resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const actions = useMemo<Actions>(() => {
    const update = (recipe: (current: State) => Partial<State>) =>
      setState((current) => ({ ...current, ...recipe(current) }));
    const read = () => stateRef.current;

    const createOrg: Actions["createOrg"] = (name) => {
      const trimmed = name.trim();
      const base = slugify(trimmed) || newId("org");
      const taken = read().organizations.some((org) => org.id === base);
      const orgId = taken ? `${base}-${newId("").slice(1)}` : base;
      update((current) => ({
        organizations: [
          ...current.organizations,
          { id: orgId, name: trimmed, created: TODAY, balanceCents: 0, blocked: false },
        ],
        sources: { ...current.sources, [orgId]: emptySources() },
        traffic: { ...current.traffic, [orgId]: emptyTraffic() },
        members: [
          ...current.members,
          { id: newId("mem"), orgId, name: current.you.name, email: current.you.email, role: "Owner" },
        ],
        notice: `You joined ${trimmed}.`,
      }));
      return orgId;
    };

    return {
      setTheme: (next) => setNextTheme(next),
      setNotice: (notice) => update(() => ({ notice })),
      resetDemo: () => setState(seed()),

      renameOrg: (orgId, name) =>
        update((current) => ({
          organizations: current.organizations.map((org) =>
            org.id === orgId ? { ...org, name: name.trim() || org.name } : org,
          ),
          notice: "Organization renamed.",
        })),

      createOrg,

      addFunds: (orgId, cents) =>
        update((current) => ({
          organizations: current.organizations.map((org) =>
            org.id === orgId ? { ...org, balanceCents: org.balanceCents + cents } : org,
          ),
          transactions: [
            { id: newId("tx"), orgId, date: TODAY, label: "Top-up", cents, invoice: `INV-${1100 + current.transactions.length}` },
            ...current.transactions,
          ],
          notice: "Funds added. In production this returns from Stripe.",
        })),

      acceptInvitation: (invitationId) => {
        const invitation = read().invitations.find((item) => item.id === invitationId);
        if (!invitation) return fail("This invitation no longer exists.");
        const exists = read().organizations.some((org) => org.id === invitation.orgId);
        const orgId = exists ? invitation.orgId : createOrg(invitation.orgName);
        update((current) => ({
          invitations: current.invitations.map((item) =>
            item.id === invitationId ? { ...item, status: "accepted" } : item,
          ),
          members: current.members.some((member) => member.orgId === orgId && member.email === current.you.email)
            ? current.members
            : [
                ...current.members,
                { id: newId("mem"), orgId, name: current.you.name, email: current.you.email, role: "Member" },
              ],
          notice: `You joined ${invitation.orgName}.`,
        }));
        return { ok: true, orgId };
      },

      declineInvitation: (invitationId) =>
        update((current) => ({
          invitations: current.invitations.map((item) =>
            item.id === invitationId ? { ...item, status: "declined" } : item,
          ),
          notice: "Invitation declined.",
        })),

      createExperiment: (orgId, name, scenarios) => {
        const experimentId = newId("exp");
        const experiment: Experiment = {
          id: experimentId,
          orgId,
          name: name.trim() || "Untitled experiment",
          scenarios,
          agents: [{ id: newId("ag"), ...DEFAULT_AGENT }],
          repositoryId: null,
          runsPerLaunch: Math.max(1, scenarios.length),
          maxSpendCents: 1000,
          version: 1,
        };
        update((current) => ({ experiments: [experiment, ...current.experiments] }));
        return experimentId;
      },

      updateExperiment: (experiment) =>
        update((current) => ({
          experiments: current.experiments.map((item) =>
            item.id === experiment.id ? { ...experiment, version: item.version + 1 } : item,
          ),
          notice: "Experiment saved.",
        })),

      removeExperiment: (experimentId) =>
        update((current) => ({
          experiments: current.experiments.filter((item) => item.id !== experimentId),
          notice: "Experiment removed.",
        })),

      duplicateExperiment: (experimentId) => {
        const source = read().experiments.find((item) => item.id === experimentId);
        if (!source) return null;
        const copyId = newId("exp");
        update((current) => ({
          experiments: [{ ...source, id: copyId, name: `${source.name} copy`, version: 1 }, ...current.experiments],
          notice: "Experiment duplicated.",
        }));
        return copyId;
      },

      launch: (experimentId) => {
        const snapshot = read();
        const experiment = snapshot.experiments.find((item) => item.id === experimentId);
        if (!experiment) return fail("This experiment no longer exists.");
        const spend = Math.min(experiment.maxSpendCents, 180);
        const blocker = runBlocker(snapshot, experiment.orgId, spend);
        if (blocker) return fail(blocker);

        const executionId = newId("ex");
        const repository = snapshot.repositories.find((item) => item.id === experiment.repositoryId);
        const perRun = Math.round(spend / Math.max(experiment.scenarios.length, 1));
        const fresh: Run[] = experiment.scenarios.slice(0, experiment.runsPerLaunch).map((scenario, index) => {
          const agent = experiment.agents[index % Math.max(experiment.agents.length, 1)] ?? DEFAULT_AGENT;
          const failed = index === 0;
          return {
            id: newId("run"),
            orgId: experiment.orgId,
            experimentId: experiment.id,
            executionId,
            prompt: scenario.prompt,
            scenario: scenario.name,
            agent: agent.name,
            model: agent.model,
            harness: agent.harness,
            repository: repository?.name ?? null,
            status: failed ? "Failed" : "Passed",
            costCents: perRun,
            duration: `${1 + index}m ${20 + index * 7}s`,
            started: TODAY,
            evidence: failed
              ? "The agent described the homepage and never opened the page the scenario asked for."
              : "Finished the scenario and linked the page it used as evidence.",
          };
        });

        update((current) => ({
          executions: [
            { id: executionId, orgId: experiment.orgId, experimentId, version: experiment.version, status: "Judged", started: TODAY, spendCents: spend },
            ...current.executions,
          ],
          runs: [...fresh, ...current.runs],
          organizations: current.organizations.map((org) =>
            org.id === experiment.orgId ? { ...org, balanceCents: org.balanceCents - spend } : org,
          ),
          transactions: [
            { id: newId("tx"), orgId: experiment.orgId, date: TODAY, label: experiment.name, cents: -spend, invoice: null },
            ...current.transactions,
          ],
          notice: "Launch judged. Open the latest result to read the evidence.",
        }));
        return { ok: true, executionId };
      },

      createRun: (input) => {
        const cost = 75;
        const blocker = runBlocker(read(), input.orgId, cost);
        if (blocker) return fail(blocker);
        const runId = newId("run");
        update((current) => ({
          runs: [
            {
              ...input,
              id: runId,
              status: "Running",
              costCents: cost,
              duration: "—",
              started: TODAY,
              evidence: "The agent is working through the prompt. Nothing judges a one-off run.",
            },
            ...current.runs,
          ],
          organizations: current.organizations.map((org) =>
            org.id === input.orgId ? { ...org, balanceCents: org.balanceCents - cost } : org,
          ),
          transactions: [
            { id: newId("tx"), orgId: input.orgId, date: TODAY, label: "One-off run", cents: -cost, invoice: null },
            ...current.transactions,
          ],
          notice: "Run started.",
        }));
        return { ok: true, runId };
      },

      createKey: (orgId, name) => {
        const secret = `trk_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
        update((current) => ({
          apiKeys: [
            { id: newId("key"), orgId, name: name.trim(), created: TODAY, lastUsed: "Never", secret },
            ...current.apiKeys,
          ],
        }));
        return secret;
      },

      revokeKey: (keyId) =>
        update((current) => ({
          apiKeys: current.apiKeys.filter((key) => key.id !== keyId),
          notice: "API key revoked.",
        })),

      inviteMember: (orgId, email) => {
        const address = email.trim();
        update((current) => ({
          members: [
            ...current.members,
            { id: newId("mem"), orgId, name: address.split("@")[0] || address, email: address, role: "Member" },
          ],
          notice: `Invited ${address}.`,
        }));
      },

      removeMember: (memberId) => {
        const members = read().members;
        const member = members.find((item) => item.id === memberId);
        if (!member) return fail("This member is already gone.");
        const others = members.filter((item) => item.orgId === member.orgId && item.id !== memberId);
        if (!others.length) return fail("The last member can't be removed.");
        update((current) => ({
          members: current.members.filter((item) => item.id !== memberId),
          notice: `${member.name} removed.`,
        }));
        return { ok: true };
      },

      addRepository: (orgId, input) =>
        update((current) => ({
          repositories: [{ id: newId("repo"), orgId, ...input }, ...current.repositories],
          notice: "Repository added.",
        })),
      removeRepository: (repositoryId) =>
        update((current) => ({
          repositories: current.repositories.filter((item) => item.id !== repositoryId),
          experiments: current.experiments.map((item) =>
            item.repositoryId === repositoryId ? { ...item, repositoryId: null } : item,
          ),
          notice: "Repository removed.",
        })),

      addSkill: (orgId, input) =>
        update((current) => ({
          skills: [{ id: newId("sk"), orgId, source: "Uploaded", files: 1, ...input }, ...current.skills],
          notice: "Skill added.",
        })),
      removeSkill: (skillId) =>
        update((current) => ({
          skills: current.skills.filter((item) => item.id !== skillId),
          notice: "Skill removed.",
        })),

      addMcp: (orgId, input) =>
        update((current) => ({
          mcpServers: [
            { id: newId("mcp"), orgId, connected: input.auth === "Bearer token", ...input },
            ...current.mcpServers,
          ],
          notice: "MCP server added.",
        })),
      toggleMcp: (mcpId) =>
        update((current) => ({
          mcpServers: current.mcpServers.map((item) =>
            item.id === mcpId ? { ...item, connected: !item.connected } : item,
          ),
        })),
      removeMcp: (mcpId) =>
        update((current) => ({
          mcpServers: current.mcpServers.filter((item) => item.id !== mcpId),
          notice: "MCP server removed.",
        })),

      addTool: (orgId, input) =>
        update((current) => ({
          tools: [{ id: newId("tool"), orgId, ...input }, ...current.tools],
          notice: "Command-line tool added.",
        })),
      removeTool: (toolId) =>
        update((current) => ({
          tools: current.tools.filter((item) => item.id !== toolId),
          notice: "Command-line tool removed.",
        })),

      connectSource: (orgId, provider, target) =>
        update((current) => {
          const traffic = current.traffic[orgId];
          return {
            sources: {
              ...current.sources,
              [orgId]: (current.sources[orgId] ?? emptySources()).map((source) =>
                source.provider === provider ? { ...source, connected: true, tracked: true, target } : source,
              ),
            },
            traffic: traffic?.buckets.length ? current.traffic : { ...current.traffic, [orgId]: sampleTraffic() },
            notice: `${provider} is tracking ${target}.`,
          };
        }),
      disconnectSource: (orgId, provider) =>
        update((current) => ({
          sources: {
            ...current.sources,
            [orgId]: (current.sources[orgId] ?? emptySources()).map((source) =>
              source.provider === provider ? { ...source, connected: false, tracked: false, target: "" } : source,
            ),
          },
          notice: `${provider} disconnected.`,
        })),
    };
  }, [setNextTheme]);

  const store = useMemo<Store>(() => ({ ...state, theme, ...actions }), [state, theme, actions]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside <StoreProvider>.");
  return store;
}
