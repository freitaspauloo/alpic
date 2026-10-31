import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { money, useStore, type RunStatus } from "../store";
import { Page, Status } from "../ui";

const outcomes: Array<RunStatus | "Any outcome"> = ["Any outcome", "Passed", "Failed", "Running", "Judging", "Canceled"];

export function Runs() {
  const { org = "" } = useParams();
  const store = useStore();
  const [outcome, setOutcome] = useState<(typeof outcomes)[number]>("Any outcome");
  const [agent, setAgent] = useState("Any agent");
  const [experiment, setExperiment] = useState("Any experiment");
  const experiments = store.experiments.filter((item) => item.orgId === org);
  const agents = [...new Set(store.runs.filter((item) => item.orgId === org).map((item) => item.agent))];
  const runs = store.runs.filter((run) => {
    if (run.orgId !== org) return false;
    if (outcome !== "Any outcome" && run.status !== outcome) return false;
    if (agent !== "Any agent" && run.agent !== agent) return false;
    if (experiment === "One-off" && run.experimentId) return false;
    if (experiment !== "Any experiment" && experiment !== "One-off" && run.experimentId !== experiment) return false;
    return true;
  });

  return (
    <Page
      title="Runs"
      description="Every agent attempt, from an experiment or on its own."
      action={
        <Link className="btn btn-primary" to={`/${org}/runs/new`}>
          New run
        </Link>
      }
    >
      <div className="filters">
        <label className="field" style={{ width: 180 }}>
          <span className="hint">Outcome</span>
          <select className="select" aria-label="Outcome" value={outcome} onChange={(event) => setOutcome(event.target.value as (typeof outcomes)[number])}>
            {outcomes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="field" style={{ width: 180 }}>
          <span className="hint">Agent</span>
          <select className="select" aria-label="Agent" value={agent} onChange={(event) => setAgent(event.target.value)}>
            <option>Any agent</option>
            {agents.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="field" style={{ width: 220 }}>
          <span className="hint">Experiment</span>
          <select className="select" aria-label="Experiment" value={experiment} onChange={(event) => setExperiment(event.target.value)}>
            <option value="Any experiment">Any experiment</option>
            <option value="One-off">Outside an experiment</option>
            {experiments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {runs.length === 0 ? (
        <div className="card">
          <p className="empty muted">No runs match these filters.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Run</th>
                <th>Status</th>
                <th>Variant</th>
                <th className="num">Cost</th>
                <th className="num">Duration</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const parent = experiments.find((item) => item.id === run.experimentId);
                return (
                  <tr key={run.id}>
                    <td>
                      <Link className="rowlink" to={`/${org}/runs/${run.id}`}>
                        {run.scenario ?? run.prompt.slice(0, 48)}
                      </Link>
                      <div className="subtle">{parent?.name ?? "One-off"}</div>
                    </td>
                    <td>
                      <Status status={run.status} />
                    </td>
                    <td className="muted">
                      {run.agent}
                      <div className="subtle">{run.model}</div>
                    </td>
                    <td className="num">{money(run.costCents)}</td>
                    <td className="num">{run.duration}</td>
                    <td className="muted">{run.started}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}

export function RunDetail() {
  const { org = "", runId = "" } = useParams();
  const store = useStore();
  const run = store.runs.find((item) => item.id === runId && item.orgId === org);
  const [copied, setCopied] = useState(false);
  if (!run) {
    return (
      <Page title="Run">
        <p className="muted">This run no longer exists.</p>
      </Page>
    );
  }
  const experiment = store.experiments.find((item) => item.id === run.experimentId);
  return (
    <Page
      title={run.scenario ?? "One-off run"}
      description={experiment ? experiment.name : "Outside any experiment. Nothing judges it."}
      action={<Status status={run.status} />}
    >
      <div className="grid-2">
        <section className="card card-pad">
          <h2>Prompt</h2>
          <p className="prompt">{run.prompt}</p>
        </section>
        <section className="card card-pad">
          <h2>Evidence</h2>
          <p className="prompt">{run.evidence}</p>
        </section>
      </div>
      <section className="card" style={{ marginTop: 16 }}>
        <div className="meta-row">
          <div>
            <span>Agent</span>
            <strong>{run.agent}</strong>
          </div>
          <div>
            <span>Harness</span>
            <strong>{run.harness}</strong>
          </div>
          <div>
            <span>Model</span>
            <strong>{run.model}</strong>
          </div>
          <div>
            <span>Repository</span>
            <strong>{run.repository ?? "No repository"}</strong>
          </div>
          <div>
            <span>Cost</span>
            <strong>{money(run.costCents)}</strong>
          </div>
          <div>
            <span>Duration</span>
            <strong>{run.duration}</strong>
          </div>
          <div>
            <span>Started</span>
            <strong>{run.started}</strong>
          </div>
          <div>
            <span>Run id</span>
            <strong className="mono">{run.id}</strong>
            <button
              className="menu-btn"
              onClick={() => {
                void navigator.clipboard.writeText(run.id);
                setCopied(true);
              }}
            >
              {copied ? "Run id copied." : "Copy run id"}
            </button>
          </div>
        </div>
      </section>
    </Page>
  );
}

export function NewRun() {
  const { org = "" } = useParams();
  const store = useStore();
  const navigate = useNavigate();
  const organization = store.organizations.find((item) => item.id === org);
  const repos = store.repositories.filter((item) => item.orgId === org);
  const [prompt, setPrompt] = useState("");
  const [agent, setAgent] = useState("Claude");
  const [model, setModel] = useState("claude-sonnet-4.5");
  const [harness, setHarness] = useState("Claude");
  const [effort, setEffort] = useState("Medium");
  const [fast, setFast] = useState(false);
  const [repositoryId, setRepositoryId] = useState(repos[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const broke = !organization || organization.balanceCents <= 0;

  const models = useMemo(
    () => ({
      Claude: ["claude-sonnet-4.5", "claude-opus-4.5"],
      Codex: ["gpt-5", "gpt-5-mini"],
    }),
    [],
  );

  return (
    <Page title="New run" description="Give one agent one prompt, outside any experiment. Nothing judges it.">
      {broke ? (
        <div className="alert" style={{ marginBottom: 16 }}>
          <strong>Missing to start</strong>
          Your balance is $0. Add funds to start a run. <Link to={`/${org}/billing`}>Add funds</Link>
        </div>
      ) : null}
      {error ? (
        <div className="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      ) : null}
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          const repository = repos.find((item) => item.id === repositoryId);
          const result = store.createRun({
            orgId: org,
            experimentId: null,
            executionId: null,
            prompt,
            scenario: null,
            agent,
            model,
            harness,
            repository: repository?.name ?? null,
          });
          if (!result || result.includes(" ")) {
            setError(result);
            return;
          }
          navigate(`/${org}/runs/${result}`);
        }}
      >
        <section className="card card-pad">
          <h2>This run</h2>
          <div className="field">
            <label htmlFor="prompt">Prompt</label>
            <textarea id="prompt" rows={5} required value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          </div>
        </section>
        <section className="card card-pad">
          <h2>Agent</h2>
          <div className="split two">
            <div className="field">
              <label htmlFor="harness">Harness</label>
              <select
                id="harness"
                value={harness}
                onChange={(event) => {
                  const next = event.target.value;
                  setHarness(next);
                  setAgent(next);
                  setModel(models[next as "Claude" | "Codex"][0]);
                }}
              >
                <option>Claude</option>
                <option>Codex</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="model">Model</label>
              <select id="model" value={model} onChange={(event) => setModel(event.target.value)}>
                {models[harness as "Claude" | "Codex"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="effort">Effort</label>
              <select id="effort" value={effort} onChange={(event) => setEffort(event.target.value)}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <label className="field" style={{ alignContent: "end" }}>
              <span>Fast mode</span>
              <input type="checkbox" checked={fast} onChange={(event) => setFast(event.target.checked)} />
            </label>
          </div>
        </section>
        <section className="card card-pad">
          <h2>Repository and agent tools</h2>
          <div className="field">
            <label htmlFor="repository">Repository</label>
            <select id="repository" value={repositoryId} onChange={(event) => setRepositoryId(event.target.value)}>
              <option value="">No repository: the run starts from an empty directory</option>
              {repos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}@{item.ref}
                </option>
              ))}
            </select>
          </div>
        </section>
        <div className="row-actions">
          <button className="btn btn-primary" type="submit" disabled={broke || !prompt.trim()}>
            Start run
          </button>
        </div>
      </form>
    </Page>
  );
}
