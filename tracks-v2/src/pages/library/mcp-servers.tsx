import { useId, useState } from "react";
import { Copy, KeyRound, Link2, PanelRight, Power, Server, Trash2 } from "lucide-react";
import { Page } from "@/app/page-layout";
import { CodeBlock } from "@/components/agents/code-block";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button/base";
import { CARD_TARGET_CLASS, Card, CardContent } from "@/components/motion/card";
import { Input } from "@/components/motion/input";
import { RadioGroup, RadioGroupItem } from "@/components/motion/radio";
import {
  MorphSelect,
  MorphSelectContent,
  MorphSelectItem,
  MorphSelectTrigger,
  MorphSelectValue,
} from "@/components/motion/select-morph";
import { Switch } from "@/components/motion/switch";
import type { TableColumn } from "@/components/motion/table";
import { Tooltip } from "@/components/motion/tooltip";
import { useOrgData, useStore, type McpAuth, type McpServer } from "@/data";
import {
  ACTIONS_COLUMN,
  AddButton,
  ConfirmModal,
  DetailDrawer,
  DetailList,
  DetailSection,
  FieldHint,
  FormModal,
  LibraryBody,
  LibraryEmpty,
  LibraryTable,
  LibraryToolbar,
  NameCell,
  RowActions,
  matches,
  plural,
  useCopy,
  useRecord,
  useResetOnOpen,
} from "./shared";

const DESCRIPTION = "Give the agent access to your MCP server.";
const NAME_RULE = /^[A-Za-z0-9_-]{1,64}$/;
const NAME_HINT = "Use up to 64 letters, digits, - or _, with no spaces.";

const AUTH_OPTIONS: { value: McpAuth; description: string }[] = [
  { value: "Bearer token", description: "The server needs a token." },
  { value: "Connection", description: "Uses the organization's connection." },
];

type StatusFilter = "all" | "connected" | "disconnected";

function serverConfig(server: McpServer) {
  const entry: Record<string, unknown> = { type: "http", url: server.url };
  if (server.auth === "Bearer token") entry.headers = { Authorization: "Bearer <token>" };
  return JSON.stringify({ mcpServers: { [server.name]: entry } }, null, 2);
}

function AuthBadge({ auth }: { auth: McpAuth }) {
  return (
    <AnimatedBadge
      status="neutral"
      size="sm"
      icon={auth === "Bearer token" ? <KeyRound className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
    >
      {auth}
    </AnimatedBadge>
  );
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <AnimatedBadge status={connected ? "success" : "neutral"} size="sm">
      {connected ? "Connected" : "Not connected"}
    </AnimatedBadge>
  );
}

export function McpServers() {
  const { orgId, mcpServers } = useOrgData();
  const { addMcp, toggleMcp, removeMcp, setNotice } = useStore();
  const copy = useCopy();
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const details = useRecord(mcpServers);
  const removal = useRecord(mcpServers);

  const toggle = (server: McpServer) => {
    toggleMcp(server.id);
    setNotice(server.connected ? `${server.name} disconnected.` : `${server.name} connected.`);
  };

  const connectedCount = mcpServers.filter((server) => server.connected).length;
  const rows = mcpServers.filter(
    (server) =>
      matches(query, server.name, server.url, server.auth) &&
      (status === "all" || server.connected === (status === "connected")),
  );

  const columns: TableColumn<McpServer>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (server) => (
        <NameCell
          icon={Server}
          name={server.name}
          detail={<span className="font-mono">{server.url}</span>}
          onOpen={() => details.show(server.id)}
        />
      ),
    },
    { key: "auth", header: "Authentication", width: "170px", sortable: true, cell: (server) => <AuthBadge auth={server.auth} /> },
    {
      key: "connected",
      header: "Connection",
      width: "210px",
      sortable: true,
      sortValue: (server) => (server.connected ? 0 : 1),
      cell: (server) => (
        <div className="flex items-center gap-3">
          <Tooltip content={server.connected ? "Disconnect" : "Connect"}>
            <span className="inline-flex">
              <Switch
                checked={server.connected}
                onCheckedChange={() => toggle(server)}
                ariaLabel={`${server.name} connection`}
              />
            </span>
          </Tooltip>
          <ConnectionBadge connected={server.connected} />
        </div>
      ),
    },
    {
      ...ACTIONS_COLUMN,
      cell: (server) => (
        <RowActions
          name={server.name}
          actions={[
            { label: "View details", icon: PanelRight, onSelect: () => details.show(server.id) },
            { label: server.connected ? "Disconnect" : "Connect", icon: Power, onSelect: () => toggle(server) },
            { label: "Copy URL", icon: Copy, onSelect: () => copy(server.url, "Server URL") },
            { label: "Remove", icon: Trash2, destructive: true, separated: true, onSelect: () => removal.show(server.id) },
          ]}
        />
      ),
    },
  ];

  const open = details.item;
  const removing = removal.item;
  const noMatches = query.trim()
    ? `No MCP servers match “${query.trim()}”.`
    : status === "connected"
      ? "No MCP server is connected."
      : "Every MCP server is connected.";

  return (
    <Page
      title="MCP servers"
      description={DESCRIPTION}
      actions={mcpServers.length ? <AddButton label="Add MCP server" onClick={() => setAdding(true)} /> : null}
    >
      {mcpServers.length === 0 ? (
        <LibraryEmpty
          icon={Server}
          title="Add your first MCP server"
          description={DESCRIPTION}
          actionLabel="Add MCP server"
          onAction={() => setAdding(true)}
        />
      ) : (
        <LibraryBody>
          <LibraryToolbar
            query={query}
            onQueryChange={setQuery}
            placeholder="Search MCP servers"
            summary={`${plural(mcpServers.length, "server")} · ${connectedCount} connected`}
          >
            <MorphSelect value={status} onValueChange={(value) => setStatus(value as StatusFilter)} className="w-44">
              <MorphSelectTrigger>
                <MorphSelectValue placeholder="Connection" />
              </MorphSelectTrigger>
              <MorphSelectContent>
                <MorphSelectItem value="all">All servers</MorphSelectItem>
                <MorphSelectItem value="connected">Connected</MorphSelectItem>
                <MorphSelectItem value="disconnected">Not connected</MorphSelectItem>
              </MorphSelectContent>
            </MorphSelect>
          </LibraryToolbar>
          <LibraryTable rows={rows} columns={columns} noMatches={noMatches} />
        </LibraryBody>
      )}

      <DetailDrawer
        open={details.open}
        onOpenChange={(next) => (next ? null : details.hide())}
        icon={Server}
        title={open?.name ?? ""}
        subtitle={<span className="font-mono text-xs">{open?.url}</span>}
        footer={
          open ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  details.hide();
                  removal.show(open.id);
                }}
              >
                <Trash2 aria-hidden="true" className="size-3.5" />
                Remove
              </Button>
              <Button variant="secondary" size="sm" onClick={details.hide}>
                Close
              </Button>
            </>
          ) : null
        }
      >
        {open ? (
          <>
            <DetailList
              items={[
                { label: "Authentication", value: <AuthBadge auth={open.auth} /> },
                {
                  label: "Connection",
                  value: (
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={open.connected}
                        onCheckedChange={() => toggle(open)}
                        ariaLabel={`${open.name} connection`}
                      />
                      <ConnectionBadge connected={open.connected} />
                    </div>
                  ),
                },
              ]}
            />
            <DetailSection
              title="Configuration"
              description={
                open.connected
                  ? "What agents receive in every new run."
                  : "Agents receive this once the server is connected."
              }
            >
              <CodeBlock code={serverConfig(open)} language="json" filename="mcp.json" />
            </DetailSection>
          </>
        ) : null}
      </DetailDrawer>

      <AddMcpModal
        open={adding}
        onOpenChange={setAdding}
        existing={mcpServers}
        onAdd={(input) => {
          addMcp(orgId, input);
          setAdding(false);
        }}
      />

      <ConfirmModal
        open={removal.open}
        onOpenChange={(next) => (next ? null : removal.hide())}
        title="Remove MCP server"
        confirmLabel="Remove MCP server"
        onConfirm={() => {
          if (removing) removeMcp(removing.id);
          removal.hide();
        }}
      >
        <p>
          Remove <span className="font-medium text-foreground">{removing?.name}</span> from the library? Agents lose
          access to its tools in new runs.
        </p>
      </ConfirmModal>
    </Page>
  );
}

