import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  CreditCard,
  FlaskConical,
  FolderGit2,
  House,
  KeyRound,
  LifeBuoy,
  PanelLeft,
  Play,
  Plus,
  Server,
  Settings,
  Sparkles,
  Terminal,
  Users,
} from "lucide-react";
import { useSession } from "./state";
import { Logo } from "./ui";

const build = [
  { to: "/acme", label: "Home", icon: House, end: true },
  { to: "/acme/experiments", label: "Experiments", icon: FlaskConical, end: false },
  { to: "/acme/runs", label: "Runs", icon: Play, end: false },
];

const library = [
  { to: "/acme/library", label: "Library", icon: Sparkles, end: true },
  { to: "/acme/library?tab=Repositories", label: "Repositories", icon: FolderGit2, end: false },
  { to: "/acme/library?tab=Skills", label: "Skills", icon: BookOpen, end: false },
  { to: "/acme/library?tab=MCP+servers", label: "MCP servers", icon: Server, end: false },
  { to: "/acme/library?tab=Command-line+tools", label: "Command-line tools", icon: Terminal, end: false },
];

const account = [
  { to: "/acme/billing", label: "Billing", icon: CreditCard },
  { to: "/acme/api-keys", label: "API keys", icon: KeyRound },
  { to: "/acme/members", label: "Members", icon: Users },
  { to: "/acme/settings", label: "Settings", icon: Settings },
];

export function Shell() {
  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState(false);
  const { name, email, signOut } = useSession();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(false);
    }
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [menu]);

  return (
    <div className={collapsed ? "app is-collapsed" : "app"}>
      <aside className="side">
        <div className="side-top">
          <Logo to="/acme" />
          <button className="icon-button" type="button" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed((value) => !value)}>
            <PanelLeft size={16} />
          </button>
        </div>
        <NavLink className="pink-button new-run" to="/acme/experiments/new">
          <Plus size={15} /> <span>New experiment</span>
        </NavLink>
        <NavGroup label="Build" items={build} />
        <NavGroup label="Library" items={library} />
        <NavGroup label="Account" items={account} />
        <div className="side-foot" ref={menuRef}>
          <div className="upgrade">
            <p>Get 20 runs when you upgrade</p>
            <div className="meter" aria-hidden="true"><span /></div>
            <NavLink to="/acme/billing">See plans</NavLink>
          </div>
          <a className="side-link" href="https://tracks.alpic.ai/" target="_blank" rel="noreferrer"><BookOpen size={14} /> Docs</a>
          <NavLink className="side-link" to="/acme/settings"><LifeBuoy size={14} /> Support</NavLink>
          <button className="who" type="button" onClick={() => setMenu((open) => !open)} aria-expanded={menu}>
            <i>{initials(name)}</i>
            <span>{name}</span>
          </button>
          {menu ? (
            <div className="account-card" role="menu">
              <strong>{name}</strong>
              <span>{email}</span>
              <span className="workspace">Workspace · acme</span>
              <NavLink to="/acme/settings" onClick={() => setMenu(false)}>Team settings</NavLink>
              <NavLink to="/acme/runs" onClick={() => setMenu(false)}>Runs</NavLink>
              <NavLink to="/acme/settings" onClick={() => setMenu(false)}>Privacy</NavLink>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <p>Runs, evidence, fixes</p>
          <div>
            <span>See the path, not just the answer.</span>
            <a href="https://tracks.alpic.ai/" target="_blank" rel="noreferrer">Read the method</a>
            <Linkish />
          </div>
        </header>
        <div className="workspace-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function Linkish() {
  return <NavLink to="/pricing">Book a readout</NavLink>;
}

function NavGroup({ label, items }: { label: string; items: { to: string; label: string; icon: typeof House; end?: boolean }[] }) {
  const location = useLocation();
  return (
    <nav aria-label={label}>
      <p>{label}</p>
      {items.map((item) => {
        const url = new URL(item.to, "http://tracks.local");
        const pathnameOk = item.end
          ? location.pathname === url.pathname
          : location.pathname === url.pathname || location.pathname.startsWith(`${url.pathname}/`);
        const searchOk = url.search ? location.search === url.search : item.end ? location.search === "" : true;
        const active = pathnameOk && searchOk;
        return (
          <Link key={item.label} to={item.to} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
            <item.icon size={15} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}
