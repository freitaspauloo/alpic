import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { passRate, useStore, type Scenario } from "../store";
import { Dialog, Empty, Page, Status } from "../ui";

const starters = [
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

export function Experiments() {
  const { org = "" } = useParams();
  const store = useStore();
  const navigate = useNavigate();
  const experiments = store.experiments.filter((item) => item.orgId === org);
  const [creating, setCreating] = useState(false);
  const [fromDoc, setFromDoc] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [picked, setPicked] = useState<string[]>(["find pricing"]);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const removing = experiments.find((item) => item.id === removeId);

  function startScratch(event: FormEvent) {
    event.preventDefault();
    const id = store.createExperiment(org, name, []);
    setCreating(false);
    setName("");
    navigate(`/${org}/experiments/${id}/edit`);
  }

  function startFromDocument(event: FormEvent) {
    event.preventDefault();
    const host = website.trim() || "your-business.com";
    const chosen = starters.filter((item) => picked.includes(item.label));
    const scenarios: Scenario[] = chosen.map((item) => ({
      id: `sc_${item.label.replace(/\s/g, "_")}`,
      name: item.name,
      prompt: item.prompt.replaceAll("{website}", host),
    }));
    const id = store.createExperiment(org, chosen[0]?.name ?? "Untitled experiment", scenarios);
    setFromDoc(false);
    navigate(`/${org}/experiments/${id}`);
  }

  return (
    <Page
      title="Experiments"
      description="Compare how agents perform your scenarios across variants."
      action={
        <>
          <button className="btn btn-secondary" onClick={() => setFromDoc(true)}>
            From a document
          </button>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            New experiment
          </button>
        </>
      }
    >
      {experiments.length === 0 ? (
        <div className="card">
          <Empty title="What would you like to test?">
            <p>Start from a few questions about your website, or write the scenarios yourself.</p>
            <div className="chips">
              {starters.map((item) => (
                <button key={item.label} className="chip" type="button" onClick={() => setFromDoc(true)}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="row-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => setCreating(true)}>
                Start from scratch
              </button>
            </div>
          </Empty>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Scenarios</th>
                <th>Latest execution</th>
                <th className="num">Actions</th>
              </tr>
            </thead>
            <tbody>
              {experiments.map((experiment) => {
                const latest = store.executions.find((item) => item.experimentId === experiment.id);
                const runs = latest ? store.runs.filter((item) => item.executionId === latest.id) : [];
                const rate = passRate(runs);
                return (
                  <tr key={experiment.id}>
                    <td>
                      <Link className="rowlink" to={`/${org}/experiments/${experiment.id}`}>
                        {experiment.name}
                      </Link>
                    </td>
                    <td className="muted">{experiment.scenarios.length === 1 ? "1 scenario" : `${experiment.scenarios.length} scenarios`}</td>
                    <td>
                      {!latest ? (
                        <span className="muted">Not launched yet</span>
                      ) : (
                        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                          <Status status={latest.status} />
                          {rate !== null ? <span className="muted">{Math.round(rate * 100)}% pass</span> : null}
                        </span>
                      )}
                    </td>
                    <td className="num">
                      <button className="menu-btn" onClick={() => navigate(`/${org}/experiments/${experiment.id}/edit`)}>
                        Edit
                      </button>
                      <button className="menu-btn" onClick={() => store.duplicateExperiment(experiment.id)}>
                        Duplicate
                      </button>
                      <button className="menu-btn" onClick={() => setRemoveId(experiment.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {creating ? (
        <Dialog title="New experiment" description="From scratch. You’ll add scenarios and agents next." onClose={() => setCreating(false)}>
          <form className="form" onSubmit={startScratch}>
            <div className="field">
              <label htmlFor="exp-name">Name</label>
              <input id="exp-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Untitled experiment" autoFocus />
            </div>
            <div className="dialog-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setCreating(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit">
                Create
              </button>
            </div>
          </form>
        </Dialog>
      ) : null}

      {fromDoc ? (
        <Dialog title="Import scenarios from a document" description="Pick the questions to ask about a website. Tracks writes one scenario for each." onClose={() => setFromDoc(false)} wide>
          <form className="form" onSubmit={startFromDocument}>
            <div className="field">
              <label htmlFor="website">Website</label>
              <input id="website" value={website} placeholder="your-business.com" onChange={(event) => setWebsite(event.target.value)} autoFocus />
            </div>
            <div className="chips" style={{ justifyContent: "flex-start" }}>
              {starters.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="chip"
                  aria-pressed={picked.includes(item.label)}
                  onClick={() =>
                    setPicked((current) => (current.includes(item.label) ? current.filter((label) => label !== item.label) : [...current, item.label]))
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="dialog-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setFromDoc(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit" disabled={!picked.length}>
                Create experiment
              </button>
            </div>
          </form>
        </Dialog>
      ) : null}

      {removing ? (
        <Dialog title={`Remove ${removing.name}?`} description="Its scenarios and settings are lost, and its executions are no longer shown." onClose={() => setRemoveId(null)}>
          <div className="dialog-actions">
            <button className="btn btn-secondary" onClick={() => setRemoveId(null)}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                store.removeExperiment(removing.id);
                setRemoveId(null);
              }}
            >
              Remove
            </button>
          </div>
        </Dialog>
      ) : null}
    </Page>
  );
}
