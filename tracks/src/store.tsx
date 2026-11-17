import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type RunStatus = "Running" | "Judging" | "Passed" | "Failed" | "Canceled";

export type Organization = {
  id: string;
  name: string;
  created: string;
  balanceCents: number;
  blocked: boolean;
};

export type Scenario = { id: string; name: string; prompt: string };
export type AgentSpec = { id: string; name: string; model: string; harness: string };

export type Experiment = {
  id: string;
  orgId: string;
  name: string;
  scenarios: Scenario[];
  agents: AgentSpec[];
  repositoryId: string | null;
  runsPerLaunch: number;
  maxSpendCents: number;
  version: number;
};

export type Execution = {
  id: string;
  orgId: string;
  experimentId: string;
  version: number;
  status: "Running" | "Judging" | "Judged" | "Canceled";
  started: string;
  spendCents: number;
};

export type Run = {
  id: string;
  orgId: string;
  experimentId: string | null;
  executionId: string | null;
  prompt: string;
  scenario: string | null;
  agent: string;
  model: string;
  harness: string;
  repository: string | null;
  status: RunStatus;
  costCents: number;
  duration: string;
  started: string;
  evidence: string;
};

export type Repository = { id: string; orgId: string; name: string; url: string; ref: string };
export type Skill = { id: string; orgId: string; name: string; description: string; source: string; files: number };
export type McpServer = {
  id: string;
  orgId: string;
  name: string;
  url: string;
  auth: "Bearer token" | "Connection";
  connected: boolean;
};
export type CommandLineTool = { id: string; orgId: string; name: string; script: string };
export type ApiKey = { id: string; orgId: string; name: string; created: string; lastUsed: string; secret?: string };
export type Member = { id: string; orgId: string; name: string; email: string; role: "Owner" | "Member" };
export type Transaction = { id: string; orgId: string; date: string; label: string; cents: number; invoice: string | null };
export type TrafficSource = { provider: "Cloudflare" | "Vercel"; connected: boolean; tracked: boolean; target: string };

export type State = {
  theme: "light" | "dark";
  you: { name: string; email: string };
  organizations: Organization[];
  experiments: Experiment[];
  executions: Execution[];
  runs: Run[];
  repositories: Repository[];
  skills: Skill[];
  mcpServers: McpServer[];
  tools: CommandLineTool[];
  apiKeys: ApiKey[];
  members: Member[];
  transactions: Transaction[];
  sources: Record<string, TrafficSource[]>;
  notice: string | null;
};

const KEY = "tracks-prototype-v1";

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function passRate(runs: Run[]) {
  const done = runs.filter((run) => run.status === "Passed" || run.status === "Failed");
  if (!done.length) return null;
  return done.filter((run) => run.status === "Passed").length / done.length;
}

