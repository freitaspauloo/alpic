import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./shell";
import { Landing } from "./pages/landing";
import { Experiments } from "./pages/experiments";
import { ExperimentDetail, ExperimentEdit } from "./pages/experiment";
import { NewRun, RunDetail, Runs } from "./pages/runs";
import { CommandLineTools, McpServers, Repositories, Skills } from "./pages/library";
import { AnalyticsHome, Sources, Traffic } from "./pages/analytics";
import { ApiKeys, Billing, Invitation, Members, Settings } from "./pages/account";

function AppShell({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/invitations/:invitation" element={<Invitation />} />
      <Route path="/:org/experiments" element={<AppShell><Experiments /></AppShell>} />
      <Route path="/:org/experiments/:experimentId" element={<AppShell><ExperimentDetail /></AppShell>} />
      <Route path="/:org/experiments/:experimentId/edit" element={<AppShell><ExperimentEdit /></AppShell>} />
      <Route path="/:org/runs" element={<AppShell><Runs /></AppShell>} />
      <Route path="/:org/runs/new" element={<AppShell><NewRun /></AppShell>} />
      <Route path="/:org/runs/:runId" element={<AppShell><RunDetail /></AppShell>} />
      <Route path="/:org/library" element={<Navigate to="repositories" replace />} />
      <Route path="/:org/library/repositories" element={<AppShell><Repositories /></AppShell>} />
      <Route path="/:org/library/skills" element={<AppShell><Skills /></AppShell>} />
      <Route path="/:org/library/mcp-servers" element={<AppShell><McpServers /></AppShell>} />
      <Route path="/:org/library/command-line-tools" element={<AppShell><CommandLineTools /></AppShell>} />
      <Route path="/:org/analytics" element={<AppShell><AnalyticsHome /></AppShell>} />
      <Route path="/:org/analytics/sources" element={<AppShell><Sources /></AppShell>} />
      <Route path="/:org/analytics/traffic" element={<AppShell><Traffic /></AppShell>} />
      <Route path="/:org/api-keys" element={<AppShell><ApiKeys /></AppShell>} />
      <Route path="/:org/billing" element={<AppShell><Billing /></AppShell>} />
      <Route path="/:org/members" element={<AppShell><Members /></AppShell>} />
      <Route path="/:org/settings" element={<AppShell><Settings /></AppShell>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
