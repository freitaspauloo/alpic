import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Plus, Search } from "lucide-react";
import { kitById, kits, library } from "../data";
import { useSession } from "../state";
import { QuietPage } from "../ui";
import { PlanGrid } from "./plans";

const sampleSteps = [
  { at: "00:04", text: "Opened /skis and read the price, length, and add-to-cart control." },
  { at: "00:18", text: "Added the 168 cm skis and reached checkout." },
  { at: "00:31", text: "Looked for an API key in the docs. The page never mentions one." },
  { at: "00:42", text: "Stopped. Cart still full. create_checkout() was never called." },
];

export function Home() {
  return (
    <section className="sheet home-sheet">
      <header className="sheet-head">
        <h1>Run a checkout with Claude</h1>
        <p>Nothing to set up. Start from a kit, watch the agent, and keep what it found.</p>
      </header>
      <article className="feature">
        <div className="feature-live">
          <span><i /> Claude</span>
          <ol>
            {sampleSteps.map((step) => (
              <li key={step.at}><b>{step.at}</b>{step.text}</li>
            ))}
          </ol>
          <div className="feature-actions">
            <Link className="pink-button" to="/acme/experiments/new?kit=checkout">Run this task</Link>
            <Link to="/acme/experiments/new">Or write your own</Link>
          </div>
        </div>
      </article>
      <div className="row-head">
        <div>
          <h2>Starter kits</h2>
          <p>A finished task, ready to run against your own URL.</p>
        </div>
        <Link to="/acme/library">View all</Link>
      </div>
      <div className="kit-row">
        {kits.map((kit) => (
          <Link key={kit.id} to={`/acme/experiments/new?kit=${kit.id}`} className="kit">
            <span style={{ background: kit.tint }} />
            <strong>{kit.name}</strong>
            <em>{kit.model}</em>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function Experiments() {
  const { experiments } = useSession();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const visible = experiments.filter((experiment) => {
    const matchesQuery = `${experiment.name} ${experiment.task}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "All" || experiment.status === status;
    return matchesQuery && matchesStatus;
  });

  return (
    <section className="sheet">
      <header className="sheet-head split-head">
        <div>
          <h1>Experiments <small>{experiments.length}</small></h1>
          <p>A repeatable task an agent runs against your product. <a href="https://tracks.alpic.ai/" target="_blank" rel="noreferrer">Read the method.</a></p>
        </div>
        <Link className="pink-button" to="/acme/experiments/new"><Plus size={15} /> New experiment</Link>
      </header>
      <div className="filters">
        <label className="search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or task" /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status">
          <option>All</option>
          <option>Draft</option>
          <option>Passed</option>
          <option>Failed</option>
        </select>
        <select aria-label="Sort" defaultValue="Last edited">
          <option>Last edited</option>
          <option>Name</option>
        </select>
      </div>
      <div className="panel">
        {visible.length === 0 ? (
          <div className="empty">
            <FlaskMark />
            <h2>Create your first experiment</h2>
            <p>An experiment is one task you can run again after the product changes. Most teams start with a path a customer actually takes.</p>
            <Link className="pink-button" to="/acme/experiments/new"><Plus size={15} /> New experiment</Link>
          </div>
        ) : (
          <ul className="exp-list">
            {visible.map((experiment) => (
              <li key={experiment.id}>
                <div>
                  <strong>{experiment.name}</strong>
                  <p>{experiment.task}</p>
                </div>
                <span>{experiment.model}</span>
                <em>{experiment.status}</em>
                <time>{experiment.edited}</time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function NewExperiment() {
  const [params] = useSearchParams();
  const kit = kitById(params.get("kit"));
  const { addExperiment } = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState(kit?.name ?? "");
  const [task, setTask] = useState(kit?.task ?? "");
  const [url, setUrl] = useState(kit?.url ?? "https://");
  const [model, setModel] = useState<string>(kit?.model ?? "Claude");

  return (
    <section className="sheet narrow-sheet">
      <header className="sheet-head">
        <h1>{kit ? `Start from ${kit.name}` : "New experiment"}</h1>
        <p>Name the path, say what done looks like, and pick the agent that should try it.</p>
      </header>
      <form
        className="stack-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || !task.trim()) return;
          addExperiment({ name: name.trim(), task: task.trim(), url: url.trim(), model });
          navigate("/acme/experiments");
        }}
      >
        <label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Checkout with Claude" required /></label>
        <label>Task<textarea value={task} onChange={(event) => setTask(event.target.value)} rows={4} placeholder="What should the agent finish?" required /></label>
        <label>Starting URL<input value={url} onChange={(event) => setUrl(event.target.value)} required /></label>
        <label>Agent
          <select value={model} onChange={(event) => setModel(event.target.value)}>
            <option>Claude</option>
            <option>GPT</option>
            <option>Gemini</option>
          </select>
        </label>
        <div className="form-actions">
          <button className="pink-button" type="submit">Create experiment</button>
          <Link to="/acme/experiments">Cancel</Link>
        </div>
      </form>
    </section>
  );
}

export function Runs() {
  return (
    <section className="sheet">
      <header className="sheet-head">
        <h1>Runs</h1>
        <p>One attempt at an experiment, with the steps and the page the agent actually saw.</p>
      </header>
      <article className="run-detail">
        <header>
          <div>
            <h2>Checkout with Claude</h2>
            <p>Sample · stopped at the docs</p>
          </div>
          <em>Failed</em>
        </header>
        <ol>
          {sampleSteps.map((step) => (
            <li key={step.at}><b>{step.at}</b><span>{step.text}</span></li>
          ))}
        </ol>
        <Link to="/acme/experiments/new?kit=checkout">Run it on your URL <ArrowUpRight size={14} /></Link>
      </article>
    </section>
  );
}

export function Library() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "All";
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const tabs = ["All", "Repositories", "Skills", "MCP servers", "Command-line tools"];
  const visible = useMemo(
    () => library.filter((item) => (tab === "All" || item.group === tab) && `${item.name} ${item.detail}`.toLowerCase().includes(query.toLowerCase())),
    [query, tab],
  );

  return (
    <section className="sheet">
      <header className="sheet-head split-head">
        <div>
          <h1>Library</h1>
          <p>Connect the repositories, skills, and tools an agent can reach during a run. <a href="https://tracks.alpic.ai/" target="_blank" rel="noreferrer">Read the method.</a></p>
        </div>
        <button className="pink-button" type="button" onClick={() => setNote("Connectors in this preview are samples. Pick one to see where it would attach.")}>
          <Plus size={15} /> New connector
        </button>
      </header>
      <div className="tabs" role="tablist">
        {tabs.map((item) => (
          <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setParams(item === "All" ? {} : { tab: item })}>{item}</button>
        ))}
      </div>
      <label className="search lone"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the library" /></label>
      {note ? <p className="inline-note">{note}</p> : null}
      <div className="lib-grid">
        {visible.map((item) => (
          <article key={item.name}>
            <i>{item.name.slice(0, 1)}</i>
            <div>
              <strong>{item.name}</strong>
              <p>{item.detail}</p>
            </div>
            <button type="button">{item.source}</button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Billing() {
  return (
    <section className="sheet">
      <header className="sheet-head split-head">
        <div>
          <h1>Billing</h1>
          <p>Your plan, the runs you have left, and the invoices. <a href="https://tracks.alpic.ai/" target="_blank" rel="noreferrer">Read the method.</a></p>
        </div>
        <div className="bill-actions">
          <button type="button" className="outline-button">Balance & invoices</button>
          <button type="button" className="outline-button">Change payment method</button>
        </div>
      </header>
      <div className="usage">
        <div>
          <h2>You’re on Free</h2>
          <p>Enough to see the first path. Not built for a whole product.</p>
          <button type="button" className="text-button">Have a coupon?</button>
        </div>
        <div className="usage-meter">
          <span>Runs included</span>
          <strong>0 / 20</strong>
          <div className="meter"><span style={{ width: "4%" }} /></div>
        </div>
      </div>
      <p className="notice">20 runs are included on Free. Upgrade when a path is worth running after every change.</p>
      <div className="pricing-copy">
        <h2>Pricing that stays with the work</h2>
        <p>Start with one path. Add runs as more of the product needs an agent to finish it.</p>
      </div>
      <PlanGrid current="free" />
    </section>
  );
}

export function ApiKeys() {
  return (
    <QuietPage title="API keys" lede="Keys let a CI job start a run. This preview does not issue a real key.">
      <p>No keys yet. Create one when a run should start from your pipeline.</p>
      <button className="pink-button" type="button">Create key</button>
    </QuietPage>
  );
}

export function Members() {
  const { name, email, role } = useSession();
  return (
    <QuietPage title="Members" lede="People who can see the evidence and start a run.">
      <ul className="member-list">
        <li><strong>{name}</strong><span>{email}</span><em>{role ?? "Owner"}</em></li>
      </ul>
    </QuietPage>
  );
}

export function Settings() {
  const { name, email } = useSession();
  return (
    <QuietPage title="Settings" lede="The workspace agents run against. This preview keeps it in the tab.">
      <dl className="settings-list">
        <div><dt>Workspace</dt><dd>acme</dd></div>
        <div><dt>Owner</dt><dd>{name}</dd></div>
        <div><dt>Email</dt><dd>{email}</dd></div>
        <div><dt>Evidence</dt><dd>Kept in this browser tab</dd></div>
      </dl>
    </QuietPage>
  );
}

function FlaskMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 3h6M10 3v5L5.5 19a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 8V3" />
    </svg>
  );
}
