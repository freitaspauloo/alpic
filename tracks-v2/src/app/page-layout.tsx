import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const WIDTH = {
  default: "max-w-6xl",
  narrow: "max-w-3xl",
  wide: "max-w-7xl",
} as const;

export interface PageProps {
  title: ReactNode;
  description?: ReactNode;
  /** Quiet status on the description line, opposite the description. */
  meta?: ReactNode;
  /** Primary page actions, right-aligned on the title line (beUI Buttons). */
  actions?: ReactNode;
  width?: keyof typeof WIDTH;
  children?: ReactNode;
  className?: string;
}

/** Every routed page renders inside one Page: header first, then sections stacked with gap-8. */
export function Page({ title, description, meta, actions, width = "default", children, className }: PageProps) {
  return (
    <div
      className={cn("mx-auto flex w-full flex-col", WIDTH[width], className)}
      style={{ gap: "var(--space-section)", padding: "var(--space-page)" }}
    >
      <PageHeader title={title} description={description} meta={meta} actions={actions} />
      {children}
    </div>
  );
}

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, meta, actions }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-8">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1
          className="text-foreground"
          style={{
            fontSize: "var(--text-title)",
            fontWeight: "var(--font-weight-display)",
            lineHeight: 1,
            letterSpacing: "var(--tracking-title)",
          }}
        >
          {title}
        </h1>
        {description || meta ? (
          <p className="text-sm leading-5 text-muted-foreground">
            {description}
            {description && meta ? <span className="px-2 text-border">·</span> : null}
            {meta}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex h-9 shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export interface PageSectionProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** A titled block inside a Page (e.g. "Transactions" under the billing stats). */
export function PageSection({ title, description, actions, children, className }: PageSectionProps) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      {title || actions ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            {title ? (
              <h2
                className="text-foreground"
                style={{ fontSize: "var(--text-section)", fontWeight: "var(--font-weight-display)", lineHeight: "var(--leading-title)" }}
              >
                {title}
              </h2>
            ) : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
