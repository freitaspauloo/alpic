import { Navigate, Route, Routes } from "react-router-dom";
import { NotFoundPage } from "./app/not-found";
import { Shell } from "./app/shell";
import { ApiKeys, Billing, Invitation, Members, Settings } from "./pages/account";
import { AnalyticsHome, Sources, Traffic } from "./pages/analytics";
import { ExperimentDetail, ExperimentEdit, Experiments, NewExperiment } from "./pages/experiments";
import { Landing } from "./pages/landing";
import { CommandLineTools, LibraryHub, McpServers, Repositories, Skills } from "./pages/library";
import { NewRun, RunDetail, Runs } from "./pages/runs";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/invitations/:invitation" element={<Invitation />} />
      <Route path="/:org" element={<Shell />}>
        <Route index element={<Navigate to="experiments" replace />} />
        <Route path="experiments" element={<Experiments />} />
        <Route path="experiments/new" element={<NewExperiment />} />
        <Route path="experiments/:experimentId" element={<ExperimentDetail />} />
        <Route path="experiments/:experimentId/edit" element={<ExperimentEdit />} />
        <Route path="runs" element={<Runs />} />
        <Route path="runs/new" element={<NewRun />} />
        <Route path="runs/:runId" element={<RunDetail />} />
        <Route path="library" element={<LibraryHub />} />
        <Route path="library/repositories" element={<Repositories />} />
        <Route path="library/skills" element={<Skills />} />
        <Route path="library/mcp-servers" element={<McpServers />} />
        <Route path="library/command-line-tools" element={<CommandLineTools />} />
        <Route path="analytics" element={<AnalyticsHome />} />
        <Route path="analytics/sources" element={<Sources />} />
        <Route path="analytics/traffic" element={<Traffic />} />
        <Route path="api-keys" element={<ApiKeys />} />
        <Route path="billing" element={<Billing />} />
        <Route path="members" element={<Members />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFoundPage embedded />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
