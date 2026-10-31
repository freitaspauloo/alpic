import { useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { money, useStore } from "./store";
import { Dialog, Icon, Logo } from "./ui";

const experience = [
  { label: "Experiments", to: "experiments", icon: "flask" },
  { label: "Runs", to: "runs", icon: "play" },
  { label: "Library", to: "library/repositories", icon: "book" },
];

const library = [
  { label: "Repositories", to: "library/repositories" },
  { label: "Skills", to: "library/skills" },
  { label: "MCP servers", to: "library/mcp-servers" },
  { label: "Command-line tools", to: "library/command-line-tools" },
];

const account = [
  { label: "Members", to: "members", icon: "users" },
  { label: "API keys", to: "api-keys", icon: "key" },
  { label: "Billing", to: "billing", icon: "card" },
  { label: "Settings", to: "settings", icon: "settings" },
];

export function Shell({ children }: { children: ReactNode }) {
  const store = useStore();
  const { org = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const organization = store.organizations.find((item) => item.id === org);
  const base = `/${org}`;
  const libraryOpen = location.pathname.includes("/library");

  const crumbs = breadcrumb(location.pathname, org, store);

  return (
    <div className={`shell${collapsed ? " collapsed" : ""}${navOpen ? " nav-open" : ""}`}>
      {navOpen ? <button className="scrim" aria-label="Close navigation" onClick={() => setNavOpen(false)} /> : null}
      <aside className="sidebar">
        <div className="side-head">
          <Logo to="/" />
          <button className="icon-btn" style={{ marginLeft: "auto" }} aria-label="Collapse sidebar" onClick={() => setCollapsed((value) => !value)}>
            <Icon name="panel" />
          </button>
        </div>
        <div className="org-wrap">
          <button className="org-btn" aria-expanded={orgOpen} onClick={() => setOrgOpen((value) => !value)}>
            <strong style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{organization?.name ?? "Organization"}</strong>
            <span aria-hidden="true">▾</span>
          </button>
          {orgOpen ? (
            <div className="menu" role="menu">
              {store.organizations.map((item) => (
                <button
                  key={item.id}
                  className="menu-item"
                  role="menuitem"
                  onClick={() => {
                    setOrgOpen(false);
                    navigate(`/${item.id}/experiments`);
                  }}
                >
                  <span style={{ flex: 1 }}>{item.name}</span>
                  {item.id === org ? <Icon name="check" /> : null}
                </button>
              ))}
              <button
                className="menu-item"
                onClick={() => {
                  setOrgOpen(false);
                  setCreating(true);
                }}
              >
                <Icon name="plus" /> Create an organization
              </button>
              <div className="menu-note">Invitations</div>
              <Link className="menu-item" to="/invitations/northwind" onClick={() => setOrgOpen(false)} style={{ textDecoration: "none" }}>
                Northwind · from Mina Chen
              </Link>
            </div>
          ) : null}
        </div>
        <nav className="side-scroll" aria-label="Main" onClick={() => setNavOpen(false)}>
          <div className="nav-label">Readiness</div>
          <div className="nav-label">Experience</div>
          {experience.map((item) => (
            <NavLink key={item.to} className={({ isActive }) => `nav-link${isActive && item.to !== "library/repositories" ? " active" : ""}`} to={`${base}/${item.to}`}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          {libraryOpen
            ? library.map((item) => (
                <NavLink key={item.to} className={({ isActive }) => `nav-sub${isActive ? " active" : ""}`} to={`${base}/${item.to}`}>
                  {item.label}
                </NavLink>
              ))
            : null}
          <div className="nav-label">Analytics</div>
          <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to={`${base}/analytics`}>
            <Icon name="chart" />
            <span>Analytics</span>
          </NavLink>
          <div style={{ height: 12 }} />
          {account.map((item) => (
            <NavLink key={item.to} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to={`${base}/${item.to}`}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-foot" style={{ position: "relative" }}>
          <button className="org-btn" style={{ border: 0 }} onClick={() => setUserOpen((value) => !value)}>
            <span className="user">{store.you.name.slice(0, 1)}</span>
            <span className="who">
              <strong>{store.you.name}</strong>
              <span>User profile</span>
            </span>
          </button>
          {userOpen ? (
            <div className="menu" style={{ top: "auto", bottom: "100%" }}>
              <button
                className="menu-item"
                onClick={() => {
                  store.setTheme(store.theme === "dark" ? "light" : "dark");
                  setUserOpen(false);
                }}
              >
                <Icon name={store.theme === "dark" ? "sun" : "moon"} /> Theme
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  setUserOpen(false);
                  navigate("/");
                }}
              >
                <Icon name="out" /> Sign out
              </button>
            </div>
          ) : null}
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="icon-btn mobile-only" aria-label="Open navigation" onClick={() => setNavOpen(true)}>
            <Icon name="menu" />
          </button>
          <nav className="crumbs" aria-label="Breadcrumb">
            {crumbs.map((crumb, index) => (
              <span key={crumb.label} style={{ display: "contents" }}>
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {crumb.to && index < crumbs.length - 1 ? <Link to={crumb.to}>{crumb.label}</Link> : <strong>{crumb.label}</strong>}
              </span>
            ))}
          </nav>
          {organization ? (
            <Link className="balance" to={`${base}/billing`}>
              <span>Balance </span>
              {money(organization.balanceCents)}
            </Link>
          ) : null}
        </header>
        {store.notice ? (
          <div className="page" style={{ paddingBottom: 0 }}>
            <div className="alert" style={{ background: "color-mix(in oklab, var(--success) 12%, transparent)" }}>
              <span>{store.notice}</span>{" "}
              <button className="menu-btn" onClick={() => store.setNotice(null)}>
                Dismiss
              </button>
            </div>
          </div>
        ) : null}
        {children}
      </div>
      {creating ? (
        <Dialog title="Create an organization" description="Members see this name in the sidebar. The link uses an id derived from it." onClose={() => setCreating(false)}>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!orgName.trim()) return;
              const next = store.createOrg(orgName.trim());
              setOrgName("");
              setCreating(false);
              navigate(`/${next}/experiments`);
            }}
          >
            <div className="field">
              <label htmlFor="org-name">Name</label>
              <input id="org-name" value={orgName} onChange={(event) => setOrgName(event.target.value)} autoFocus required />
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
    </div>
  );
}

function breadcrumb(pathname: string, org: string, store: ReturnType<typeof useStore>) {
  const rest = pathname.replace(`/${org}/`, "");
  const base = `/${org}`;
  const experiment = store.experiments.find((item) => pathname.includes(`/experiments/${item.id}`));
  const run = store.runs.find((item) => pathname.endsWith(`/runs/${item.id}`));
  if (rest.startsWith("experiments/") && rest.endsWith("/edit") && experiment) {
    return [
      { label: "Experiments", to: `${base}/experiments` },
      { label: experiment.name, to: `${base}/experiments/${experiment.id}` },
      { label: "Edit" },
    ];
  }
  if (experiment && rest.startsWith("experiments/")) {
    return [
      { label: "Experiments", to: `${base}/experiments` },
      { label: experiment.name },
    ];
  }
  if (rest === "runs/new") return [{ label: "Runs", to: `${base}/runs` }, { label: "New run" }];
  if (run) return [{ label: "Runs", to: `${base}/runs` }, { label: run.id }];
  const titles: Record<string, string> = {
    experiments: "Experiments",
    runs: "Runs",
    "library/repositories": "Repositories",
    "library/skills": "Skills",
    "library/mcp-servers": "MCP servers",
    "library/command-line-tools": "Command-line tools",
    analytics: "Analytics",
    "analytics/sources": "Sources",
    "analytics/traffic": "Traffic",
    "api-keys": "API keys",
    billing: "Billing",
    members: "Members",
    settings: "Settings",
  };
  if (rest.startsWith("analytics/")) {
    return [
      { label: "Analytics", to: `${base}/analytics` },
      { label: titles[rest] ?? rest },
    ];
  }
  if (rest.startsWith("library/")) {
    return [
      { label: "Library", to: `${base}/library/repositories` },
      { label: titles[rest] ?? rest },
    ];
  }
  return [{ label: titles[rest] ?? "Tracks" }];
}
