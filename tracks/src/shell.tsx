import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ChartLine,
  ChevronDown,
  CreditCard,
  FlaskConical,
  KeyRound,
  Library,
  PanelLeft,
  Settings,
  Users,
} from "lucide-react";
import { AISidebar, type SidebarResource } from "@/components/agents/ai-sidebar";
import { SidebarResizeHandle } from "@/components/app/sidebar-resize-handle";
import {
  AnimatedSidebar,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
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
import {
  Dialog,
  FormActions,
  FormShell,
  Icon,
  InlineAlert,
  MenuButton,
  ShellMenu,
  ShellMenuItem,
  ShellMenuLabel,
  TextField,
  shellMenuTriggerClassName,
} from "./ui";
import { cn } from "@/lib/utils";
import { activeIdFromPath, buildTree, reconcile, routeFor } from "./workspace-tree";

const SIDEBAR_WIDTH_KEY = "tracks-sidebar-width";
const SIDEBAR_WIDTH_DEFAULT = 256;
const SIDEBAR_WIDTH_MIN = 220;
const SIDEBAR_WIDTH_MAX = 420;

const LIBRARY_CHILD_IDS = new Set(["repositories", "skills", "mcp-servers", "command-line-tools"]);

function readStoredSidebarWidth() {
  try {
    const stored = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (stored) {
      const value = Number(stored);
      if (value >= SIDEBAR_WIDTH_MIN && value <= SIDEBAR_WIDTH_MAX) return value;
    }
  } catch {
    /* ignore */
  }
  return SIDEBAR_WIDTH_DEFAULT;
}

const accountLinks = [
  { label: "Members", icon: Users, to: "members" },
  { label: "API keys", icon: KeyRound, to: "api-keys" },
  { label: "Billing", icon: CreditCard, to: "billing" },
  { label: "Settings", icon: Settings, to: "settings" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(readStoredSidebarWidth);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
    } catch {
      /* ignore */
    }
  }, [sidebarWidth]);

  const providerStyle = useMemo(
    () =>
      ({
        "--sidebar-width": `${sidebarWidth}px`,
      }) as CSSProperties,
    [sidebarWidth],
  );

  return (
    <AnimatedSidebarProvider className="h-dvh min-h-0 bg-background" style={providerStyle}>
      <WorkspaceSidebar sidebarWidth={sidebarWidth} onSidebarWidthChange={setSidebarWidth} />
      <WorkspaceInset>{children}</WorkspaceInset>
    </AnimatedSidebarProvider>
  );
}

