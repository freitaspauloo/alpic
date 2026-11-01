import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { TableColumn } from "@/components/motion/table";
import { money, useStore, type ApiKey, type Member, type Transaction } from "../store";
import {
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  Empty,
  FormActions,
  FormShell,
  MenuButton,
  Page,
  SimpleDataTable,
  TextField,
} from "../ui";

export function ApiKeys() {
  const { org = "" } = useParams();
  const store = useStore();
  const keys = store.apiKeys.filter((item) => item.orgId === org);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const closed = store.organizations.find((item) => item.id === org)?.blocked;

  const columns = useMemo((): TableColumn<ApiKey>[] => {
    return [
      { key: "name", header: "Name", sortable: true, sortValue: (row) => row.name, cell: (row) => row.name },
      {
        key: "key",
        header: "Key",
        cell: (row) => <span className="font-mono text-xs">{row.secret ? "shown once" : "trk_••••••••"}</span>,
      },
      { key: "created", header: "Created", cell: (row) => <span className="text-muted-foreground">{row.created}</span> },
      { key: "lastUsed", header: "Last used", cell: (row) => <span className="text-muted-foreground">{row.lastUsed}</span> },
      {
        key: "actions",
        header: "",
        align: "right",
        width: "100px",
        cell: (row) => <MenuButton onClick={() => store.revokeKey(row.id)}>Revoke</MenuButton>,
      },
    ];
  }, [store]);

  return (
    <Page
      title="API keys"
      description="Your code and CI use them to start runs for this organization."
      action={
        <Button type="button" onClick={() => setOpen(true)} disabled={closed}>
          New API key
        </Button>
      }
    >
      {keys.length === 0 ? (
        <Empty title="Create your first API key">
          <p>Create one for each place that calls the API, like CI or staging.</p>
        </Empty>
      ) : (
        <SimpleDataTable data={keys} columns={columns} getRowId={(row) => row.id} />
      )}
      {open ? (
        <Dialog title="Create an API key" description="Anything that holds it can act for this organization through the API." onClose={() => setOpen(false)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSecret(store.createKey(org, name));
              setOpen(false);
              setName("");
            }}
          >
            <FormShell>
              <TextField id="key-name" label="Name" value={name} onChange={setName} autoFocus required hint="Where it's used, like CI or staging." />
              <FormActions onCancel={() => setOpen(false)} submitLabel="Create" />
            </FormShell>
          </form>
        </Dialog>
      ) : null}
      {secret ? (
        <Dialog title="API key created" description="This is the only time it's shown. Copy it now and keep it somewhere safe, like your CI's secrets." onClose={() => setSecret(null)}>
          <div className="rounded-lg border border-border bg-muted p-3 font-mono text-sm break-all">{secret}</div>
          <div className="flex flex-wrap justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void navigator.clipboard.writeText(secret);
                setCopied(true);
              }}
            >
              {copied ? "API key copied" : "Copy"}
            </Button>
            <Button type="button" onClick={() => setSecret(null)}>
              Done
            </Button>
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

  const columns = useMemo((): TableColumn<Transaction>[] => {
    return [
      { key: "date", header: "Date", cell: (row) => <span className="text-muted-foreground">{row.date}</span> },
      { key: "label", header: "Transaction", cell: (row) => row.label },
      {
        key: "amount",
        header: "Amount",
        align: "right",
        sortable: true,
        sortValue: (row) => row.cents,
        cell: (row) => (
          <span className={`tabular-nums ${row.cents < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>{money(row.cents)}</span>
        ),
      },
      { key: "invoice", header: "Invoice", cell: (row) => <span className="text-muted-foreground">{row.invoice ?? "—"}</span> },
    ];
  }, []);

  const spend = money(transactions.filter((item) => item.cents < 0).reduce((sum, item) => sum + Math.abs(item.cents), 0));
  const topUps = money(transactions.filter((item) => item.cents > 0).reduce((sum, item) => sum + item.cents, 0));

  return (
    <Page
      title="Billing"
      description="Runs are paid from your balance. Add funds by card."
      action={
        <Button type="button" onClick={() => setOpen(true)}>
          Add funds
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Card variant="outlined">
          <CardContent className="grid gap-1 py-4">
            <span className="text-xs text-muted-foreground">Balance</span>
            <strong className="text-xl tabular-nums">{money(organization.balanceCents)}</strong>
            <span className="text-xs text-muted-foreground">{organization.balanceCents > 0 ? "What's left to spend on runs." : "No run starts until you add funds."}</span>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent className="grid gap-1 py-4">
            <span className="text-xs text-muted-foreground">Spend</span>
            <strong className="text-xl tabular-nums">{spend}</strong>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent className="grid gap-1 py-4">
            <span className="text-xs text-muted-foreground">Top-ups</span>
            <strong className="text-xl tabular-nums">{topUps}</strong>
          </CardContent>
        </Card>
      </div>
      <h2 className="mt-7 mb-3 text-lg font-semibold">Transactions</h2>
      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No transactions yet. Top-ups and runs show up here.</p>
      ) : (
        <SimpleDataTable data={transactions} columns={columns} getRowId={(row) => row.id} />
      )}
      {open ? (
        <Dialog title="Add funds" description="You pay by card on Stripe, then come back here. Tax is added at payment. This prototype records the top-up locally." onClose={() => setOpen(false)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const cents = Math.round(Number(amount) * 100);
              if (!Number.isFinite(cents) || cents < 100) return;
              store.addFunds(org, cents);
              setOpen(false);
            }}
          >
            <FormShell>
              <TextField
                id="amount"
                label="Amount"
                value={amount}
                onChange={setAmount}
                required
                hint={transactions.some((item) => item.cents > 0) ? "USD" : "Your first top-up"}
              />
              <FormActions onCancel={() => setOpen(false)} submitLabel="Continue" />
            </FormShell>
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

  const columns = useMemo((): TableColumn<Member>[] => {
    return [
      { key: "name", header: "Name", cell: (row) => row.name },
      { key: "email", header: "Email", cell: (row) => <span className="text-muted-foreground">{row.email}</span> },
      { key: "role", header: "Role", cell: (row) => row.role },
      {
        key: "actions",
        header: "",
        align: "right",
        cell: (row) =>
          row.role === "Owner" ? null : (
            <MenuButton
              onClick={() => {
                const message = store.removeMember(row.id);
                setError(message);
              }}
            >
              Remove
            </MenuButton>
          ),
      },
    ];
  }, [store]);

  return (
    <Page
      title="Members"
      description="People who share this organization's balance, API keys, library and experiments."
      action={
        <Button type="button" onClick={() => setOpen(true)}>
          Invite
        </Button>
      }
    >
      {error ? <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">{error}</div> : null}
      <SimpleDataTable data={members} columns={columns} getRowId={(row) => row.id} />
      <p className="mt-2 text-xs text-muted-foreground">Removing a member revokes the API keys they created.</p>
      {open ? (
        <Dialog title="Invite a member" description="They get a link to join this organization." onClose={() => setOpen(false)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              store.inviteMember(org, email.trim());
              setEmail("");
              setOpen(false);
            }}
          >
            <FormShell>
              <TextField id="invite-email" label="Email" type="email" value={email} onChange={setEmail} autoFocus required />
              <FormActions onCancel={() => setOpen(false)} submitLabel="Send invite" />
            </FormShell>
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
        className="grid max-w-2xl gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          store.renameOrg(org, name);
        }}
      >
        <Card variant="outlined">
          <CardHeader>
            <CardTitle as="h2">Organization</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <TextField
              id="org-rename"
              label="Name"
              value={name}
              onChange={setName}
              required
              hint="Members see it in the sidebar. Links use the ID, so they keep working."
            />
            <div className="flex justify-end">
              <Button type="submit">Rename</Button>
            </div>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent className="flex flex-wrap gap-8 py-4">
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">Organization ID</span>
              <strong className="font-mono text-sm">{organization.id}</strong>
              <MenuButton
                onClick={() => {
                  void navigator.clipboard.writeText(organization.id);
                  setCopied(true);
                }}
              >
                {copied ? "Organization ID copied" : "Copy"}
              </MenuButton>
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">Created on</span>
              <strong className="text-sm">{organization.created}</strong>
            </div>
          </CardContent>
        </Card>
      </form>
    </Page>
  );
}

export function Invitation() {
  const store = useStore();
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);
  return (
    <main className="landing">
      <div className="mx-auto grid max-w-xl gap-4">
        <Link to="/" className="logo w-fit">
          Tracks
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight">Join Northwind</h1>
        {done ? (
          <p className="text-sm text-muted-foreground">{done === "accepted" ? "You joined Northwind." : "Invitation declined."}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Mina Chen invited {store.you.email} to share this organization's balance, API keys, library and experiments.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => {
                  if (!store.organizations.some((item) => item.id === "northwind")) store.createOrg("Northwind");
                  setDone("accepted");
                }}
              >
                Accept
              </Button>
              <Button type="button" variant="secondary" onClick={() => setDone("declined")}>
                Decline
              </Button>
            </div>
          </>
        )}
        {done === "accepted" ? <ButtonLink to="/northwind/experiments" variant="secondary">Open Northwind</ButtonLink> : null}
      </div>
    </main>
  );
}
