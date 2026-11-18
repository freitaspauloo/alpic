import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Box, ChartNoAxesColumn, Check, Code, Flag, Headset, MoreHorizontal, PenLine } from "lucide-react";
import { roles } from "../data";
import { useSession } from "../state";
import { Logo, PixelField, Wordmarks } from "../ui";
import { PlanGrid } from "./plans";

export function Landing() {
  return (
    <div className="marketing">
      <div className="banner">
        <p>A run now keeps the page the agent saw, next to the tool it called. <a href="#method">Read the note.</a></p>
        <button type="button" aria-label="Dismiss announcement">×</button>
      </div>
      <header className="market-nav">
        <Logo />
        <nav aria-label="Primary">
          <Link className="pill" to="/">Product</Link>
          <Link className="pill" to="/signup">Experiments</Link>
          <Link className="pill" to="/signup">Library</Link>
          <Link className="pill" to="/pricing">Pricing</Link>
          <a className="pill" href="#method">Method</a>
        </nav>
        <div className="nav-actions">
          <Link className="text-link" to="/acme">Log in</Link>
          <Link className="pink-button" to="/signup">Get started</Link>
        </div>
      </header>
      <main className="hero" id="product">
        <div className="hero-copy">
          <h1>The <em>test bench</em> for AI agents</h1>
          <p>Watch an agent try your product. Tracks keeps the steps, the screen, and the place it got stuck.</p>
          <Link className="pink-button" to="/signup">Start a run</Link>
        </div>
        <div className="stage" aria-hidden="true">
          <article className="run-frame">
            <header><i /> checkout.northwind · Claude</header>
            <div className="run-screen">
              <strong>Opened /skis</strong>
              <span>Called create_checkout()</span>
              <em>Stopped · no API key in the docs</em>
            </div>
            <footer><span className="lime-chip">Run this task</span><span>Or write your own</span></footer>
          </article>
          <article className="evidence-frame">
            <header><b /> The missing step</header>
            <p>Docs never mention an API key. The agent retried twice, then left checkout empty.</p>
          </article>
        </div>
      </main>
      <footer className="logo-strip" id="method">
        <p>Used by teams who need agents to finish the job</p>
        <Wordmarks />
      </footer>
    </div>
  );
}

export function Signup() {
  const navigate = useNavigate();
  const { setIdentity } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function continueWith(event?: FormEvent) {
    event?.preventDefault();
    const nextName = name.trim() || "Paulo Freitas";
    const nextEmail = email.trim() || "paulo@du.design";
    setIdentity(nextName, nextEmail);
    navigate("/role");
  }

  return (
    <div className="split">
      <section className="split-form">
        <Logo />
        <form onSubmit={continueWith}>
          <h1>One account for every run</h1>
          <p>Sign up free to watch agents use your product.</p>
          <button className="outline-button" type="button" onClick={() => continueWith()}>Continue with Google</button>
          <button className="outline-button" type="button" onClick={() => continueWith()}>Continue with Apple</button>
          <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Paulo Freitas" autoComplete="name" /></label>
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" autoComplete="new-password" /></label>
          <button className="pink-button full" type="submit">Sign up</button>
          <small>By signing up, you agree this is a design preview. Nothing here is a real account.</small>
          <p className="swap">Already have an account? <Link to="/acme">Log in</Link></p>
        </form>
      </section>
      <aside className="split-proof">
        <PixelField />
        <p className="eyebrow">Teams who watch agents the way customers do</p>
        <Wordmarks />
        <figure>
          <blockquote>“The agent got through signup, then stopped on checkout. Tracks showed the missing API key in the docs before we shipped the fix.”</blockquote>
          <figcaption>Maya Chen · Product, Northwind</figcaption>
          <dl>
            <div><dt>128</dt><dd>runs this week</dd></div>
            <div><dt>14</dt><dd>paths still failing</dd></div>
          </dl>
        </figure>
      </aside>
    </div>
  );
}

export function Role() {
  const navigate = useNavigate();
  const { setRole } = useSession();

  return (
    <main className="role-page">
      <Logo />
      <h1>What’s your role?</h1>
      <div className="role-grid">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => {
              setRole(role.label);
              navigate("/welcome");
            }}
          >
            <RoleMark id={role.icon} />
            <span>{role.label}</span>
          </button>
        ))}
      </div>
    </main>
  );
}

function RoleMark({ id }: { id: string }) {
  const icons: Record<string, typeof Flag> = {
    flag: Flag,
    box: Box,
    code: Code,
    check: Check,
    headset: Headset,
    pen: PenLine,
    book: BookOpen,
    chart: ChartNoAxesColumn,
    more: MoreHorizontal,
  };
  const Icon = icons[id] ?? MoreHorizontal;
  return <Icon size={20} strokeWidth={1.6} aria-hidden="true" />;
}

export function Welcome() {
  const cards = [
    { title: "Opened /pricing", meta: "step 1", style: { top: "8%", left: "7%", rotate: "-8deg" } },
    { title: "Called create_checkout()", meta: "step 2", style: { top: "18%", right: "8%", rotate: "7deg" } },
    { title: "No API key in the docs", meta: "stopped", style: { bottom: "16%", left: "12%", rotate: "6deg" } },
    { title: "Retried twice", meta: "evidence", style: { bottom: "12%", right: "14%", rotate: "-6deg" } },
    { title: "Screen at 00:42", meta: "page", style: { top: "42%", left: "4%", rotate: "4deg" } },
    { title: "Fix the docs", meta: "next", style: { top: "46%", right: "5%", rotate: "-4deg" } },
  ];

  return (
    <main className="welcome">
      {cards.map((card) => (
        <article key={card.title} style={{ top: card.style.top, left: card.style.left, right: card.style.right, bottom: card.style.bottom, transform: `rotate(${card.style.rotate})` }}>
          <span>{card.meta}</span>
          <strong>{card.title}</strong>
        </article>
      ))}
      <div className="welcome-copy">
        <Logo to="/welcome" />
        <h1>See what a run can <em>show</em></h1>
        <p>Take a ninety-second look at a checkout. The agent opens the site, tries the task, and leaves the evidence on screen. Leave whenever you want.</p>
        <Link className="lime-button" to="/acme">Take the tour</Link>
      </div>
    </main>
  );
}

export function Pricing() {
  return (
    <div className="marketing pricing-page">
      <header className="market-nav">
        <Logo />
        <nav aria-label="Primary">
          <Link className="pill" to="/">Product</Link>
          <Link className="pill" to="/signup">Experiments</Link>
          <Link className="pill on" to="/pricing">Pricing</Link>
        </nav>
        <div className="nav-actions">
          <Link className="text-link" to="/acme">Log in</Link>
          <Link className="pink-button" to="/signup">Get started</Link>
        </div>
      </header>
      <main className="pricing-main">
        <h1>Pricing that stays with the work</h1>
        <p>Start with the paths that matter. Add runs as more of the product needs an agent to finish them.</p>
        <PlanGrid current="free" />
      </main>
    </div>
  );
}
