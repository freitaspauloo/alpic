import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { money, useStore } from "../store";
import { Dialog, Empty, Page } from "../ui";

export function ApiKeys() {
  const { org = "" } = useParams();
  const store = useStore();
  const keys = store.apiKeys.filter((item) => item.orgId === org);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const closed = store.organizations.find((item) => item.id === org)?.blocked;
  return (
    <Page
      title="API keys"
      description="Your code and CI use them to start runs for this organization."
      action={
        <button className="btn btn-primary" onClick={() => setOpen(true)} disabled={closed}>
          New API key
        </button>
      }
    >
      {keys.length === 0 ? (
        <div className="card">
          <Empty title="Create your first API key">
            <p>Create one for each place that calls the API, like CI or staging.</p>
          </Empty>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Created</th>
                <th>Last used</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td>{key.name}</td>
                  <td className="mono">{key.secret ? "shown once" : "trk_••••••••"}</td>
                  <td className="muted">{key.created}</td>
                  <td className="muted">{key.lastUsed}</td>
                  <td className="num">
                    <button className="menu-btn" onClick={() => store.revokeKey(key.id)}>
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open ? (
        <Dialog title="Create an API key" description="Anything that holds it can act for this organization through the API." onClose={() => setOpen(false)}>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              setSecret(store.createKey(org, name));
              setOpen(false);
              setName("");
            }}
          >
            <div className="field">
              <label htmlFor="key-name">Name</label>
              <input id="key-name" required value={name} onChange={(event) => setName(event.target.value)} autoFocus />
              <span className="hint">Where it's used, like CI or staging.</span>
            </div>
            <div className="dialog-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit">
                Create
              </button>
            </div>
          </form>
        </Dialog>
      ) : null}
      {secret ? (
        <Dialog title="API key created" description="This is the only time it's shown. Copy it now and keep it somewhere safe, like your CI's secrets." onClose={() => setSecret(null)}>
          <div className="keybox">{secret}</div>
          <div className="dialog-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                void navigator.clipboard.writeText(secret);
                setCopied(true);
              }}
            >
              {copied ? "API key copied" : "Copy"}
            </button>
            <button className="btn btn-primary" onClick={() => setSecret(null)}>
              Done
            </button>
          </div>
        </Dialog>
      ) : null}
    </Page>
  );
}

