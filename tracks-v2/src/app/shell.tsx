import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Check,
  ChevronRight,
  CreditCard,
  KeyRound,
  LogOut,
  Mail,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { AISidebar } from "@/components/agents/ai-sidebar";
import {
  AnimatedSidebar,
  AnimatedSidebarClose,
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
import { Avatar } from "@/components/motion/avatar-group";
import { DesignPlayground } from "@/design/playground";
import { radiusSteps, useDesign } from "@/design/theme";
import { Button } from "@/components/motion/button/base";
import {
  CenterMorphModal,
  CenterMorphModalClose,
  CenterMorphModalContent,
} from "@/components/motion/center-morph-modal";
import { Input } from "@/components/motion/input";
import { MorphPopover, MorphPopoverContent, MorphPopoverTrigger } from "@/components/motion/popover-morph";
import { ThemeToggle } from "@/components/motion/theme-toggle";
import { initial, money, useCurrentOrg, useOrgData, useOrgId, usePendingInvitations, useStore, type Organization } from "@/data";
import { cn } from "@/lib/utils";
import { MenuAction, MenuLabel, MenuSeparator } from "./menu";
import {
  NAV_ICONS,
  NAV_PATHS,
  NAV_TREE,
  RAIL_ITEMS,
  activeNavId,
} from "./nav";
import { NotFoundPage } from "./not-found";

const WIDTH_KEY = "tracks-v2:sidebar-width";
const OPEN_KEY = "tracks-v2:sidebar-open";
const ICON_WIDTH = 68;
const MIN_WIDTH = 180;
const MAX_WIDTH = 420;
const DEFAULT_WIDTH = 256;
/** Widths below the minimum stick, then collapse once the pointer pushes past this. */
const COLLAPSE_AT = 150;
/** Pull the icon rail this far before it opens. */
const PULL_OPEN = 40;

function clampWidth(width: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(width)));
}

function readWidth() {
  const stored = Number(localStorage.getItem(WIDTH_KEY));
  return Number.isFinite(stored) && stored > 0 ? clampWidth(stored) : DEFAULT_WIDTH;
}

/** Layout route for every `/:org/*` page. */
export function Shell() {
  const org = useCurrentOrg();
  const [open, setOpen] = useState(() => localStorage.getItem(OPEN_KEY) !== "false");
  const [width, setWidth] = useState(readWidth);
  const asideRef = useRef<HTMLElement>(null);

  const changeOpen = useCallback((next: boolean) => {
    setOpen(next);
    localStorage.setItem(OPEN_KEY, String(next));
  }, []);

  const resize = useCallback((next: number) => {
    setWidth(next);
    // Motion can settle the aside on a resolved pixel width; keep it in step while dragging.
    if (asideRef.current) asideRef.current.style.width = `${next}px`;
  }, []);

  const releaseWidth = useCallback(() => {
    if (asideRef.current) asideRef.current.style.width = "";
  }, []);

  if (!org) return <NotFoundPage />;

  return (
    <AnimatedSidebarProvider
      open={open}
      onOpenChange={changeOpen}
      style={{ "--sidebar-width": `${width}px` } as CSSProperties}
    >
      <AnimatedSidebar ref={asideRef} collapsible="icon" ariaLabel="Tracks">
        <SidebarTop org={org} />
        <AnimatedSidebarContent>
          <SidebarNav />
        </AnimatedSidebarContent>
        <AnimatedSidebarFooter>
          <UserMenu />
        </AnimatedSidebarFooter>
        <ResizeRail
          width={width}
          expanded={open}
          onResize={resize}
          onResizeEnd={(final) => localStorage.setItem(WIDTH_KEY, String(final))}
          onCollapse={(restore) => {
            setWidth(restore);
            releaseWidth();
            changeOpen(false);
          }}
          onExpand={(next) => {
            resize(next);
            changeOpen(true);
          }}
        />
      </AnimatedSidebar>
      <AnimatedSidebarInset>
        <MobileNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <Outlet />
        </div>
      </AnimatedSidebarInset>
      <DesignPlayground />
    </AnimatedSidebarProvider>
  );
}