function WorkspaceSidebar({
  sidebarWidth,
  onSidebarWidthChange,
}: {
  sidebarWidth: number;
  onSidebarWidthChange: (width: number) => void;
}) {
  const store = useStore();
  const { org = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const sidebar = useAnimatedSidebar();
  const collapsed = sidebar.state === "collapsed";
  const organization = store.organizations.find((item) => item.id === org);
  const [orgOpen, setOrgOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [items, setItems] = useState<SidebarResource[]>(() => buildTree(store, org));
  const active = activeIdFromPath(location.pathname, org, store);
  const signature = JSON.stringify(buildTree(store, org));
  const libraryActive = active === "library" || LIBRARY_CHILD_IDS.has(active);
  const analyticsActive =
    location.pathname === `/${org}/analytics` || location.pathname.startsWith(`/${org}/analytics/`);

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

  const orgMenu = (
    <div role="menu">
      {store.organizations.map((item) => (
        <ShellMenuItem
          key={item.id}
          onClick={() => {
            setOrgOpen(false);
            navigate(`/${item.id}/experiments`);
          }}
        >
          <span className="min-w-0 flex-1 truncate">{item.name}</span>
          {item.id === org ? <Icon name="check" /> : null}
        </ShellMenuItem>
      ))}
      <ShellMenuItem
        onClick={() => {
          setOrgOpen(false);
          setCreating(true);
        }}
      >
        <Icon name="plus" /> Create an organization
      </ShellMenuItem>
      <ShellMenuLabel>Invitations</ShellMenuLabel>
      <Link
        className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-muted"
        to="/invitations/northwind"
        onClick={() => setOrgOpen(false)}
      >
        Northwind · from Mina Chen
      </Link>
    </div>
  );

  return (
    <AnimatedSidebar ariaLabel="Workspace resources" collapsible="icon" panelClassName="relative">
      <AnimatedSidebarHeader>
        <div className={cn("flex w-full items-center gap-1", collapsed && "flex-col gap-2")}>
          <ShellMenu
            open={orgOpen}
            onOpenChange={setOrgOpen}
            contentClassName="min-w-[12rem]"
            trigger={
              collapsed ? (
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-xl text-sm font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={organization?.name ?? "Organization"}
                  title={organization?.name ?? "Organization"}
                >
                  {(organization?.name ?? "O").slice(0, 1)}
                </button>
              ) : (
                <button type="button" className={cn(shellMenuTriggerClassName, "flex-1")} aria-expanded={orgOpen}>
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">{organization?.name ?? "Organization"}</span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </button>
              )
            }
          >
            {orgMenu}
          </ShellMenu>
          <AnimatedSidebarTrigger className="text-muted-foreground" aria-label="Toggle sidebar">
            <PanelLeft className="size-4" />
          </AnimatedSidebarTrigger>
        </div>
      </AnimatedSidebarHeader>
      <AnimatedSidebarContent>
        <div className="group-data-[state=expanded]/sidebar:hidden">
          <AnimatedSidebarMenu>
            <AnimatedSidebarMenuItem>
              <AnimatedSidebarMenuButton icon={<FlaskConical className="size-4" />} isActive={active === "experiments"} onSelect={() => open("experiments")}>
                Experiments
              </AnimatedSidebarMenuButton>
            </AnimatedSidebarMenuItem>
            <AnimatedSidebarMenuItem>
              <AnimatedSidebarMenuButton icon={<Activity className="size-4" />} isActive={active === "runs"} onSelect={() => open("runs")}>
                Runs
              </AnimatedSidebarMenuButton>
            </AnimatedSidebarMenuItem>
            <AnimatedSidebarMenuItem>
              <AnimatedSidebarMenuButton icon={<Library className="size-4" />} isActive={libraryActive} onSelect={() => open("library/repositories")}>
                Library
              </AnimatedSidebarMenuButton>
            </AnimatedSidebarMenuItem>
            <AnimatedSidebarMenuItem>
              <AnimatedSidebarMenuButton icon={<ChartLine className="size-4" />} isActive={analyticsActive} onSelect={() => open("analytics")}>
                Analytics
              </AnimatedSidebarMenuButton>
            </AnimatedSidebarMenuItem>
          </AnimatedSidebarMenu>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain group-data-[state=collapsed]/sidebar:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <AISidebar
            items={items}
            activeId={active || null}
            ariaLabel="Workspace navigation"
            renderMenu={() => null}
            renderIcon={(item) => {
              const icons = {
                experiments: FlaskConical,
                runs: Activity,
                library: Library,
                analytics: ChartLine,
              } as const;
              const NavIcon = icons[item.id as keyof typeof icons];
              return NavIcon ? <NavIcon className="size-4" /> : undefined;
            }}
            onActiveChange={(id) => {
              const path = routeFor(id, store);
              if (path) open(path);
            }}
            onItemsChange={setItems}
            onRename={(item, label) => {
              const experiment = store.experiments.find((entry) => entry.id === item.id);
              if (experiment) store.updateExperiment({ ...experiment, name: label });
            }}
          />
        </div>
      </AnimatedSidebarContent>
      <AnimatedSidebarFooter className="relative">
        <ShellMenu
          open={userOpen}
          onOpenChange={setUserOpen}
          side="top"
          align="start"
          trigger={
            <button
              type="button"
              className={cn(
                "flex min-h-10 w-full items-center gap-2.5 rounded-xl px-2 text-left text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                collapsed && "size-10 justify-center px-0",
              )}
              aria-expanded={userOpen}
              aria-label={store.you.name}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-foreground">
                {store.you.name.slice(0, 1)}
              </span>
              {collapsed ? null : (
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{store.you.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">User profile</span>
                </span>
              )}
            </button>
          }
        >
          <div role="menu">
            <ShellMenuLabel>Organization</ShellMenuLabel>
            {accountLinks.map(({ label, icon: AccountIcon, to }) => (
              <ShellMenuItem
                key={to}
                onClick={() => {
                  setUserOpen(false);
                  open(to);
                }}
              >
                <AccountIcon className="size-4 shrink-0 opacity-70" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {location.pathname === `/${org}/${to}` ? <Icon name="check" /> : null}
              </ShellMenuItem>
            ))}
            <ShellMenuLabel>Account</ShellMenuLabel>
            <ShellMenuItem
              onClick={() => {
                store.setTheme(store.theme === "dark" ? "light" : "dark");
                setUserOpen(false);
              }}
            >
              <Icon name={store.theme === "dark" ? "sun" : "moon"} /> Theme
            </ShellMenuItem>
            <ShellMenuItem
              onClick={() => {
                setUserOpen(false);
                navigate("/");
              }}
            >
              <Icon name="out" /> Sign out
            </ShellMenuItem>
          </div>
        </ShellMenu>
      </AnimatedSidebarFooter>
      <AnimatedSidebarRail />
      <SidebarResizeHandle
        width={sidebarWidth}
        onWidthChange={onSidebarWidthChange}
        minWidth={SIDEBAR_WIDTH_MIN}
        maxWidth={SIDEBAR_WIDTH_MAX}
      />
      {creating ? (
        <Dialog title="Create an organization" description="Members see this name in the sidebar. The link uses an id derived from it." onClose={() => setCreating(false)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!orgName.trim()) return;
              const next = store.createOrg(orgName.trim());
              setOrgName("");
              setCreating(false);
              navigate(`/${next}/experiments`);
            }}
          >
            <FormShell>
              <TextField id="org-name" label="Name" value={orgName} onChange={setOrgName} autoFocus required />
              <FormActions onCancel={() => setCreating(false)} submitLabel="Create" />
            </FormShell>
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
        <AnimatedSidebarTrigger className="-ml-1 inline-flex shrink-0 text-muted-foreground md:hidden" aria-label="Toggle sidebar">
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
          <div className="px-5 pt-4 md:px-8">
            <InlineAlert variant="success" className="mb-0 flex flex-wrap items-center gap-2">
              <span className="flex-1">{store.notice}</span>
              <MenuButton onClick={() => store.setNotice(null)}>Dismiss</MenuButton>
            </InlineAlert>
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
