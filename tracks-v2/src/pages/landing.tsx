import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";
import { TextReveal } from "@/components/motion/text-reveal";
import { DesignPlayground } from "@/design/playground";
import { applyDesign, useDesign } from "@/design/theme";
import { cn } from "@/lib/utils";
import { HeroVisual } from "./landing-hero";

const PRODUCT_WIDTH = 1440;

const PRODUCT = [
  {
    title: "Experiments",
    to: "/acme/experiments",
    body: "Scenarios your agents run against your product, compared across variants and judged on every launch.",
  },
  {
    title: "Runs",
    to: "/acme/runs",
    body: "Every agent attempt, from an experiment or on its own, with the prompt and the evidence.",
  },
  {
    title: "Library",
    to: "/acme/library",
    body: "Repositories, skills, MCP servers, and command-line tools the agents can use.",
  },
  {
    title: "Analytics",
    to: "/acme/analytics",
    body: "Who visits your website, and how much of that traffic came from agents.",
  },
];

function scrollToProduct() {
  document.getElementById("product")?.scrollIntoView({ behavior: "smooth" });
}

/** The live product, scaled into the hero. It reads the same theme as the app. */
function ProductFrame() {
  const frame = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const { resolvedTheme } = useTheme();
  const design = useDesign();
  const [box, setBox] = useState({ width: 0, height: 0 });
  const mode = resolvedTheme === "dark" ? "dark" : "light";

  const syncFrame = () => {
    const doc = iframe.current?.contentDocument;
    if (!doc) return;
    applyDesign(doc, design, mode);
    doc.documentElement.classList.toggle("dark", mode === "dark");
    doc.documentElement.style.overflow = "hidden";
    doc.body.style.overflow = "hidden";
  };

  useEffect(() => {
    syncFrame();
  }, [design, mode]);

  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    const measure = () => setBox({ width: node.clientWidth, height: node.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const scale = box.width > 0 ? box.width / PRODUCT_WIDTH : 1;

  return (
    <div
      ref={frame}
      className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-background shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
    >
      {box.width > 0 ? (
        <iframe
          ref={iframe}
          key={resolvedTheme ?? "theme"}
          title="Tracks"
          src="/acme/experiments"
          tabIndex={-1}
          className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
          style={{
            width: PRODUCT_WIDTH,
            height: Math.ceil(box.height / scale),
            transform: `scale(${scale})`,
          }}
          onLoad={syncFrame}
        />
      ) : null}
    </div>
  );
}

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 49 49" fill="none" aria-hidden="true" className={className}>
      <path d="M21.2568 49H1.53125C0.685564 49 0 48.3161 0 47.4705V19.2981C0 17.8947 1.70437 17.2526 2.6021 18.3313C9.04124 26.0684 17.996 38.5335 22.5795 46.8151C23.1307 47.8111 22.3951 49 21.2568 49Z" fill="currentColor" />
      <path d="M41.3435 49H28.0312C27.4512 49 26.9232 48.6733 26.655 48.159C21.7818 38.8113 9.29402 20.6055 0.399839 10.8318C0.140761 10.5471 0 10.1817 0 9.79677V1.53125C0 0.685564 0.683782 0 1.52947 0H7.82887C8.20979 0 8.56175 0.123952 8.83616 0.388154C16.8791 8.13199 38.5222 40.2583 42.3063 47.6035C42.6936 48.3552 42.1892 49 41.3435 49Z" fill="currentColor" />
      <path d="M49 26.4288C48.9998 30.8022 48.9999 41.0453 48.9999 47.4095C49 48.9547 46.9652 49.5353 46.1464 48.2248C38.9414 36.6924 23.9225 13.2135 15.287 2.63817C14.4427 1.60421 15.1781 0 16.513 0H29.8534C30.3386 0 30.7878 0.220174 31.076 0.610504C33.5725 3.99205 45.692 20.4611 48.8013 25.6908C48.9375 25.9199 49 26.1623 49 26.4288Z" fill="currentColor" />
      <path d="M47.4688 0H37.4031C36.1625 0 35.4369 1.39795 36.1508 2.41248L46.2165 16.7164C47.077 17.9391 49 17.3303 49 15.8351V1.53125C49 0.685564 48.3144 0 47.4688 0Z" fill="currentColor" />
    </svg>
  );
}

