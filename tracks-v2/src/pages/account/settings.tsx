import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { Page } from "@/app/page-layout";
import { useToast } from "@/app/toast";
import { Button } from "@/components/motion/button/base";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/motion/card";
import { Input } from "@/components/motion/input";
import { initial, useCurrentOrg, useOrgData, useStore, type Organization } from "@/data";
import { ConfirmModal, CopyButton } from "./shared";

/** Organizations the sample data starts with; anything else is gone after a reset. */
const SEED_ORGS = ["acme", "northwind"];

export function Settings() {
  const org = useCurrentOrg();
  if (!org) return null;
  // Keyed so the name field starts over when you switch organizations or reset the demo.
  return <SettingsContent key={`${org.id}:${org.name}`} org={org} />;
}

function SettingsContent({ org }: { org: Organization }) {
  const { members, apiKeys } = useOrgData();
  const { renameOrg, resetDemo } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(org.name);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const trimmed = name.trim();
  const dirty = trimmed !== org.name;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed) return setError("Name the organization.");
    if (!dirty) return;
    renameOrg(org.id, trimmed);
  };

  const reset = () => {
    resetDemo();
    setResetting(false);
    toast({ title: "Demo reset", description: "The sample organizations, runs and balances are back.", status: "success" });
    if (!SEED_ORGS.includes(org.id)) navigate("/acme/settings");
  };

  return (
    <Page title="Settings" description="The name and details of this organization." width="narrow">
      <form onSubmit={submit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle as="h2">Organization</CardTitle>
            <CardDescription>Members see it in the sidebar. Links use the ID, so they keep working.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-end gap-3">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground"
            >
              {initial(trimmed || org.name)}
            </span>
            <Input
              label="Name"
              value={name}
              onChange={(value) => {
                setName(value);
                setError(null);
              }}
              error={error ?? undefined}
              className="min-w-0 flex-1"
            />
          </CardContent>
          <CardFooter className="justify-end gap-2 border-t border-border pt-4">
            {dirty ? (
              <Button variant="ghost" size="sm" onClick={() => setName(org.name)}>
                Discard
              </Button>
            ) : null}
            <Button type="submit" size="sm" disabled={!dirty}>
              Rename
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Details</CardTitle>
          <CardDescription>Use the ID when you call the API or ask for support.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 bg-background px-4 py-3 sm:col-span-2">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Organization ID</span>
                <span className="truncate font-mono text-sm text-foreground">{org.id}</span>
              </div>
              <CopyButton value={org.id} label="Copy" copiedLabel="Organization ID copied" variant="ghost" />
            </div>
            <div className="flex flex-col gap-0.5 bg-background px-4 py-3">
              <span className="text-xs text-muted-foreground">Created on</span>
              <span className="text-sm text-foreground">{org.created}</span>
            </div>
            <div className="flex flex-col gap-0.5 bg-background px-4 py-3">
              <span className="text-xs text-muted-foreground">Shared with</span>
              <span className="text-sm text-foreground">
                {members.length} {members.length === 1 ? "member" : "members"} · {apiKeys.length}{" "}
                {apiKeys.length === 1 ? "API key" : "API keys"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Reset demo</CardTitle>
          <CardDescription>
            Restore the sample organizations, experiments, runs and balances. Everything you changed this session is lost.
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={() => setResetting(true)}>
              <RotateCcw aria-hidden="true" className="size-3.5" /> Reset demo
            </Button>
          </CardAction>
        </CardHeader>
      </Card>

      <ConfirmModal
        open={resetting}
        onOpenChange={setResetting}
        title="Reset the demo?"
        description="Every organization goes back to its sample data. Organizations, keys, members and runs you added are removed."
        confirmLabel="Reset demo"
        onConfirm={reset}
      />
    </Page>
  );
}