function seed(): State {
  const acme = "acme";
  const north = "northwind";
  return {
    theme: "light",
    you: { name: "Paulo", email: "paulo@du.design" },
    organizations: [
      { id: acme, name: "Acme", created: "Mar 4, 2026", balanceCents: 12840, blocked: false },
      { id: north, name: "Northwind", created: "Oct 30, 2026", balanceCents: 0, blocked: false },
    ],
    experiments: [
      {
        id: "exp_pricing",
        orgId: acme,
        name: "Find the price",
        scenarios: [
          {
            id: "sc_prices",
            name: "Published prices",
            prompt:
              "I’m considering using acme.com. Find the published prices and explain what I would pay, including any stated billing period or mandatory fees. Link to your sources.",
          },
          {
            id: "sc_fees",
            name: "Mandatory fees",
            prompt: "List every mandatory fee on acme.com checkout and say which ones are disclosed before payment.",
          },
        ],
        agents: [
          { id: "ag_claude", name: "Claude", model: "claude-sonnet-5.5", harness: "Claude" },
          { id: "ag_codex", name: "Codex", model: "gpt-6-astra", harness: "Codex" },
        ],
        repositoryId: "repo_store",
        runsPerLaunch: 4,
        maxSpendCents: 2000,
        version: 3,
      },
      {
        id: "exp_account",
        orgId: acme,
        name: "Create an account",
        scenarios: [
          {
            id: "sc_signup",
            name: "Test identity",
            prompt:
              "Create an account on acme.com using the supplied test identity. Complete verification using the supplied resources. Report whether the account is usable, and exactly where you stopped if you couldn’t finish.",
          },
        ],
        agents: [{ id: "ag_claude2", name: "Claude", model: "claude-sonnet-5.5", harness: "Claude" }],
        repositoryId: "repo_store",
        runsPerLaunch: 2,
        maxSpendCents: 1500,
        version: 1,
      },
      {
        id: "exp_support",
        orgId: acme,
        name: "Get support",
        scenarios: [
          {
            id: "sc_help",
            name: "Official contact",
            prompt:
              "I need help with acme.com. Find an official way to get support or contact the business. Give me the working link or contact details and any instructions needed to use it.",
          },
        ],
        agents: [{ id: "ag_codex2", name: "Codex", model: "gpt-6-astra", harness: "Codex" }],
        repositoryId: null,
        runsPerLaunch: 1,
        maxSpendCents: 800,
        version: 1,
      },
    ],
    executions: [
      {
        id: "ex_pricing",
        orgId: acme,
        experimentId: "exp_pricing",
        version: 3,
        status: "Judged",
        started: "Oct 28, 2026",
        spendCents: 420,
      },
      {
        id: "ex_account",
        orgId: acme,
        experimentId: "exp_account",
        version: 1,
        status: "Running",
        started: "Oct 31, 2026",
        spendCents: 90,
      },
    ],
    runs: [
      {
        id: "run_a1",
        orgId: acme,
        experimentId: "exp_pricing",
        executionId: "ex_pricing",
        prompt: "Find the published prices and explain what I would pay.",
        scenario: "Published prices",
        agent: "Claude",
        model: "claude-sonnet-5.5",
        harness: "Claude",
        repository: "acme/storefront",
        status: "Passed",
        costCents: 110,
        duration: "2m 14s",
        started: "Oct 28, 2026",
        evidence: "Cited /pricing and the checkout summary. Monthly plan is $24, and the platform fee is disclosed before payment.",
      },
      {
        id: "run_a2",
        orgId: acme,
        experimentId: "exp_pricing",
        executionId: "ex_pricing",
        prompt: "List every mandatory fee disclosed before payment.",
        scenario: "Mandatory fees",
        agent: "Claude",
        model: "claude-sonnet-5.5",
        harness: "Claude",
        repository: "acme/storefront",
        status: "Passed",
        costCents: 96,
        duration: "1m 48s",
        started: "Oct 28, 2026",
        evidence: "Found the processing fee in the order summary. Tax is calculated at payment, which the page states.",
      },
      {
        id: "run_a3",
        orgId: acme,
        experimentId: "exp_pricing",
        executionId: "ex_pricing",
        prompt: "Find the published prices and explain what I would pay.",
        scenario: "Published prices",
        agent: "Codex",
        model: "gpt-6-astra",
        harness: "Codex",
        repository: "acme/storefront",
        status: "Failed",
        costCents: 124,
        duration: "3m 02s",
        started: "Oct 28, 2026",
        evidence: "Stopped on the marketing page. Never opened /pricing, so the amount and billing period are missing.",
      },
      {
        id: "run_a4",
        orgId: acme,
        experimentId: "exp_pricing",
        executionId: "ex_pricing",
        prompt: "List every mandatory fee disclosed before payment.",
        scenario: "Mandatory fees",
        agent: "Codex",
        model: "gpt-6-astra",
        harness: "Codex",
        repository: "acme/storefront",
        status: "Passed",
        costCents: 90,
        duration: "2m 21s",
        started: "Oct 28, 2026",
        evidence: "Opened checkout with a sample cart and listed the platform fee. Noted that tax is added at payment.",
      },
      {
        id: "run_b1",
        orgId: acme,
        experimentId: "exp_account",
        executionId: "ex_account",
        prompt: "Create an account with the supplied test identity.",
        scenario: "Test identity",
        agent: "Claude",
        model: "claude-sonnet-5.5",
        harness: "Claude",
        repository: "acme/storefront",
        status: "Running",
        costCents: 90,
        duration: "—",
        started: "Oct 31, 2026",
        evidence: "Filled the signup form. Waiting on the verification email.",
      },
      {
        id: "run_one",
        orgId: acme,
        experimentId: null,
        executionId: null,
        prompt: "Walk through returning a shipped order and tell me where the flow breaks.",
        scenario: null,
        agent: "Claude",
        model: "claude-sonnet-5.5",
        harness: "Claude",
        repository: "acme/storefront",
        status: "Judging",
        costCents: 80,
        duration: "4m 10s",
        started: "Oct 30, 2026",
        evidence: "Reached the returns form. The reason dropdown does not include “arrived damaged”.",
      },
    ],
    repositories: [
      { id: "repo_store", orgId: acme, name: "acme/storefront", url: "https://github.com/acme/storefront", ref: "main" },
      { id: "repo_help", orgId: acme, name: "acme/help-center", url: "https://github.com/acme/help-center", ref: "main" },
    ],
    skills: [
      {
        id: "sk_checkout",
        orgId: acme,
        name: "checkout-policy",
        description: "How to judge a checkout: prices, fees, and where the agent stopped.",
        source: "Uploaded",
        files: 2,
      },
      {
        id: "sk_notes",
        orgId: acme,
        name: "release-notes",
        description: "Read the product’s release notes before claiming a feature exists.",
        source: "GitHub",
        files: 4,
      },
    ],
    mcpServers: [
      { id: "mcp_catalog", orgId: acme, name: "Catalog", url: "https://mcp.acme.example/catalog", auth: "Bearer token", connected: true },
      { id: "mcp_orders", orgId: acme, name: "Orders", url: "https://mcp.acme.example/orders", auth: "Connection", connected: false },
    ],
    tools: [{ id: "tool_pnpm", orgId: acme, name: "pnpm", script: "corepack enable && corepack prepare pnpm@10 --activate" }],
    apiKeys: [
      { id: "key_ci", orgId: acme, name: "ci-staging", created: "Oct 12, 2026", lastUsed: "2 hours ago" },
      { id: "key_local", orgId: acme, name: "local-dev", created: "Oct 20, 2026", lastUsed: "Never" },
    ],
    members: [
      { id: "mem_you", orgId: acme, name: "Paulo", email: "paulo@du.design", role: "Owner" },
      { id: "mem_mina", orgId: acme, name: "Mina Chen", email: "mina@acme.example", role: "Member" },
      { id: "mem_jules", orgId: acme, name: "Jules Okonkwo", email: "jules@acme.example", role: "Member" },
    ],
    transactions: [
      { id: "tx_top", orgId: acme, date: "Oct 2, 2026", label: "Top-up", cents: 20000, invoice: "INV-1042" },
      { id: "tx_run", orgId: acme, date: "Oct 28, 2026", label: "Find the price", cents: -420, invoice: null },
      { id: "tx_one", orgId: acme, date: "Oct 30, 2026", label: "One-off run", cents: -80, invoice: null },
    ],
    sources: {
      [acme]: [
        { provider: "Vercel", connected: true, tracked: true, target: "acme-storefront" },
        { provider: "Cloudflare", connected: false, tracked: false, target: "" },
      ],
      [north]: [
        { provider: "Vercel", connected: false, tracked: false, target: "" },
        { provider: "Cloudflare", connected: false, tracked: false, target: "" },
      ],
    },
    notice: null,
  };
}

