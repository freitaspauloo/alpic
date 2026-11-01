import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export {
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ChipToggle,
  CtaButtonLink,
  Dialog,
  Empty,
  FormActions,
  FormShell,
  InlineAlert,
  MenuButton,
  ShellMenu,
  ShellMenuItem,
  ShellMenuLabel,
  shellMenuTriggerClassName,
  nativeSelectClassName,
  Page,
  SimpleDataTable,
  Status,
  TextAreaField,
  TextField,
  buttonVariants,
} from "@/components/app";

export function Logo({ to }: { to?: string }) {
  const mark = (
    <svg viewBox="0 0 49 49" fill="none" aria-hidden="true">
      <path d="M21.2568 49H1.53125C0.685564 49 0 48.3161 0 47.4705V19.2981C0 17.8947 1.70437 17.2526 2.6021 18.3313C9.04124 26.0684 17.996 38.5335 22.5795 46.8151C23.1307 47.8111 22.3951 49 21.2568 49Z" fill="currentColor" />
      <path d="M41.3435 49H28.0312C27.4512 49 26.9232 48.6733 26.655 48.159C21.7818 38.8113 9.29402 20.6055 0.399839 10.8318C0.140761 10.5471 0 10.1817 0 9.79677V1.53125C0 0.685564 0.683782 0 1.52947 0H7.82887C8.20979 0 8.56175 0.123952 8.83616 0.388154C16.8791 8.13199 38.5222 40.2583 42.3063 47.6035C42.6936 48.3552 42.1892 49 41.3435 49Z" fill="currentColor" />
      <path d="M49 26.4288C48.9998 30.8022 48.9999 41.0453 48.9999 47.4095C49 48.9547 46.9652 49.5353 46.1464 48.2248C38.9414 36.6924 23.9225 13.2135 15.287 2.63817C14.4427 1.60421 15.1781 0 16.513 0H29.8534C30.3386 0 30.7878 0.220174 31.076 0.610504C33.5725 3.99205 45.692 20.4611 48.8013 25.6908C48.9375 25.9199 49 26.1623 49 26.4288Z" fill="currentColor" />
      <path d="M47.4688 0H37.4031C36.1625 0 35.4369 1.39795 36.1508 2.41248L46.2165 16.7164C47.077 17.9391 49 17.3303 49 15.8351V1.53125C49 0.685564 48.3144 0 47.4688 0Z" fill="currentColor" />
    </svg>
  );
  const body = (
    <>
      {mark}
      <span>TRACKS</span>
    </>
  );
  if (!to) return <span className="logo">{body}</span>;
  return (
    <Link className="logo" to={to}>
      {body}
    </Link>
  );
}

export function Icon({ name }: { name: string }) {
  const paths: Record<string, string[]> = {
    flask: ["M10 2v7.3a2 2 0 0 1-.2.9L4.7 20.6a1 1 0 0 0 .9 1.4h12.8a1 1 0 0 0 .9-1.4l-5.1-10.4a2 2 0 0 1-.2-.9V2", "M8.5 2h7", "M7 16h10"],
    play: ["M8 5v14l11-7L8 5z"],
    book: ["M4 19.5A2.5 2.5 0 0 1 6.5 17H20", "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"],
    chart: ["M3 3v18h18", "M7 14l4-4 3 3 5-6"],
    users: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
    key: ["M2.6 17.4A2 2 0 0 0 2 18.8V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.2a2 2 0 0 0 1.4-.6l.8-.8a6.5 6.5 0 1 0-4-4z"],
    card: ["M3 6h18v12H3z", "M3 10h18"],
    settings: ["M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z", "M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7.9 1.2 1.6 1.3H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"],
    plus: ["M12 5v14", "M5 12h14"],
    check: ["M20 6 9 17l-5-5"],
    menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
    panel: ["M4 5h16v14H4z", "M9 5v14"],
    sun: ["M12 4v2", "M12 18v2", "M4.9 4.9l1.4 1.4", "M17.7 17.7l1.4 1.4", "M4 12H2", "M22 12h-2", "M4.9 19.1l1.4-1.4", "M17.7 6.3l1.4-1.4", "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"],
    moon: ["M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"],
    out: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  };
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {(paths[name] ?? paths.plus).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
