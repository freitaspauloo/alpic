import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function Logo({ to = "/", tone = "ink" }: { to?: string; tone?: "ink" | "paper" }) {
  return (
    <Link className={`logo logo-${tone}`} to={to} aria-label="Tracks home">
      <svg viewBox="0 0 49 49" aria-hidden="true">
        <path d="M21.2568 49H1.53125C0.685564 49 0 48.3161 0 47.4705V19.2981C0 17.8947 1.70437 17.2526 2.6021 18.3313C9.04124 26.0684 17.996 38.5335 22.5795 46.8151C23.1307 47.8111 22.3951 49 21.2568 49Z" fill="currentColor" />
        <path d="M41.3435 49H28.0312C27.4512 49 26.9232 48.6733 26.655 48.159C21.7818 38.8113 9.29402 20.6055 0.399839 10.8318C0.140761 10.5471 0 10.1817 0 9.79677V1.53125C0 0.685564 0.683782 0 1.52947 0H7.82887C8.20979 0 8.56175 0.123952 8.83616 0.388154C16.8791 8.13199 38.5222 40.2583 42.3063 47.6035C42.6936 48.3552 42.1892 49 41.3435 49Z" fill="currentColor" />
        <path d="M49 26.4288C48.9998 30.8022 48.9999 41.0453 48.9999 47.4095C49 48.9547 46.9652 49.5353 46.1464 48.2248C38.9414 36.6924 23.9225 13.2135 15.287 2.63817C14.4427 1.60421 15.1781 0 16.513 0H29.8534C30.3386 0 30.7878 0.220174 31.076 0.610504C33.5725 3.99205 45.692 20.4611 48.8013 25.6908C48.9375 25.9199 49 26.1623 49 26.4288Z" fill="currentColor" />
        <path d="M47.4688 0H37.4031C36.1625 0 35.4369 1.39795 36.1508 2.41248L46.2165 16.7164C47.077 17.9391 49 17.3303 49 15.8351V1.53125C49 0.685564 48.3144 0 47.4688 0Z" fill="currentColor" />
      </svg>
      <span>TRACKS</span>
    </Link>
  );
}

const pixelRows = [
  "000000112000",
  "000001221100",
  "000012211000",
  "000121100000",
  "001221000011",
  "012110000122",
  "121000001221",
  "210000012110",
  "100000121100",
  "000001221000",
  "000012110000",
  "000121000000",
  "001210000200",
  "012100000000",
];

export function PixelField() {
  return (
    <div className="pixel-field" aria-hidden="true">
      {pixelRows.map((row, y) =>
        [...row].map((cell, x) =>
          cell === "0" ? null : <i key={`${x}-${y}`} className={cell === "2" ? "pixel hot" : "pixel"} style={{ "--x": x, "--y": y } as React.CSSProperties} />,
        ),
      )}
    </div>
  );
}

export function Wordmarks() {
  const names = ["TwelveLabs", "Kiwi.com", "re:commerce", "Datadog", "cottages.com", "Bitmovin"];
  return (
    <ul className="wordmarks">
      {names.map((name) => (
        <li key={name}>{name}</li>
      ))}
    </ul>
  );
}

export function QuietPage({ title, lede, children }: { title: string; lede: string; children?: ReactNode }) {
  return (
    <section className="sheet">
      <header className="sheet-head">
        <h1>{title}</h1>
        <p>{lede}</p>
      </header>
      <div className="quiet-card">{children}</div>
    </section>
  );
}
