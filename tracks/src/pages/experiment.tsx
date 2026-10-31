import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { money, passRate, useStore, type AgentSpec, type Experiment, type Scenario } from "../store";
import { Page, Status } from "../ui";

export function ExperimentDetail() {
  const { org = "", experimentId = "" } = useParams();
  const store = useStore();
  const experiment = store.experiments.find((item) => item.id === experimentId && item.orgId === org);
  const [error, setError] = useState<string | null>(null);
  if (!experiment) {
    return (
      <Page title="Experiment">
        <p className="muted">This experiment no longer exists.</p>
      </Page>
    );
  }
  const executions = store.executions.filter((item) => item.experimentId === experiment.id);
  const latest = executions[0];
  const latestRuns = latest ? store.runs.filter((item) => item.executionId === latest.id) : [];
  const rate = passRate(latestRuns);
  const repository = store.repositories.find((item) => item.id === experiment.repositoryId);

  return (
    <Page
      title={experiment.name}
      description={`Version ${experiment.version}`}
      action={
        <>
          <Link className="btn btn-secondary" to={`/${org}/experiments/${experiment.id}/edit`}>
            Edit
          </Link>
          <button
            className="btn btn-primary"
            onClick={() => {
              const message = store.launch(experiment.id);
              setError(message);
            }}
          >
            {latest ? "Launch latest" : "Launch"}
          </button>
        </>
      }
    >
      {error ? (
        <div className="alert" style={{ marginBottom: 16 }}>
          <strong>Missing to start</strong>
          {error}{" "}
          {error.includes("balance") || error.includes("funds") ? (
            <Link to={`/${org}/billing`}>Add funds</Link>
          ) : null}
        </div>
      ) : null}
      <section className="card">
        <div className="plan">
          <div>
            <h2>Scenarios</h2>
            {experiment.scenarios.length === 0 ? (
              <p className="muted">No scenarios yet</p>
            ) : (
              <ol>
                {experiment.scenarios.map((scenario, index) => (
                  <li key={scenario.id}>
                    <span className="idx">{index + 1}</span>
                    <div>
                      <strong>{scenario.name}</strong>
                      <div className="subtle" style={{ marginTop: 4 }}>{scenario.prompt}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div>
            <h2>Agents</h2>
            {experiment.agents.length === 0 ? (
              <p className="muted">No agents yet</p>
            ) : (
              <ul className="stack">
                {experiment.agents.map((agent) => (
                  <li key={agent.id}>
                    <div>
                      <strong>{agent.name}</strong>
                      <div className="subtle">
                        {agent.harness} · {agent.model}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2>Experiment plan</h2>
            <p style={{ margin: 0 }}>{repository ? repository.name : "No repository"}</p>
            <p className="subtle">{repository ? repository.ref : "The run starts from an empty directory."}</p>
          </div>
        </div>
        <div className="meta-row">
          <div>
            <span>Runs per launch</span>
            <strong>{experiment.runsPerLaunch}</strong>
          </div>
          <div>
            <span>Maximum spend</span>
            <strong>{money(experiment.maxSpendCents)}</strong>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="card-pad" style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2>Latest result</h2>
            {!latest ? <p className="muted">Not launched yet</p> : <p className="muted">Last launched {latest.started}</p>}
          </div>
          {latest ? (
            <div className="stats" style={{ minWidth: 280 }}>
              <div className="stat">
                <span>Status</span>
                <Status status={latest.status} />
              </div>
              <div className="stat">
                <span>Pass rate</span>
                <strong>{rate === null ? "—" : `${Math.round(rate * 100)}%`}</strong>
              </div>
              <div className="stat">
                <span>Total spend</span>
                <strong>{money(latest.spendCents)}</strong>
              </div>
            </div>
          ) : null}
        </div>
        {latestRuns.length ? (
          <div className="table-wrap" style={{ border: 0, borderTop: "1px solid var(--border-secondary)", borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Variant</th>
                  <th>Status</th>
                  <th className="num">Cost</th>
                </tr>
              </thead>
              <tbody>
                {latestRuns.map((run) => (
                  <tr key={run.id}>
                    <td>
                      <Link className="rowlink" to={`/${org}/runs/${run.id}`}>
                        {run.scenario ?? run.id}
                      </Link>
                    </td>
                    <td className="muted">
                      {run.agent} · {run.model}
                    </td>
                    <td>
                      <Status status={run.status} />
                    </td>
                    <td className="num">{money(run.costCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {executions.length > 1 ? (
        <section style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 16 }}>Earlier executions</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th className="num">Spend</th>
                </tr>
              </thead>
              <tbody>
                {executions.slice(1).map((execution) => (
                  <tr key={execution.id}>
                    <td>v{execution.version}</td>
                    <td>
                      <Status status={execution.status} />
                    </td>
                    <td className="muted">{execution.started}</td>
                    <td className="num">{money(execution.spendCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </Page>
  );
}

export function ExperimentEdit() {
  const { org = "", experimentId = "" } = useParams();
  const store = useStore();
  const navigate = useNavigate();
  const source = store.experiments.find((item) => item.id === experimentId && item.orgId === org);
  const [draft, setDraft] = useState<Experiment | null>(source ? structuredClone(source) : null);
  if (!source || !draft) {
    return (
      <Page title="Edit experiment">
        <p className="muted">This experiment no longer exists.</p>
      </Page>
    );
  }

  function updateScenario(id: string, patch: Partial<Scenario>) {
    setDraft((current) =>
      current
        ? { ...current, scenarios: current.scenarios.map((item) => (item.id === id ? { ...item, ...patch } : item)) }
        : current,
    );
  }

  function updateAgent(id: string, patch: Partial<AgentSpec>) {
    setDraft((current) =>
      current ? { ...current, agents: current.agents.map((item) => (item.id === id ? { ...item, ...patch } : item)) } : current,
    );
  }

  return (
    <Page
      title="Edit experiment"
      description={draft.name}
      action={
        <button
          className="btn btn-primary"
          onClick={() => {
            store.updateExperiment(draft);
            navigate(`/${org}/experiments/${draft.id}`);
          }}
        >
          Save
        </button>
      }
    >
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          store.updateExperiment(draft);
          navigate(`/${org}/experiments/${draft.id}`);
        }}
      >
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </div>
        <section className="card card-pad">
          <h2>Scenarios</h2>
          <div className="stack">
            {draft.scenarios.map((scenario, index) => (
              <div key={scenario.id} className="field">
                <label htmlFor={`sc-${scenario.id}`}>Scenario {index + 1}</label>
                <input id={`sc-${scenario.id}`} value={scenario.name} onChange={(event) => updateScenario(scenario.id, { name: event.target.value })} />
                <textarea rows={3} value={scenario.prompt} aria-label={`${scenario.name} prompt`} onChange={(event) => updateScenario(scenario.id, { prompt: event.target.value })} />
              </div>
            ))}
          </div>
          <button
            className="btn btn-secondary"
            type="button"
            style={{ marginTop: 12 }}
            onClick={() =>
              setDraft({
                ...draft,
                scenarios: [...draft.scenarios, { id: `sc_${Date.now()}`, name: `Scenario ${draft.scenarios.length + 1}`, prompt: "" }],
              })
            }
          >
            Add scenario
          </button>
        </section>
        <section className="card card-pad">
          <h2>Agents</h2>
          <div className="stack">
            {draft.agents.map((agent) => (
              <div key={agent.id} className="split two">
                <div className="field">
                  <label htmlFor={`ag-${agent.id}`}>Agent</label>
                  <input id={`ag-${agent.id}`} value={agent.name} onChange={(event) => updateAgent(agent.id, { name: event.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor={`model-${agent.id}`}>Model</label>
                  <input id={`model-${agent.id}`} value={agent.model} onChange={(event) => updateAgent(agent.id, { model: event.target.value })} />
                </div>
              </div>
            ))}
          </div>
          <button
            className="btn btn-secondary"
            type="button"
            style={{ marginTop: 12 }}
            onClick={() =>
              setDraft({
                ...draft,
                agents: [...draft.agents, { id: `ag_${Date.now()}`, name: "Codex", model: "gpt-5", harness: "Codex" }],
              })
            }
          >
            Add agent
          </button>
        </section>
        <section className="card card-pad">
          <h2>Repository and run settings</h2>
          <div className="split two">
            <div className="field">
              <label htmlFor="repo">Repository</label>
              <select
                id="repo"
                value={draft.repositoryId ?? ""}
                onChange={(event) => setDraft({ ...draft, repositoryId: event.target.value || null })}
              >
                <option value="">No repository</option>
                {store.repositories
                  .filter((item) => item.orgId === org)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="spend">Maximum spend (USD)</label>
              <input
                id="spend"
                inputMode="decimal"
                value={(draft.maxSpendCents / 100).toFixed(2)}
                onChange={(event) => setDraft({ ...draft, maxSpendCents: Math.round(Number(event.target.value || 0) * 100) })}
              />
            </div>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="runs">Runs per launch</label>
            <input
              id="runs"
              type="number"
              min={1}
              value={draft.runsPerLaunch}
              onChange={(event) => setDraft({ ...draft, runsPerLaunch: Number(event.target.value) })}
            />
          </div>
        </section>
      </form>
    </Page>
  );
}