function load(): State {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    /* sample data is enough */
  }
  return seed();
}

type Store = State & {
  setTheme: (theme: "light" | "dark") => void;
  setNotice: (notice: string | null) => void;
  renameOrg: (orgId: string, name: string) => void;
  createOrg: (name: string) => string;
  addFunds: (orgId: string, cents: number) => void;
  createExperiment: (orgId: string, name: string, scenarios: Scenario[]) => string;
  updateExperiment: (experiment: Experiment) => void;
  removeExperiment: (id: string) => void;
  duplicateExperiment: (id: string) => string | null;
  launch: (experimentId: string) => string | null;
  createRun: (run: Omit<Run, "id" | "started" | "status" | "costCents" | "duration" | "evidence">) => string | null;
  createKey: (orgId: string, name: string) => string;
  revokeKey: (id: string) => void;
  inviteMember: (orgId: string, email: string) => void;
  removeMember: (id: string) => string | null;
  addRepository: (orgId: string, input: { name: string; url: string; ref: string }) => void;
  removeRepository: (id: string) => void;
  addSkill: (orgId: string, input: { name: string; description: string }) => void;
  removeSkill: (id: string) => void;
  addMcp: (orgId: string, input: { name: string; url: string; auth: McpServer["auth"] }) => void;
  toggleMcp: (id: string) => void;
  removeMcp: (id: string) => void;
  addTool: (orgId: string, input: { name: string; script: string }) => void;
  removeTool: (id: string) => void;
  connectSource: (orgId: string, provider: TrafficSource["provider"], target: string) => void;
  disconnectSource: (orgId: string, provider: TrafficSource["provider"]) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state.theme]);

  useEffect(() => {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const api = useMemo<Store>(() => {
    const patch = (partial: Partial<State>) => setState((current) => ({ ...current, ...partial }));
    return {
      ...state,
      setTheme: (theme) => patch({ theme }),
      setNotice: (notice) => patch({ notice }),
      renameOrg: (orgId, name) =>
        patch({
          organizations: state.organizations.map((org) => (org.id === orgId ? { ...org, name: name.trim() || org.name } : org)),
          notice: "Organization renamed.",
        }),
      createOrg: (name) => {
        const orgId = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || id("org");
        const unique = state.organizations.some((org) => org.id === orgId) ? `${orgId}-${id("").slice(1)}` : orgId;
        setState((current) => ({
          ...current,
          organizations: [
            ...current.organizations,
            { id: unique, name: name.trim(), created: "Oct 31, 2026", balanceCents: 0, blocked: false },
          ],
          sources: {
            ...current.sources,
            [unique]: [
              { provider: "Vercel", connected: false, tracked: false, target: "" },
              { provider: "Cloudflare", connected: false, tracked: false, target: "" },
            ],
          },
          members: [...current.members, { id: id("mem"), orgId: unique, name: current.you.name, email: current.you.email, role: "Owner" }],
          notice: `You joined ${name.trim()}.`,
        }));
        return unique;
      },
      addFunds: (orgId, cents) =>
        setState((current) => ({
          ...current,
          organizations: current.organizations.map((org) => (org.id === orgId ? { ...org, balanceCents: org.balanceCents + cents } : org)),
          transactions: [
            { id: id("tx"), orgId, date: "Oct 31, 2026", label: "Top-up", cents, invoice: "INV-1108" },
            ...current.transactions,
          ],
          notice: "Funds added. In production this returns from Stripe.",
        })),
      createExperiment: (orgId, name, scenarios) => {
        const experimentId = id("exp");
        const experiment: Experiment = {
          id: experimentId,
          orgId,
          name: name.trim() || "Untitled experiment",
          scenarios,
          agents: [{ id: id("ag"), name: "Claude", model: "claude-sonnet-5.5", harness: "Claude" }],
          repositoryId: null,
          runsPerLaunch: Math.max(1, scenarios.length),
          maxSpendCents: 1000,
          version: 1,
        };
        patch({ experiments: [experiment, ...state.experiments] });
        return experimentId;
      },
      updateExperiment: (experiment) =>
        patch({
          experiments: state.experiments.map((item) => (item.id === experiment.id ? { ...experiment, version: item.version + 1 } : item)),
          notice: "Experiment saved.",
        }),
      removeExperiment: (experimentId) =>
        patch({
          experiments: state.experiments.filter((item) => item.id !== experimentId),
          notice: "Experiment removed.",
        }),
      duplicateExperiment: (experimentId) => {
        const source = state.experiments.find((item) => item.id === experimentId);
        if (!source) return null;
        const copyId = id("exp");
        patch({
          experiments: [{ ...source, id: copyId, name: `${source.name} copy`, version: 1 }, ...state.experiments],
        });
        return copyId;
      },
      launch: (experimentId) => {
        const experiment = state.experiments.find((item) => item.id === experimentId);
        if (!experiment) return "This experiment no longer exists.";
        const org = state.organizations.find((item) => item.id === experiment.orgId);
        if (!org || org.balanceCents <= 0) return "Your balance is $0. Add funds to start a run.";
        if (org.blocked) return "This organization is blocked: its new runs are refused.";
        const spend = Math.min(experiment.maxSpendCents, 180);
        if (org.balanceCents < spend) return "This launch would pass the balance. Add funds or lower the maximum spend.";
        const executionId = id("ex");
        const started = "Oct 31, 2026";
        const fresh: Run[] = experiment.scenarios.slice(0, experiment.runsPerLaunch).map((scenario, index) => {
          const agent = experiment.agents[index % Math.max(experiment.agents.length, 1)];
          const repo = state.repositories.find((item) => item.id === experiment.repositoryId);
          return {
            id: id("run"),
            orgId: experiment.orgId,
            experimentId: experiment.id,
            executionId,
            prompt: scenario.prompt,
            scenario: scenario.name,
            agent: agent?.name ?? "Claude",
            model: agent?.model ?? "claude-sonnet-5.5",
            harness: agent?.harness ?? "Claude",
            repository: repo?.name ?? null,
            status: index === 0 ? "Failed" : "Passed",
            costCents: Math.round(spend / Math.max(experiment.scenarios.length, 1)),
            duration: `${1 + index}m ${20 + index * 7}s`,
            started,
            evidence:
              index === 0
                ? "The agent described the homepage and never opened the page the scenario asked for."
                : "Finished the scenario and linked the page it used as evidence.",
          };
        });
        setState((current) => ({
          ...current,
          executions: [
            { id: executionId, orgId: experiment.orgId, experimentId, version: experiment.version, status: "Judged", started, spendCents: spend },
            ...current.executions,
          ],
          runs: [...fresh, ...current.runs],
          organizations: current.organizations.map((item) =>
            item.id === experiment.orgId ? { ...item, balanceCents: item.balanceCents - spend } : item,
          ),
          transactions: [
            { id: id("tx"), orgId: experiment.orgId, date: started, label: experiment.name, cents: -spend, invoice: null },
            ...current.transactions,
          ],
          notice: "Launch judged. Open the latest result to read the evidence.",
        }));
        return null;
      },
      createRun: (input) => {
        const org = state.organizations.find((item) => item.id === input.orgId);
        if (!org || org.balanceCents <= 0) return "Your balance is $0. Add funds to start a run.";
        if (org.blocked) return "This organization is blocked: its new runs are refused.";
        const cost = 75;
        const runId = id("run");
        setState((current) => ({
          ...current,
          runs: [
            {
              ...input,
              id: runId,
              status: "Running",
              costCents: cost,
              duration: "—",
              started: "Oct 31, 2026",
              evidence: "The agent is working through the prompt. Nothing judges a one-off run.",
            },
            ...current.runs,
          ],
          organizations: current.organizations.map((item) =>
            item.id === input.orgId ? { ...item, balanceCents: item.balanceCents - cost } : item,
          ),
          notice: null,
        }));
        return runId;
      },
      createKey: (orgId, name) => {
        const secret = `trk_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
        const keyId = id("key");
        patch({
          apiKeys: [{ id: keyId, orgId, name: name.trim(), created: "Oct 31, 2026", lastUsed: "Never", secret }, ...state.apiKeys],
        });
        return secret;
      },
      revokeKey: (keyId) => patch({ apiKeys: state.apiKeys.filter((key) => key.id !== keyId), notice: "API key revoked." }),
      inviteMember: (orgId, email) =>
        patch({
          members: [...state.members, { id: id("mem"), orgId, name: email.split("@")[0] ?? email, email, role: "Member" }],
          notice: `Invited ${email}.`,
        }),
      removeMember: (memberId) => {
        const member = state.members.find((item) => item.id === memberId);
        if (!member) return null;
        const others = state.members.filter((item) => item.orgId === member.orgId && item.id !== memberId);
        if (!others.length) return "The last member can't be removed.";
        patch({ members: state.members.filter((item) => item.id !== memberId), notice: `${member.name} removed.` });
        return null;
      },
      addRepository: (orgId, input) =>
        patch({ repositories: [{ id: id("repo"), orgId, ...input }, ...state.repositories], notice: "Repository added." }),
      removeRepository: (repositoryId) =>
        patch({ repositories: state.repositories.filter((item) => item.id !== repositoryId), notice: "Repository removed." }),
      addSkill: (orgId, input) =>
        patch({
          skills: [{ id: id("sk"), orgId, source: "Uploaded", files: 1, ...input }, ...state.skills],
          notice: "Skill added.",
        }),
      removeSkill: (skillId) => patch({ skills: state.skills.filter((item) => item.id !== skillId), notice: "Skill removed." }),
      addMcp: (orgId, input) =>
        patch({
          mcpServers: [{ id: id("mcp"), orgId, connected: input.auth === "Bearer token", ...input }, ...state.mcpServers],
          notice: "MCP server added.",
        }),
      toggleMcp: (mcpId) =>
        patch({
          mcpServers: state.mcpServers.map((item) => (item.id === mcpId ? { ...item, connected: !item.connected } : item)),
        }),
      removeMcp: (mcpId) => patch({ mcpServers: state.mcpServers.filter((item) => item.id !== mcpId), notice: "MCP server removed." }),
      addTool: (orgId, input) =>
        patch({ tools: [{ id: id("tool"), orgId, ...input }, ...state.tools], notice: "Command-line tool added." }),
      removeTool: (toolId) => patch({ tools: state.tools.filter((item) => item.id !== toolId), notice: "Command-line tool removed." }),
      connectSource: (orgId, provider, target) =>
        patch({
          sources: {
            ...state.sources,
            [orgId]: (state.sources[orgId] ?? []).map((source) =>
              source.provider === provider ? { ...source, connected: true, tracked: true, target } : source,
            ),
          },
          notice: `${provider} is tracking ${target}.`,
        }),
      disconnectSource: (orgId, provider) =>
        patch({
          sources: {
            ...state.sources,
            [orgId]: (state.sources[orgId] ?? []).map((source) =>
              source.provider === provider ? { ...source, connected: false, tracked: false, target: "" } : source,
            ),
          },
          notice: `${provider} disconnected.`,
        }),
    };
  }, [state]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const store = useContext(Ctx);
  if (!store) throw new Error("Store missing");
  return store;
}
