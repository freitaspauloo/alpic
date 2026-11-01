import { useMemo, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import type { TableColumn } from "@/components/motion/table";
import { useStore, type McpServer } from "../store";
import {
  Button,
  Dialog,
  Empty,
  FormActions,
  FormShell,
  MenuButton,
  nativeSelectClassName,
  Page,
  SimpleDataTable,
  Status,
  TextAreaField,
  TextField,
} from "../ui";

export function Repositories() {
  const { org = "" } = useParams();
  const store = useStore();
  const rows = store.repositories.filter((item) => item.orgId === org);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [refName, setRefName] = useState("main");
  return (
    <Page
      title="Repositories"
      description="Start your variants' runs from codebases representative of your users."
      action={
        <Button type="button" onClick={() => setOpen(true)}>
          Add repository
        </Button>
      }
    >
      {rows.length === 0 ? (
        <Empty title="Add your first repository">
          <p>Start your variants' runs from codebases representative of your users.</p>
        </Empty>
      ) : (
        <LibraryTable
          headers={["Name", "URL", "Ref", ""]}
          rows={rows.map((row) => [
            row.name,
            row.url,
            row.ref,
            <MenuButton key="remove" onClick={() => store.removeRepository(row.id)}>
              Remove
            </MenuButton>,
          ])}
        />
      )}
      {open ? (
        <Dialog title="Add repository" description="Enter a public GitHub repository URL, like https://github.com/acme/app" onClose={() => setOpen(false)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              store.addRepository(org, { name: name || url.replace("https://github.com/", ""), url, ref: refName });
              setOpen(false);
              setName("");
              setUrl("");
            }}
          >
            <FormShell>
              <TextField id="repo-name" label="Name" value={name} onChange={setName} placeholder="acme/app" required />
              <TextField id="repo-url" label="URL" value={url} onChange={setUrl} placeholder="https://github.com/acme/app" required />
              <TextField id="repo-ref" label="Ref" value={refName} onChange={setRefName} placeholder="main" required />
              <FormActions onCancel={() => setOpen(false)} submitLabel="Add repository" />
            </FormShell>
          </form>
        </Dialog>
      ) : null}
    </Page>
  );
}

export function Skills() {
  const { org = "" } = useParams();
  const store = useStore();
  const rows = store.skills.filter((item) => item.orgId === org);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [view, setView] = useState<string | null>(null);
  const skill = rows.find((item) => item.id === view);
  return (
    <Page
      title="Skills"
      description="Give the agent instructions on how to interact with your product."
      action={
        <Button type="button" onClick={() => setOpen(true)}>
          Add skill
        </Button>
      }
    >
      {rows.length === 0 ? (
        <Empty title="Add your first skill">
          <p>Give the agent instructions on how to interact with your product.</p>
        </Empty>
      ) : (
        <LibraryTable
          headers={["Name", "Description", "Source", "Files", ""]}
          rows={rows.map((row) => [
            <MenuButton key="name" className="font-semibold text-foreground" onClick={() => setView(row.id)}>
              {row.name}
            </MenuButton>,
            row.description,
            row.source,
            String(row.files),
            <MenuButton key="remove" onClick={() => store.removeSkill(row.id)}>
              Remove
            </MenuButton>,
          ])}
        />
      )}
      {open ? (
        <Dialog title="Add skill" description="Uploaded as SKILL.md. You can refresh a GitHub skill later." onClose={() => setOpen(false)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              store.addSkill(org, { name, description });
              setOpen(false);
              setName("");
              setDescription("");
            }}
          >
            <FormShell>
              <TextField id="skill-name" label="Name" value={name} onChange={setName} required />
              <TextAreaField id="skill-desc" label="Description" value={description} onChange={setDescription} required rows={3} />
              <FormActions onCancel={() => setOpen(false)} submitLabel="Add skill" />
            </FormShell>
          </form>
        </Dialog>
      ) : null}
      {skill ? (
        <Dialog title={skill.name} description={skill.description} onClose={() => setView(null)}>
          <p className="mb-2 text-sm text-muted-foreground">
            {skill.source} · {skill.files} files
          </p>
          <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">{`# ${skill.name}\n\n${skill.description}\n`}</pre>
          <div className="flex justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => setView(null)}>
              Close
            </Button>
          </div>
        </Dialog>
      ) : null}
    </Page>
  );
}