function useCollapsed() {
  const { open, isMobile } = useAnimatedSidebar();
  return !open && !isMobile;
}

/* ───────────────────────── Header: org switcher + collapse toggle ───────────────────────── */

const ICON_BUTTON =
  "size-9 rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

function SidebarTop({ org }: { org: Organization }) {
  const collapsed = useCollapsed();
  if (collapsed) {
    return (
      <AnimatedSidebarHeader className="items-center px-2 py-3">
        <AnimatedSidebarTrigger aria-label="Expand sidebar" className={cn(ICON_BUTTON, "h-9 w-full")}>
          <PanelLeftOpen aria-hidden="true" className="size-5" />
        </AnimatedSidebarTrigger>
      </AnimatedSidebarHeader>
    );
  }
  return (
    <AnimatedSidebarHeader className="flex-row items-center gap-1">
      <OrgSwitcher org={org} />
      <AnimatedSidebarClose aria-label="Collapse sidebar" className={ICON_BUTTON}>
        <PanelLeftClose aria-hidden="true" className="size-4" />
      </AnimatedSidebarClose>
    </AnimatedSidebarHeader>
  );
}

function OrgMark({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground",
        className,
      )}
    >
      {initial(name)}
    </span>
  );
}

function OrgSwitcher({ org }: { org: Organization }) {
  const store = useStore();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useAnimatedSidebar();
  const invitations = usePendingInvitations();
  const [menuOpen, setMenuOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const menuRadius = Math.round(radiusSteps(useDesign().radius).xl);

  const go = (to: string) => {
    setMenuOpen(false);
    if (isMobile) setOpenMobile(false);
    navigate(to);
  };

  return (
    <>
      <MorphPopover open={menuOpen} onOpenChange={setMenuOpen} className="min-w-0 flex-1">
        <MorphPopoverTrigger>
          <button
            type="button"
            aria-label={`Organization: ${org.name}. Switch organization`}
            className="flex h-9 w-full min-w-0 items-center gap-2.5 rounded-xl px-1.5 text-left text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <OrgMark name={org.name} />
            <span className="min-w-0 flex-1 truncate">{org.name}</span>
          </button>
        </MorphPopoverTrigger>
        <MorphPopoverContent side="bottom" align="start" sideOffset={8} radius={menuRadius} className="w-60 p-1.5">
          <MenuLabel>Organizations</MenuLabel>
          {store.organizations.map((item) => (
            <MenuAction
              key={item.id}
              active={item.id === org.id}
              onSelect={() => go(`/${item.id}/experiments`)}
              trailing={item.id === org.id ? <Check aria-hidden="true" className="size-3.5" /> : null}
            >
              <span className="flex items-center gap-2">
                <OrgMark name={item.name} className="size-5 rounded-md text-[10px]" />
                {item.name}
              </span>
            </MenuAction>
          ))}
          <MenuSeparator />
          <MenuAction
            icon={Plus}
            onSelect={() => {
              setMenuOpen(false);
              setCreating(true);
            }}
          >
            Create organization
          </MenuAction>
          {invitations.length ? (
            <>
              <MenuSeparator />
              <MenuLabel>Invitations</MenuLabel>
              {invitations.map((invitation) => (
                <MenuAction key={invitation.id} icon={Mail} onSelect={() => go(`/invitations/${invitation.id}`)}>
                  Join {invitation.orgName}
                </MenuAction>
              ))}
            </>
          ) : null}
        </MorphPopoverContent>
      </MorphPopover>
      <CreateOrgModal
        open={creating}
        onOpenChange={setCreating}
        onCreate={(name) => {
          const orgId = store.createOrg(name);
          setCreating(false);
          go(`/${orgId}/experiments`);
        }}
      />
    </>
  );
}

function CreateOrgModal({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setError(null);
    }
  }, [open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Name the organization.");
      return;
    }
    onCreate(name.trim());
  };

  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel="Create organization" className="max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-1 pr-8">
            <h2 className="text-lg font-semibold text-foreground">Create organization</h2>
            <p className="text-sm text-muted-foreground">
              Organizations share a balance, API keys, library and experiments.
            </p>
          </div>
          <Input
            label="Name"
            value={name}
            onChange={(value) => {
              setName(value);
              setError(null);
            }}
            placeholder="Northwind"
            error={error ?? undefined}
            autoFocus
          />
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
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
}

