export type Theme = "light" | "dark";

export type RunStatus = "Running" | "Judging" | "Passed" | "Failed" | "Canceled";
export type ExecutionStatus = "Running" | "Judging" | "Judged" | "Canceled";

export type User = { name: string; email: string };

export type Organization = {
  id: string;
  name: string;
  created: string;
  balanceCents: number;
  blocked: boolean;
};

export type Invitation = {
  id: string;
  orgId: string;
  orgName: string;
  invitedBy: string;
  email: string;
  status: "pending" | "accepted" | "declined";
};

export type Scenario = { id: string; name: string; prompt: string };
export type AgentSpec = { id: string; name: string; model: string; harness: string };

/** A reusable prompt template offered when creating an experiment. `{website}` is replaced on use. */
export type ScenarioStarter = { label: string; name: string; prompt: string };

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

/** One launch of an experiment. Its runs share `executionId`. */
export type Execution = {
  id: string;
  orgId: string;
  experimentId: string;
  version: number;
  status: ExecutionStatus;
  started: string;
  spendCents: number;
};

export type Run = {
  id: string;
  orgId: string;
  /** null for a one-off run started from Runs → New run. */
  experimentId: string | null;
  executionId: string | null;
  prompt: string;
  scenario: string | null;
  agent: string;
  model: string;
  harness: string;
  /** Repository name (e.g. "acme/storefront"), not id. */
  repository: string | null;
  status: RunStatus;
  costCents: number;
  duration: string;
  started: string;
  evidence: string;
};

export type NewRunInput = Pick<
  Run,
  "orgId" | "experimentId" | "executionId" | "prompt" | "scenario" | "agent" | "model" | "harness" | "repository"
>;

export type Repository = { id: string; orgId: string; name: string; url: string; ref: string };
export type Skill = { id: string; orgId: string; name: string; description: string; source: string; files: number };
export type McpAuth = "Bearer token" | "Connection";
export type McpServer = { id: string; orgId: string; name: string; url: string; auth: McpAuth; connected: boolean };
export type CommandLineTool = { id: string; orgId: string; name: string; script: string };

export type ApiKey = {
  id: string;
  orgId: string;
  name: string;
  created: string;
  lastUsed: string;
  /** Only set on a key created this session; show it once. */
  secret?: string;
};
export type MemberRole = "Owner" | "Member";
export type Member = { id: string; orgId: string; name: string; email: string; role: MemberRole };
export type Transaction = { id: string; orgId: string; date: string; label: string; cents: number; invoice: string | null };

export type TrafficProvider = "Cloudflare" | "Vercel";
export type TrafficSource = { provider: TrafficProvider; connected: boolean; tracked: boolean; target: string };

export type VisitorKind = "Agent" | "Human" | "Bot" | "Crawler" | "Unknown";
export type TrafficRequest = { id: string; visitor: VisitorKind; path: string; status: string; at: string };
/** Requests in one two-hour UTC bucket. `agents` is the subset classified as agents. */
export type TrafficBucket = { label: string; requests: number; agents: number };
export type TrafficData = { buckets: TrafficBucket[]; requests: TrafficRequest[] };

export type State = {
  you: User;
  organizations: Organization[];
  invitations: Invitation[];
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
  /** Keyed by organization id. */
  sources: Record<string, TrafficSource[]>;
  /** Keyed by organization id. Only meaningful while a source is tracked. */
  traffic: Record<string, TrafficData>;
  /** A one-line confirmation the shell turns into a toast, then clears. */
  notice: string | null;
};