function AddMcpModal({
  open,
  onOpenChange,
  existing,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: McpServer[];
  onAdd: (input: { name: string; url: string; auth: McpAuth }) => void;
}) {
  const authLabel = useId();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [auth, setAuth] = useState<McpAuth>("Bearer token");
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});

  useResetOnOpen(open, () => {
    setName("");
    setUrl("");
    setAuth("Bearer token");
    setErrors({});
  });

  const submit = () => {
    const next: typeof errors = {};
    const cleanName = name.trim();
    if (!NAME_RULE.test(cleanName)) next.name = NAME_HINT;
    else if (existing.some((server) => server.name.toLowerCase() === cleanName.toLowerCase()))
      next.name = "An MCP server with this name already exists.";
    let parsed: URL | null = null;
    try {
      parsed = new URL(url.trim());
    } catch {
      parsed = null;
    }
    if (!parsed || !/^https?:$/.test(parsed.protocol)) next.url = "Enter the server's URL, starting with https://";
    setErrors(next);
    if (Object.keys(next).length) return;
    onAdd({ name: cleanName, url: url.trim(), auth });
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add MCP server"
      description="An MCP server reached with a Bearer token needs one. A connection uses the organization."
      submitLabel="Add MCP server"
      onSubmit={submit}
    >
      <Input
        label="Name"
        value={name}
        onChange={(value) => {
          setName(value);
          setErrors((current) => ({ ...current, name: undefined }));
        }}
        placeholder="catalog"
        error={errors.name}
        autoComplete="off"
        autoFocus
      />
      {errors.name ? null : <FieldHint>{NAME_HINT}</FieldHint>}
      <Input
        label="URL"
        type="url"
        value={url}
        onChange={(value) => {
          setUrl(value);
          setErrors((current) => ({ ...current, url: undefined }));
        }}
        placeholder="https://"
        error={errors.url}
        autoComplete="off"
        classNames={{ input: "font-mono text-sm" }}
      />
      <div className="flex flex-col gap-1.5">
        <span id={authLabel} className="px-1 text-sm font-medium text-foreground">
          Authentication
        </span>
        <RadioGroup
          value={auth}
          onValueChange={(value) => setAuth(value as McpAuth)}
          aria-labelledby={authLabel}
          className="grid gap-3 sm:grid-cols-2"
        >
          {AUTH_OPTIONS.map((option) => (
            <Card key={option.value} size="compact" interactive selected={auth === option.value}>
              <CardContent>
                <RadioGroupItem
                  value={option.value}
                  label={option.value}
                  description={option.description}
                  className={CARD_TARGET_CLASS}
                />
              </CardContent>
            </Card>
          ))}
        </RadioGroup>
      </div>
    </FormModal>
  );
}
