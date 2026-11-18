import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./shell";
import { SessionProvider } from "./state";
import { ApiKeys, Billing, Experiments, Home, Library, Members, NewExperiment, Runs, Settings } from "./pages/app";
import { Landing, Pricing, Role, Signup, Welcome } from "./pages/marketing";

export function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/role" element={<Role />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/acme" element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="experiments" element={<Experiments />} />
          <Route path="experiments/new" element={<NewExperiment />} />
          <Route path="runs" element={<Runs />} />
          <Route path="library" element={<Library />} />
          <Route path="billing" element={<Billing />} />
          <Route path="api-keys" element={<ApiKeys />} />
          <Route path="members" element={<Members />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessionProvider>
  );
}
