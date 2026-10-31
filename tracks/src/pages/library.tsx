import { useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useStore, type McpServer } from "../store";
import { Dialog, Empty, Page, Status } from "../ui";

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
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          Add repository
        </button>
      }
    >
      {rows.length === 0 ? (
        <div className="card">
          <Empty title="Add your first repository">
            <p>Start your variants' runs from codebases representative of your users.</p>
          </Empty>
        </div>
      ) : (
        <LibraryTable
          headers={["Name", "URL", "Ref", ""]}
          rows={rows.map((row) => [
            row.name,
            row.url,
            row.ref,
            <button key="remove" className="menu-btn" onClick={() => store.removeRepository(row.id)}>
              Remove
            </button>,
          ])}
        />
      )}
      {open ? (
        <Dialog title="Add repository" description="Enter a public GitHub repository URL, like https://github.com/acme/app" onClose={() => setOpen(false)}>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              store.addRepository(org, { name: name || url.replace("https://github.com/", ""), url, ref: refName });
              setOpen(false);
              setName("");
              setUrl("");
            }}
          >
            <div className="field">
              <label htmlFor="repo-name">Name</label>
              <input id="repo-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="acme/app" required />
            </div>
            <div className="field">
              <label htmlFor="repo-url">URL</label>
              <input id="repo-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://github.com/acme/app" required />
            </div>
            <div className="field">
              <label htmlFor="repo-ref">Ref</label>
              <input id="repo-ref" value={refName} onChange={(event) => setRefName(event.target.value)} placeholder="main" required />
            </div>
            <DialogActions onClose={() => setOpen(false)} label="Add repository" />
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
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          Add skill
        </button>
      }
    >
      {rows.length === 0 ? (
        <div className="card">
          <Empty title="Add your first skill">
            <p>Give the agent instructions on how to interact with your product.</p>
          </Empty>
        </div>
      ) : (
        <LibraryTable
          headers={["Name", "Description", "Source", "Files", ""]}
          rows={rows.map((row) => [
            <button key="name" className="menu-btn" style={{ fontWeight: 600, color: "var(--fg)" }} onClick={() => setView(row.id)}>
              {row.name}
            </button>,
            row.description,
            row.source,
            String(row.files),
            <button key="remove" className="menu-btn" onClick={() => store.removeSkill(row.id)}>
              Remove
            </button>,
          ])}
        />
      )}
      {open ? (
        <Dialog title="Add skill" description="Uploaded as SKILL.md. You can refresh a GitHub skill later." onClose={() => setOpen(false)}>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              store.addSkill(org, { name, description });
              setOpen(false);
              setName("");
              setDescription("");
            }}
          >
            <div className="field">
              <label htmlFor="skill-name">Name</label>
              <input id="skill-name" required value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="skill-desc">Description</label>
              <textarea id="skill-desc" required rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
            <DialogActions onClose={() => setOpen(false)} label="Add skill" />
          </form>
        </Dialog>
      ) : null}
      {skill ? (
        <Dialog title={skill.name} description={skill.description} onClose={() => setView(null)}>
          <div className="subtle" style={{ marginBottom: 8 }}>
            {skill.source} · {skill.files} files
          </div>
          <pre className="prompt">{`# ${skill.name}\n\n${skill.description}\n`}</pre>
          <div className="dialog-actions">
            <button className="btn btn-secondary" onClick={() => setView(null)}>
              Close
            </button>
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
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          Add MCP server
        </button>
      }
    >
      {rows.length === 0 ? (
        <div className="card">
          <Empty title="Add your first MCP server">
            <p>Give the agent access to your MCP server.</p>
          </Empty>
        </div>
      ) : (
        <LibraryTable
          headers={["Name", "URL", "Authentication", "Connection", ""]}
          rows={rows.map((row) => [
            row.name,
            row.url,
            row.auth,
            <button key="conn" className="menu-btn" onClick={() => store.toggleMcp(row.id)}>
              <Status status={row.connected ? "Passed" : "Failed"} />
              <span style={{ marginLeft: 8 }}>{row.connected ? "Connected" : "Not connected"}</span>
            </button>,
            <button key="remove" className="menu-btn" onClick={() => store.removeMcp(row.id)}>
              Remove
            </button>,
          ])}
        />
      )}
      {open ? (
        <Dialog title="Add MCP server" description="An MCP server reached with a Bearer token needs one. A connection uses the organization." onClose={() => setOpen(false)}>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              store.addMcp(org, { name, url, auth });
              setOpen(false);
              setName("");
              setUrl("");
            }}
          >
            <div className="field">
              <label htmlFor="mcp-name">Name</label>
              <input id="mcp-name" required value={name} onChange={(event) => setName(event.target.value)} />
              <span className="hint">Use up to 64 letters, digits, - or _, with no spaces.</span>
            </div>
            <div className="field">
              <label htmlFor="mcp-url">URL</label>
              <input id="mcp-url" required type="url" placeholder="https://" value={url} onChange={(event) => setUrl(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="mcp-auth">Authentication</label>
              <select id="mcp-auth" value={auth} onChange={(event) => setAuth(event.target.value as McpServer["auth"])}>
                <option>Bearer token</option>
                <option>Connection</option>
              </select>
            </div>
            <DialogActions onClose={() => setOpen(false)} label="Add MCP server" />
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
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          Add command-line tool
        </button>
      }
    >
      {rows.length === 0 ? (
        <div className="card">
          <Empty title="Add your first command-line tool">
            <p>Install a program in your runs by adding it to the agent tools.</p>
          </Empty>
        </div>
      ) : (
        <LibraryTable
          headers={["Name", "Install script", ""]}
          rows={rows.map((row) => [
            row.name,
            <code key="script" className="mono">{row.script}</code>,
            <button key="remove" className="menu-btn" onClick={() => store.removeTool(row.id)}>
              Remove
            </button>,
          ])}
        />
      )}
      {open ? (
        <Dialog title="Add command-line tool" description="The install script runs before the agent starts." onClose={() => setOpen(false)}>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              store.addTool(org, { name, script });
              setOpen(false);
              setName("");
              setScript("");
            }}
          >
            <div className="field">
              <label htmlFor="tool-name">Name</label>
              <input id="tool-name" required value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="tool-script">Install script</label>
              <textarea id="tool-script" required rows={4} value={script} onChange={(event) => setScript(event.target.value)} />
            </div>
            <DialogActions onClose={() => setOpen(false)} label="Add command-line tool" />
          </form>
        </Dialog>
      ) : null}
    </Page>
  );
}

function LibraryTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header || "actions"} className={header ? undefined : "num"}>
                {header || "Actions"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={cellIndex === row.length - 1 ? "num" : undefined}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DialogActions({ onClose, label }: { onClose: () => void; label: string }) {
  return (
    <div className="dialog-actions">
      <button className="btn btn-secondary" type="button" onClick={onClose}>
        Cancel
      </button>
      <button className="btn btn-primary" type="submit">
        {label}
      </button>
    </div>
  );
}