export function Billing() {
  const { org = "" } = useParams();
  const store = useStore();
  const organization = store.organizations.find((item) => item.id === org);
  const transactions = store.transactions.filter((item) => item.orgId === org);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("50.00");
  if (!organization) return null;
  return (
    <Page
      title="Billing"
      description="Runs are paid from your balance. Add funds by card."
      action={
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          Add funds
        </button>
      }
    >
      <div className="stats">
        <div className="stat">
          <span>Balance</span>
          <strong>{money(organization.balanceCents)}</strong>
          <span>{organization.balanceCents > 0 ? "What's left to spend on runs." : "No run starts until you add funds."}</span>
        </div>
        <div className="stat">
          <span>Spend</span>
          <strong>{money(transactions.filter((item) => item.cents < 0).reduce((sum, item) => sum + Math.abs(item.cents), 0))}</strong>
        </div>
        <div className="stat">
          <span>Top-ups</span>
          <strong>{money(transactions.filter((item) => item.cents > 0).reduce((sum, item) => sum + item.cents, 0))}</strong>
        </div>
      </div>
      <h2 style={{ marginTop: 28, fontSize: 18 }}>Transactions</h2>
      {transactions.length === 0 ? (
        <p className="muted">No transactions yet. Top-ups and runs show up here.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction</th>
                <th className="num">Amount</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => (
                <tr key={item.id}>
                  <td className="muted">{item.date}</td>
                  <td>{item.label}</td>
                  <td className="num" style={{ color: item.cents < 0 ? "var(--destructive)" : "var(--success)" }}>
                    {money(item.cents)}
                  </td>
                  <td className="muted">{item.invoice ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open ? (
        <Dialog title="Add funds" description="You pay by card on Stripe, then come back here. Tax is added at payment. This prototype records the top-up locally." onClose={() => setOpen(false)}>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              const cents = Math.round(Number(amount) * 100);
              if (!Number.isFinite(cents) || cents < 100) return;
              store.addFunds(org, cents);
              setOpen(false);
            }}
          >
            <div className="field">
              <label htmlFor="amount">Amount</label>
              <input id="amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required />
              <span className="hint">{transactions.some((item) => item.cents > 0) ? "USD" : "Your first top-up"}</span>
            </div>
            <div className="dialog-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit">
                Continue
              </button>
            </div>
          </form>
        </Dialog>
      ) : null}
    </Page>
  );
}

export function Members() {
  const { org = "" } = useParams();
  const store = useStore();
  const members = store.members.filter((item) => item.orgId === org);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <Page
      title="Members"
      description="People who share this organization's balance, API keys, library and experiments."
      action={
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          Invite
        </button>
      }
    >
      {error ? <div className="alert" style={{ marginBottom: 12 }}>{error}</div> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td className="muted">{member.email}</td>
                <td>{member.role}</td>
                <td className="num">
                  {member.role === "Owner" ? null : (
                    <button
                      className="menu-btn"
                      onClick={() => {
                        const message = store.removeMember(member.id);
                        setError(message);
                      }}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="subtle">Removing a member revokes the API keys they created.</p>
      {open ? (
        <Dialog title="Invite a member" description="They get a link to join this organization." onClose={() => setOpen(false)}>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              store.inviteMember(org, email.trim());
              setEmail("");
              setOpen(false);
            }}
          >
            <div className="field">
              <label htmlFor="invite-email">Email</label>
              <input id="invite-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoFocus />
            </div>
            <div className="dialog-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit">
                Send invite
              </button>
            </div>
          </form>
        </Dialog>
      ) : null}
    </Page>
  );
}

export function Settings() {
  const { org = "" } = useParams();
  const store = useStore();
  const organization = store.organizations.find((item) => item.id === org);
  const [name, setName] = useState(organization?.name ?? "");
  const [copied, setCopied] = useState(false);
  if (!organization) return null;
  return (
    <Page title="Settings" description="The name and details of this organization.">
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          store.renameOrg(org, name);
        }}
      >
        <section className="card card-pad">
          <h2>Organization</h2>
          <div className="field">
            <label htmlFor="org-rename">Name</label>
            <input id="org-rename" value={name} onChange={(event) => setName(event.target.value)} required />
            <span className="hint">Members see it in the sidebar. Links use the ID, so they keep working.</span>
          </div>
          <div className="row-actions" style={{ marginTop: 12 }}>
            <button className="btn btn-primary" type="submit">
              Rename
            </button>
          </div>
        </section>
        <section className="card card-pad">
          <div className="meta-row" style={{ border: 0, padding: 0 }}>
            <div>
              <span>Organization ID</span>
              <strong className="mono">{organization.id}</strong>
              <button
                className="menu-btn"
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(organization.id);
                  setCopied(true);
                }}
              >
                {copied ? "Organization ID copied" : "Copy"}
              </button>
            </div>
            <div>
              <span>Created on</span>
              <strong>{organization.created}</strong>
            </div>
          </div>
        </section>
      </form>
    </Page>
  );
}

export function Invitation() {
  const store = useStore();
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);
  return (
    <main className="landing" style={{ background: "var(--bg)" }}>
      <div style={{ maxWidth: 640, margin: "auto", display: "grid", gap: 16 }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          Tracks
        </Link>
        <h1 style={{ fontSize: 36, letterSpacing: "-0.04em", margin: 0 }}>Join Northwind</h1>
        {done ? (
          <p className="lede">{done === "accepted" ? "You joined Northwind." : "Invitation declined."}</p>
        ) : (
          <>
            <p className="lede">Mina Chen invited {store.you.email} to share this organization's balance, API keys, library and experiments.</p>
            <div className="row-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (!store.organizations.some((item) => item.id === "northwind")) store.createOrg("Northwind");
                  setDone("accepted");
                }}
              >
                Accept
              </button>
              <button className="btn btn-secondary" onClick={() => setDone("declined")}>
                Decline
              </button>
            </div>
          </>
        )}
        {done === "accepted" ? (
          <Link className="btn btn-secondary" to="/northwind/experiments" style={{ justifySelf: "start" }}>
            Open Northwind
          </Link>
        ) : null}
      </div>
    </main>
  );
}