/* ───────────────────────── Navigation: AI Sidebar tree + icon rail ───────────────────────── */

function SidebarNav() {
  const orgId = useOrgId();
  const { experiments } = useOrgData();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useAnimatedSidebar();
  const collapsed = useCollapsed();
  const activeId = activeNavId(pathname, orgId);

  const go = (to: string) => {
    navigate(to);
    if (isMobile) setOpenMobile(false);
  };

  const select = (id: string) => {
    const path = NAV_PATHS[id];
    if (!path) return;
    go(`/${orgId}/${path}`);
  };

  return (
    <>
      <AISidebar
        items={NAV_TREE}
        editable={false}
        ariaLabel="Navigation"
        activeId={activeId ?? ""}
        onActiveChange={select}
        renderIcon={(item) => {
          const Icon = NAV_ICONS[item.id];
          return Icon ? <Icon className="size-4" /> : undefined;
        }}
      />
      {experiments.length ? (
        <div className="group-data-[state=collapsed]/sidebar:hidden">
          <div aria-hidden="true" className="mx-2 my-2 h-px bg-border" />
          <nav aria-label="Your experiments" className="flex flex-col gap-0.5">
            {experiments.map((experiment) => {
              const active = pathname.startsWith(`/${orgId}/experiments/${experiment.id}`);
              return (
                <button
                  key={experiment.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => go(`/${orgId}/experiments/${experiment.id}`)}
                  className={cn(
                    "flex min-h-9 w-full min-w-0 items-center rounded-xl px-3 text-left text-sm text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    active && "bg-muted text-foreground",
                  )}
                >
                  <span className="truncate">{experiment.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      ) : null}
      {collapsed ? (
        <AnimatedSidebarMenu aria-label="Navigation">
          {RAIL_ITEMS.map((id) => {
            const Icon = NAV_ICONS[id];
            const label = NAV_TREE.find((item) => item.id === id)?.label ?? id;
            return (
              <AnimatedSidebarMenuItem key={id}>
                <AnimatedSidebarMenuButton
                  icon={<Icon className="size-4" />}
                  isActive={activeId === id}
                  className="px-4"
                  onSelect={() => select(id)}
                >
                  {label}
                </AnimatedSidebarMenuButton>
              </AnimatedSidebarMenuItem>
            );
          })}
        </AnimatedSidebarMenu>
      ) : null}
    </>
  );
}

/* ───────────────────────── Footer: user menu ───────────────────────── */

const ACCOUNT_LINKS = [
  { path: "members", label: "Members", icon: Users },
  { path: "api-keys", label: "API keys", icon: KeyRound },
  { path: "billing", label: "Billing", icon: CreditCard },
  { path: "settings", label: "Settings", icon: Settings },
] as const;

function UserMenu() {
  const { you, theme } = useStore();
  const org = useCurrentOrg();
  const orgId = useOrgId();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isMobile, setOpenMobile } = useAnimatedSidebar();
  const collapsed = useCollapsed();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRadius = Math.round(radiusSteps(useDesign().radius).xl);

  const go = (to: string) => {
    setMenuOpen(false);
    if (isMobile) setOpenMobile(false);
    navigate(to);
  };

  return (
    <MorphPopover open={menuOpen} onOpenChange={setMenuOpen}>
      <MorphPopoverTrigger>
        <button
          type="button"
          aria-label={`${you.name}, user profile`}
          title={collapsed ? you.name : undefined}
          className={cn(
            "flex min-w-0 items-center gap-2.5 rounded-xl text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
            collapsed ? "size-11 justify-center self-center" : "h-12 w-full px-1.5",
          )}
        >
          <Avatar name={you.name} size="sm" />
          {collapsed ? null : (
            <>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{you.name}</span>
                <span className="truncate text-xs text-muted-foreground">User profile</span>
              </span>
            </>
          )}
        </button>
      </MorphPopoverTrigger>
      <MorphPopoverContent side="top" align="start" sideOffset={8} radius={menuRadius} className="w-64 p-1.5">
        {org ? (
          <MenuAction
            icon={Wallet}
            onSelect={() => go(`/${org.id}/billing`)}
            trailing={
              <span className="inline-flex items-center gap-1">
                <span className={cn("tabular-nums", org.balanceCents <= 0 && "text-destructive")}>
                  {money(org.balanceCents)}
                </span>
                <ChevronRight aria-hidden="true" className="size-3.5" />
              </span>
            }
          >
            Balance
          </MenuAction>
        ) : null}
        <MenuSeparator />
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <Avatar name={you.name} size="sm" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{you.name}</span>
            <span className="truncate text-xs text-muted-foreground">{you.email}</span>
          </span>
        </div>
        <MenuSeparator />
        <MenuLabel>Organization</MenuLabel>
        {ACCOUNT_LINKS.map(({ path, label, icon }) => (
          <MenuAction
            key={path}
            icon={icon}
            active={pathname === `/${orgId}/${path}`}
            onSelect={() => go(`/${orgId}/${path}`)}
          >
            {label}
          </MenuAction>
        ))}
        <MenuSeparator />
        <MenuLabel>Account</MenuLabel>
        <div className="flex h-8 items-center gap-2 rounded-lg px-2.5 text-xs text-foreground">
          <span className="min-w-0 flex-1 truncate">Theme · {theme === "dark" ? "Dark" : "Light"}</span>
          <ThemeToggle
            variant="circle"
            className="size-7 rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            iconClassName="size-3.5"
          />
        </div>
        <MenuAction icon={LogOut} onSelect={() => go("/")}>
          Sign out
        </MenuAction>
      </MorphPopoverContent>
    </MorphPopover>
  );
}

/* ───────────────────────── Right edge: drag to resize, push past the edge to collapse ───────────────────────── */

function ResizeRail({
  width,
  expanded,
  onResize,
  onResizeEnd,
  onCollapse,
  onExpand,
}: {
  width: number;
  expanded: boolean;
  onResize: (width: number) => void;
  onResizeEnd: (width: number) => void;
  onCollapse: (restoreWidth: number) => void;
  onExpand: (width: number) => void;
}) {
  const swallowClick = useRef(false);

  const startDrag = (startX: number) => {
    const preferred = width;
    let moved = false;
    let ended = false;
    let panelOpen = expanded;
    let settled = width;
    let pullFrom = startX;
    // Maps the pointer to a sidebar width. Rebased when the panel snaps open or shut.
    let grab = (expanded ? width : ICON_WIDTH) - startX;

    const cleanup = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };

    const move = (event: PointerEvent) => {
      if (!moved) {
        if (Math.abs(event.clientX - startX) < 3) return;
        moved = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
      }
      if (!panelOpen) {
        if (event.clientX - pullFrom < PULL_OPEN) return;
        panelOpen = true;
        grab = MIN_WIDTH - event.clientX;
        settled = MIN_WIDTH;
        onExpand(settled);
        return;
      }
      const next = event.clientX + grab;
      if (next < COLLAPSE_AT) {
        panelOpen = false;
        pullFrom = event.clientX;
        onCollapse(preferred);
        return;
      }
      settled = clampWidth(next);
      onResize(settled);
    };

    const end = () => {
      if (ended) return;
      ended = true;
      cleanup();
      if (!moved) return;
      swallowClick.current = true;
      if (panelOpen) onResizeEnd(settled);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  return (
    <AnimatedSidebarRail
      aria-label={expanded ? "Drag to resize. Drag past the edge to collapse." : "Drag to expand, or click."}
      className="cursor-col-resize touch-none"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        startDrag(event.clientX);
      }}
      onClick={(event) => {
        if (swallowClick.current) {
          swallowClick.current = false;
          event.preventDefault();
        }
      }}
    />
  );
}

/* ───────────────────────── Mobile: the only place the sidebar needs a trigger ───────────────────────── */

function MobileNav() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-border bg-background px-2 md:hidden">
      <AnimatedSidebarTrigger aria-label="Open sidebar" className={ICON_BUTTON}>
        <PanelLeft aria-hidden="true" className="size-4" />
      </AnimatedSidebarTrigger>
    </header>
  );
}