function Pill({
  to,
  onClick,
  children,
  tone,
}: {
  to?: string;
  onClick?: () => void;
  children: string;
  tone: "primary" | "quiet";
}) {
  const className = cn(
    "inline-flex h-10 items-center rounded-[var(--radius-control)] px-4 text-sm font-medium",
    tone === "primary" ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-foreground hover:bg-border",
  );
  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export function Landing() {
  const { hero } = useDesign();

  return (
    <main className="min-h-svh bg-background text-foreground antialiased">
      <div className="flex flex-col pt-3" style={{ paddingLeft: "max(20px, 2vw)", paddingRight: "max(20px, 2vw)" }}>
        <header className="flex items-center">
          <Link to="/" className="inline-flex items-center gap-2.5 text-foreground">
            <Mark className="size-6" />
            <span className="text-sm font-medium tracking-tight">Tracks</span>
          </Link>
          <nav className="ml-auto flex items-center gap-6 text-sm text-muted-foreground">
            {["Pricing", "Docs", "About"].map((label) => (
              <Link key={label} to="/" className="hidden hover:text-foreground md:inline">
                {label}
              </Link>
            ))}
            <Link to="/acme/experiments/new" className="hidden hover:text-foreground md:inline">
              Login
            </Link>
            <Pill to="/acme/experiments/new" tone="primary">
              Sign Up
            </Pill>
          </nav>
        </header>

        <section className="pt-10">
          <TextReveal
            as="h1"
            split="word"
            stagger={0.045}
            text={["Can agents actually", "use your product?"]}
            className="max-w-xl font-medium text-foreground text-[length:var(--text-display)] leading-[var(--leading-display)] tracking-[var(--tracking-display)]"
          />
          <p className="mt-6 max-w-md leading-relaxed text-muted-foreground" style={{ fontSize: "var(--text-body)" }}>
            Watch agents work through your app, inspect the evidence, know what to fix.
          </p>
          <div className="mt-6 flex items-center" style={{ gap: "var(--space-control)" }}>
            <Pill to="/acme/experiments/new" tone="primary">
              Sign in
            </Pill>
            <Pill onClick={scrollToProduct} tone="quiet">
              Explore
            </Pill>
          </div>
        </section>
      </div>

      <section className="relative mt-9" aria-label="Product">
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: String(hero.aspect * 1.2) }}>
          <div className="absolute inset-x-0 top-0 w-full" style={{ aspectRatio: String(hero.aspect) }}>
            <HeroVisual config={hero} />
          </div>
          <div className="absolute left-1/2 w-[88%] -translate-x-1/2 top-[18%] h-[80%] sm:top-[22.8%] sm:h-[74.4%] sm:w-1/2">
            <ProductFrame />
          </div>
        </div>
      </section>

      <div
        className="flex w-full max-w-[1120px] flex-col pb-16"
        style={{ paddingLeft: "max(20px, 2vw)", paddingRight: "max(20px, 2vw)" }}
      >
        <section id="product" className="scroll-mt-16 pt-24">
          <p
            className="uppercase text-muted-foreground"
            style={{ fontSize: "var(--text-eyebrow)", letterSpacing: "var(--tracking-eyebrow)" }}
          >
            Tracks
          </p>
          <h2
            className="mt-3 max-w-3xl leading-tight font-medium text-balance"
            style={{ fontSize: "var(--text-title)", letterSpacing: "var(--tracking-title)" }}
          >
            Watch the run. Keep the evidence.
          </h2>
          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCT.map((item) => (
              <div key={item.title}>
                <h3 className="text-sm font-medium">
                  <Link to={item.to} className="hover:text-muted-foreground">
                    {item.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-20 flex flex-col items-start justify-between gap-6 border-t border-border pt-10 sm:flex-row sm:items-end">
          <p
            className="leading-tight font-medium"
            style={{ fontSize: "var(--text-title)", letterSpacing: "var(--tracking-title)" }}
          >
            Know what to fix.
          </p>
          <Pill to="/acme/experiments/new" tone="primary">
            Sign in
          </Pill>
        </footer>
      </div>
      <DesignPlayground />
    </main>
  );
}
