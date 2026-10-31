import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Clock3,
  LayoutGrid,
  Library,
  PanelLeft,
  Play,
  SquarePen,
} from "lucide-react";
import {
  AISidebar,
  type SidebarResource,
} from "@/components/agents/ai-sidebar";
import {
  AnimatedSidebar,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupContent,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarHeader,
  AnimatedSidebarInset,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  AnimatedSidebarProvider,
  AnimatedSidebarRail,
  AnimatedSidebarTrigger,
  useAnimatedSidebar,
} from "@/components/motion/animated-sidebar";
import { money, useStore } from "./store";
import { Dialog, Icon, Logo } from "./ui";
import { activeIdFromPath, buildTree, reconcile, routeFor } from "./workspace-tree";

const actions = [
  { label: "New run", icon: SquarePen, to: "runs/new" },
  { label: "Experiments", icon: LayoutGrid, to: "experiments" },
  { label: "Runs", icon: Play, to: "runs" },
  { label: "Library", icon: Library, to: "library/repositories" },
  { label: "Analytics", icon: Clock3, to: "analytics" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  return (
    <AnimatedSidebarProvider className="h-dvh min-h-0 bg-background">
      <WorkspaceSidebar />
      <WorkspaceInset>{children}</WorkspaceInset>
    </AnimatedSidebarProvider>
  );
}

function WorkspaceSidebar() {
  const store = useStore();
  const { org = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const sidebar = useAnimatedSidebar();
  const organization = store.organizations.find((item) => item.id === org);
  const [orgOpen, setOrgOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [items, setItems] = useState<SidebarResource[]>(() => buildTree(store, org));
  const active = activeIdFromPath(location.pathname, org, store);
  const signature = JSON.stringify(buildTree(store, org));

  useEffect(() => {
    const fresh = JSON.parse(signature) as SidebarResource[];
    setItems((current) => {
      const sameOrg = current.some((item) => item.id === "experiments") && fresh.some((item) => item.label === "Experiments");
      if (!sameOrg) return fresh;
      return reconcile(current, fresh);
    });
  }, [signature]);

  function open(path: string) {
    navigate(`/${org}/${path}`);
    if (sidebar.isMobile) sidebar.setOpenMobile(false);
  }

  return (
    <AnimatedSidebar ariaLabel="Workspace resources" collapsible="offcanvas" panelClassName="bg-background">
      <AnimatedSidebarHeader className="gap-3 px-3 py-3">
        <Logo to="/" />
        <div className="relative">
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
      </AnimatedSidebarHeader>
      <AnimatedSidebarContent className="gap-4 overflow-hidden px-2 py-2">
        <AnimatedSidebarGroup className="shrink-0 px-1 py-0">
          <AnimatedSidebarGroupContent>
            <AnimatedSidebarMenu className="gap-1">
              {actions.map(({ label, icon: ActionIcon, to }) => (
                <AnimatedSidebarMenuItem key={label}>
                  <AnimatedSidebarMenuButton
                    icon={<ActionIcon className="size-4" />}
                    isActive={location.pathname === `/${org}/${to}`}
                    onSelect={() => open(to)}
                    className="font-normal text-foreground"
                  >
                    {label}
                  </AnimatedSidebarMenuButton>
                </AnimatedSidebarMenuItem>
              ))}
            </AnimatedSidebarMenu>
          </AnimatedSidebarGroupContent>
        </AnimatedSidebarGroup>
        <AnimatedSidebarGroup className="min-h-0 flex-1 px-1 py-0">
          <AnimatedSidebarGroupLabel className="mb-1 h-8 px-2 text-xs font-medium normal-case tracking-normal">
            Projects
          </AnimatedSidebarGroupLabel>
          <AnimatedSidebarGroupContent className="relative min-h-0 flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto overscroll-contain pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <AISidebar
                items={items}
                activeId={active}
                defaultExpandedIds={["experiments", "runs", "library", "analytics"]}
                ariaLabel="Tracks resources"
                onActiveChange={(id) => {
                  const path = routeFor(id, store);
                  if (path) open(path);
                }}
                onItemsChange={setItems}
                onRename={(item, label) => {
                  const experiment = store.experiments.find((entry) => entry.id === item.id);
                  if (experiment) store.updateExperiment({ ...experiment, name: label });
                }}
                onMove={async () => {
                  await new Promise((resolve) => window.setTimeout(resolve, 450));
                }}
              />
            </div>
          </AnimatedSidebarGroupContent>
        </AnimatedSidebarGroup>
      </AnimatedSidebarContent>
      <AnimatedSidebarFooter className="relative p-2">
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
      </AnimatedSidebarFooter>
      <AnimatedSidebarRail />
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
    </AnimatedSidebar>
  );
}

function WorkspaceInset({ children }: { children: ReactNode }) {
  const store = useStore();
  const { org = "" } = useParams();
  const location = useLocation();
  const organization = store.organizations.find((item) => item.id === org);
  const crumbs = breadcrumb(location.pathname, org, store);

  return (
    <AnimatedSidebarInset className="min-h-0 h-dvh bg-background">
      <header className="topbar">
        <AnimatedSidebarTrigger className="-ml-1 text-muted-foreground" aria-label="Toggle sidebar">
          <PanelLeft className="size-4" />
        </AnimatedSidebarTrigger>
        <nav className="crumbs" aria-label="Breadcrumb">
          {crumbs.map((crumb, index) => (
            <span key={crumb.label} style={{ display: "contents" }}>
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {crumb.to && index < crumbs.length - 1 ? <Link to={crumb.to}>{crumb.label}</Link> : <strong>{crumb.label}</strong>}
            </span>
          ))}
        </nav>
        {organization ? (
          <Link className="balance" to={`/${org}/billing`}>
            <span>Balance </span>
            {money(organization.balanceCents)}
          </Link>
        ) : null}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
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
    </AnimatedSidebarInset>
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
  if (run) return [{ label: "Runs", to: `${base}/runs` }, { label: run.scenario ?? run.id }];
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