export function McpServers() {
  const { org = "" } = useParams();
  const store = useStore();
  const rows = store.mcpServers.filter((item) => item.orgId === org);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [auth, setAuth] = useState<McpServer["auth"]>("Bearer token");
  return (
    <Page
      title="MCP servers"
      description="Give the agent access to your MCP server."
      action={
        <Button type="button" onClick={() => setOpen(true)}>
          Add MCP server
        </Button>
      }
    >
      {rows.length === 0 ? (
        <Empty title="Add your first MCP server">
          <p>Give the agent access to your MCP server.</p>
        </Empty>
      ) : (
        <LibraryTable
          headers={["Name", "URL", "Authentication", "Connection", ""]}
          rows={rows.map((row) => [
            row.name,
            row.url,
            row.auth,
            <MenuButton key="conn" onClick={() => store.toggleMcp(row.id)}>
              <span className="inline-flex items-center gap-2">
                <Status status={row.connected ? "Passed" : "Failed"} />
                {row.connected ? "Connected" : "Not connected"}
              </span>
            </MenuButton>,
            <MenuButton key="remove" onClick={() => store.removeMcp(row.id)}>
              Remove
            </MenuButton>,
          ])}
        />
      )}
      {open ? (
        <Dialog title="Add MCP server" description="An MCP server reached with a Bearer token needs one. A connection uses the organization." onClose={() => setOpen(false)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              store.addMcp(org, { name, url, auth });
              setOpen(false);
              setName("");
              setUrl("");
            }}
          >
            <FormShell>
              <TextField
                id="mcp-name"
                label="Name"
                value={name}
                onChange={setName}
                required
                hint="Use up to 64 letters, digits, - or _, with no spaces."
              />
              <TextField id="mcp-url" label="URL" type="url" value={url} onChange={setUrl} placeholder="https://" required />
              <label className="grid gap-1.5">
                <span className="text-sm font-medium">Authentication</span>
                <select
                  id="mcp-auth"
                  className={nativeSelectClassName}
                  value={auth}
                  onChange={(event) => setAuth(event.target.value as McpServer["auth"])}
                >
                  <option>Bearer token</option>
                  <option>Connection</option>
                </select>
              </label>
              <FormActions onCancel={() => setOpen(false)} submitLabel="Add MCP server" />
            </FormShell>
          </form>
        </Dialog>
      ) : null}
    </Page>
  );
}

export function CommandLineTools() {
  const { org = "" } = useParams();
  const store = useStore();
  const rows = store.tools.filter((item) => item.orgId === org);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [script, setScript] = useState("");
  return (
    <Page
      title="Command-line tools"
      description="Install a program in your runs by adding it to the agent tools."
      action={
        <Button type="button" onClick={() => setOpen(true)}>
          Add command-line tool
        </Button>
      }
    >
      {rows.length === 0 ? (
        <Empty title="Add your first command-line tool">
          <p>Install a program in your runs by adding it to the agent tools.</p>
        </Empty>
      ) : (
        <LibraryTable
          headers={["Name", "Install script", ""]}
          rows={rows.map((row) => [
            row.name,
            <code key="script" className="font-mono text-xs">{row.script}</code>,
            <MenuButton key="remove" onClick={() => store.removeTool(row.id)}>
              Remove
            </MenuButton>,
          ])}
        />
      )}
      {open ? (
        <Dialog title="Add command-line tool" description="The install script runs before the agent starts." onClose={() => setOpen(false)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              store.addTool(org, { name, script });
              setOpen(false);
              setName("");
              setScript("");
            }}
          >
            <FormShell>
              <TextField id="tool-name" label="Name" value={name} onChange={setName} required />
              <TextAreaField id="tool-script" label="Install script" value={script} onChange={setScript} required rows={4} />
              <FormActions onCancel={() => setOpen(false)} submitLabel="Add command-line tool" />
            </FormShell>
          </form>
        </Dialog>
      ) : null}
    </Page>
  );
}

function LibraryTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  const data = useMemo(() => rows.map((cells, index) => ({ id: String(index), cells })), [rows]);
  const columns = useMemo((): TableColumn<{ id: string; cells: ReactNode[] }>[] => {
    return headers.map((header, index) => ({
      key: `col-${index}`,
      header: header || "Actions",
      align: index === headers.length - 1 && !header ? "right" : "left",
      cell: (row) => row.cells[index],
    }));
  }, [headers]);

  return <SimpleDataTable data={data} columns={columns} getRowId={(row) => row.id} />;
}
