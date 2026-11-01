import { useEffect, useMemo, useState, type FormEvent } from "react";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { Page } from "@/app/page-layout";
import { CodeBlock } from "@/components/agents/code-block";
import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from "@/components/motion/alert";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button/base";
import {
  CenterMorphModal,
  CenterMorphModalClose,
  CenterMorphModalContent,
} from "@/components/motion/center-morph-modal";
import { Input } from "@/components/motion/input";
import { Table, type TableColumn } from "@/components/motion/table";
import { useOrgData, useStore, type ApiKey } from "@/data";
import {
  ConfirmModal,
  CopyButton,
  EmptyState,
  ModalHeading,
  ROW_HEIGHT,
  RowMenu,
  dateValue,
  tableHeight,
  useModalTarget,
} from "./shared";

export function ApiKeys() {
  const { org, orgId, apiKeys } = useOrgData();
  const { createKey, revokeKey } = useStore();
  const [creating, setCreating] = useState(false);
  const revoking = useModalTarget<ApiKey>();
  const blocked = Boolean(org?.blocked);

  const columns = useMemo<TableColumn<ApiKey>[]>(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        cell: (key) => (
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
              <KeyRound aria-hidden="true" className="size-3.5" />
            </span>
            <span className="truncate font-medium">{key.name}</span>
          </span>
        ),
      },
      {
        key: "secret",
        header: "Key",
        width: "200px",
        cell: (key) => (
          <span className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">trk_••••••••</span>
            {key.secret ? (
              <AnimatedBadge status="success" size="sm" showIcon={false}>
                Shown once
              </AnimatedBadge>
            ) : null}
          </span>
        ),
      },
      {
        key: "created",
        header: "Created",
        sortable: true,
        width: "140px",
        sortValue: (key) => dateValue(key.created),
        cell: (key) => <span className="text-muted-foreground">{key.created}</span>,
      },
      {
        key: "lastUsed",
        header: "Last used",
        width: "140px",
        cell: (key) =>
          key.lastUsed === "Never" ? (
            <AnimatedBadge status="neutral" size="sm" showIcon={false}>
              Never
            </AnimatedBadge>
          ) : (
            <span className="text-muted-foreground">{key.lastUsed}</span>
          ),
      },
      {
        key: "actions",
        header: <span className="sr-only">Actions</span>,
        align: "right",
        width: "72px",
        cell: (key) => (
          <RowMenu
            label={`Actions for ${key.name}`}
            items={[{ label: "Revoke key", icon: Trash2, onSelect: () => revoking.show(key) }]}
          />
        ),
      },
    ],
    [revoking.show],
  );

  const newKeyButton = (
    <Button size="sm" onClick={() => setCreating(true)} disabled={blocked}>
      <Plus aria-hidden="true" className="size-4" /> New API key
    </Button>
  );

  return (
    <Page
      title="API keys"
      description="Your code and CI use them to start runs for this organization."
      actions={newKeyButton}
    >
      {blocked ? (
        <Alert variant="destructive">
          <AlertIcon />
          <AlertContent>
            <AlertTitle>This organization is blocked</AlertTitle>
            <AlertDescription>Its new runs are refused, so you can't create API keys until it's unblocked.</AlertDescription>
          </AlertContent>
        </Alert>
      ) : null}

      {apiKeys.length === 0 ? (
        <EmptyState
          title="Create your first API key"
          action={blocked ? null : newKeyButton}
        >
          Create one for each place that calls the API, like CI or staging.
        </EmptyState>
      ) : (
        <Table
          data={apiKeys}
          columns={columns}
          getRowId={(key) => key.id}
          rowHeight={ROW_HEIGHT}
          height={tableHeight(apiKeys.length)}
          className="rounded-2xl"
        />
      )}

      <CreateKeyModal
        open={creating}
        onOpenChange={setCreating}
        taken={apiKeys.map((key) => key.name.toLowerCase())}
        onCreate={(name) => createKey(orgId, name)}
      />

      <ConfirmModal
        open={revoking.open}
        onOpenChange={revoking.setOpen}
        title={`Revoke ${revoking.target?.name ?? "this key"}?`}
        description="Anything still using it stops working right away. This can't be undone."
        confirmLabel="Revoke key"
        onConfirm={() => {
          if (revoking.target) revokeKey(revoking.target.id);
          revoking.setOpen(false);
        }}
      />
    </Page>
  );
}

function CreateKeyModal({
  open,
  onOpenChange,
  taken,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taken: string[];
  onCreate: (name: string) => string;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; secret: string } | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setError(null);
      setCreated(null);
    }
  }, [open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Name the key after where it's used.");
    if (taken.includes(trimmed.toLowerCase())) return setError(`A key named ${trimmed} already exists.`);
    setCreated({ name: trimmed, secret: onCreate(trimmed) });
  };

  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent
        ariaLabel={created ? "API key created" : "Create an API key"}
        dismissible={!created}
        className="max-w-md"
      >
        {created ? (
          <div className="flex flex-col gap-5 p-6">
            <ModalHeading
              title="API key created"
              description="This is the only time it's shown. Copy it now and keep it somewhere safe, like your CI's secrets."
            />
            <CodeBlock code={created.secret} language="text" filename={created.name} showLineNumbers={false} />
            <div className="flex justify-end gap-2">
              <CopyButton value={created.secret} label="Copy key" copiedLabel="API key copied" />
              <CenterMorphModalClose>
                <Button size="sm">Done</Button>
              </CenterMorphModalClose>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-5 p-6">
            <ModalHeading
              title="Create an API key"
              description="Anything that holds it can act for this organization through the API."
            />
            <div className="flex flex-col gap-1.5">
              <Input
                label="Name"
                placeholder="ci-staging"
                value={name}
                onChange={(value) => {
                  setName(value);
                  setError(null);
                }}
                error={error ?? undefined}
                autoFocus
              />
              {error ? null : <p className="px-1 text-xs text-muted-foreground">Where it's used, like CI or staging.</p>}
            </div>
            <div className="flex justify-end gap-2">
              <CenterMorphModalClose>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
              </CenterMorphModalClose>
              <Button type="submit" size="sm">
                Create
              </Button>
            </div>
          </form>
        )}
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
}
