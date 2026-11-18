export const roles = [
  { id: "founder", label: "Founder", icon: "flag" },
  { id: "product", label: "Product", icon: "box" },
  { id: "engineering", label: "Engineering", icon: "code" },
  { id: "qa", label: "QA", icon: "check" },
  { id: "support", label: "Support", icon: "headset" },
  { id: "design", label: "Design", icon: "pen" },
  { id: "research", label: "Research", icon: "book" },
  { id: "data", label: "Data", icon: "chart" },
  { id: "other", label: "Other", icon: "more" },
] as const;

export type RoleId = (typeof roles)[number]["id"];

export const kits = [
  {
    id: "checkout",
    name: "Checkout with Claude",
    model: "Claude",
    task: "Buy the all-mountain skis and stop if a step is missing.",
    url: "https://shop.northwind.example/skis",
    tint: "#2a1c22",
  },
  {
    id: "docs",
    name: "Docs search",
    model: "Claude",
    task: "Find how to create an API key and quote the exact step.",
    url: "https://docs.northwind.example",
    tint: "#243028",
  },
  {
    id: "signup",
    name: "Signup",
    model: "GPT",
    task: "Create an account and reach the first empty project.",
    url: "https://app.northwind.example/signup",
    tint: "#1e2430",
  },
  {
    id: "mcp",
    name: "MCP tool",
    model: "Gemini",
    task: "Call create_project and confirm the project exists.",
    url: "https://mcp.northwind.example",
    tint: "#2c241c",
  },
] as const;

export type KitId = (typeof kits)[number]["id"];

export function kitById(id: string | null) {
  return kits.find((kit) => kit.id === id) ?? null;
}

export const library = [
  { group: "Repositories", name: "GitHub", detail: "Read the repo a run is testing.", source: "Connect" },
  { group: "Repositories", name: "GitLab", detail: "Read the repo a run is testing.", source: "Connect" },
  { group: "Skills", name: "Checkout", detail: "Pay, confirm, and stop when a step is missing.", source: "Tracks" },
  { group: "Skills", name: "Docs search", detail: "Find the page that should have answered the agent.", source: "Tracks" },
  { group: "Skills", name: "Support reply", detail: "Draft a reply from the evidence of a failed run.", source: "Tracks" },
  { group: "MCP servers", name: "Alpic Cloud", detail: "Hosting, audit, and analytics for MCP.", source: "Alpic" },
  { group: "MCP servers", name: "Stripe", detail: "Let a run create a test payment and read the result.", source: "Stripe" },
  { group: "MCP servers", name: "Calendar", detail: "Book or read a slot while the agent is on the page.", source: "Google" },
  { group: "Command-line tools", name: "Vercel", detail: "See the deployment the agent was hitting.", source: "Vercel" },
  { group: "Command-line tools", name: "GitHub CLI", detail: "Open the pull request tied to a failing path.", source: "GitHub" },
  { group: "Command-line tools", name: "npm", detail: "Read the package the agent tried to install.", source: "npm" },
] as const;

export const plans = [
  {
    id: "free",
    name: "Free",
    price: "Free",
    cadence: "No card required",
    who: "For teams who want to see their first path.",
    cta: "Current plan",
    featured: false,
    points: ["20 runs a month", "1 workspace", "Evidence kept for 7 days", "Tracks skills"],
  },
  {
    id: "starter",
    name: "Starter",
    price: "$49",
    cadence: "per month",
    who: "For a product team running the same paths each week.",
    cta: "Upgrade",
    featured: false,
    points: ["200 runs", "3 seats", "Evidence kept for 30 days", "GitHub and one MCP server"],
  },
  {
    id: "team",
    name: "Team",
    price: "$180",
    cadence: "per month",
    who: "For teams who re-run paths after every change.",
    cta: "Upgrade",
    featured: true,
    points: ["1,000 runs", "10 seats", "Regression checks", "All library connectors", "Shared experiments"],
  },
  {
    id: "growth",
    name: "Growth",
    price: "$640",
    cadence: "per month",
    who: "For several products and more than one agent.",
    cta: "Upgrade",
    featured: false,
    points: ["5,000 runs", "SSO", "90-day evidence", "Priority readout"],
  },
  {
    id: "scale",
    name: "Scale",
    price: "Custom",
    cadence: "Talk to us",
    who: "For high volume and a private workspace.",
    cta: "Talk to us",
    featured: false,
    points: ["Volume pricing", "Dedicated support", "Custom retention", "Security review"],
  },
] as const;
