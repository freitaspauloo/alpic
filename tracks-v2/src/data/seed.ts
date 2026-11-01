import type { ScenarioStarter, State, TrafficData, TrafficSource } from "./types";

/** The prototype's fixed "today". Every new record is stamped with it. */
export const TODAY = "Oct 31, 2026";

export const DEFAULT_AGENT = { name: "Claude", model: "claude-sonnet-4.5", harness: "Claude" } as const;

export const AGENT_PRESETS = [
  { name: "Claude", model: "claude-sonnet-4.5", harness: "Claude" },
  { name: "Codex", model: "gpt-5", harness: "Codex" },
] as const;

export const SCENARIO_STARTERS: ScenarioStarter[] = [
  {
    label: "find pricing",
    name: "Find the price",
    prompt:
      "I’m considering using {website}. Find the published prices and explain what I would pay, including any stated billing period or mandatory fees. Link to your sources. If prices aren’t published, explain how to obtain them.",
  },
  {
    label: "get started",
    name: "Get started",
    prompt:
      "I’m new to {website}. Explain what it offers and find the official instructions or entry point for getting started. Give me the first actionable steps and link to the relevant pages.",
  },
  {
    label: "create an account",
    name: "Create an account",
    prompt:
      "Create an account on {website} using the supplied test identity. Complete verification using the supplied resources. Report whether the account is usable, and exactly where you stopped if you couldn’t finish.",
  },
  {
    label: "get support",
    name: "Get support",
    prompt:
      "I need help with {website}. Find an official way to get support or contact the business. Give me the working link or contact details and any instructions needed to use it.",
  },
];

export function emptySources(): TrafficSource[] {
  return [
    { provider: "Vercel", connected: false, tracked: false, target: "" },
    { provider: "Cloudflare", connected: false, tracked: false, target: "" },
  ];
}

const HOURLY_REQUESTS = [12, 18, 9, 22, 40, 28, 16, 33, 47, 21, 14, 19];
const HOURLY_AGENTS = [4, 7, 2, 9, 18, 11, 5, 14, 21, 8, 4, 6];

/** Traffic a freshly connected source starts reporting. */
export function sampleTraffic(): TrafficData {
  return {
    buckets: HOURLY_REQUESTS.map((requests, index) => ({
      label: `${String(index * 2).padStart(2, "0")}:00`,
      requests,
      agents: HOURLY_AGENTS[index] ?? 0,
    })),
    requests: [
      { id: "req_1", visitor: "Agent", path: "/pricing", status: "200", at: "19:41 UTC" },
      { id: "req_2", visitor: "Human", path: "/checkout", status: "200", at: "19:38 UTC" },
      { id: "req_3", visitor: "Bot", path: "/robots.txt", status: "200", at: "19:22 UTC" },
      { id: "req_4", visitor: "Agent", path: "/signup", status: "200", at: "19:11 UTC" },
      { id: "req_5", visitor: "Crawler", path: "/blog", status: "304", at: "18:54 UTC" },
      { id: "req_6", visitor: "Unknown", path: "/api/health", status: "200", at: "18:40 UTC" },
    ],
  };
}

export function emptyTraffic(): TrafficData {
  return { buckets: [], requests: [] };
}

export function seed(): State {
  const acme = "acme";
  const north = "northwind";
  return {
    you: { name: "Paulo", email: "paulo@du.design" },
    organizations: [
      { id: acme, name: "Acme", created: "Mar 4, 2026", balanceCents: 12840, blocked: false },
      { id: north, name: "Northwind", created: "Oct 30, 2026", balanceCents: 0, blocked: false },
    ],
    invitations: [
      { id: north, orgId: north, orgName: "Northwind", invitedBy: "Mina Chen", email: "paulo@du.design", status: "pending" },
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
          { id: "ag_claude", name: "Claude", model: "claude-sonnet-4.5", harness: "Claude" },
          { id: "ag_codex", name: "Codex", model: "gpt-5", harness: "Codex" },
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
        agents: [{ id: "ag_claude2", name: "Claude", model: "claude-sonnet-4.5", harness: "Claude" }],
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
        agents: [{ id: "ag_codex2", name: "Codex", model: "gpt-5", harness: "Codex" }],
        repositoryId: null,
        runsPerLaunch: 1,
        maxSpendCents: 800,
        version: 1,
      },
    ],
    executions: [
      { id: "ex_pricing", orgId: acme, experimentId: "exp_pricing", version: 3, status: "Judged", started: "Oct 28, 2026", spendCents: 420 },
      { id: "ex_account", orgId: acme, experimentId: "exp_account", version: 1, status: "Running", started: "Oct 31, 2026", spendCents: 90 },
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
        model: "claude-sonnet-4.5",
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
        model: "claude-sonnet-4.5",
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
        model: "gpt-5",
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
        model: "gpt-5",
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
        model: "claude-sonnet-4.5",
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
        model: "claude-sonnet-4.5",
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
      [north]: emptySources(),
    },
    traffic: {
      [acme]: sampleTraffic(),
      [north]: emptyTraffic(),
    },
    notice: null,
  };
}