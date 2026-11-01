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
  /** Primary page actions, right-aligned next to the title (beUI Buttons). */
  actions?: ReactNode;
  width?: keyof typeof WIDTH;
  children?: ReactNode;
  className?: string;
}

/** Every routed page renders inside one Page: header first, then sections stacked with gap-8. */
export function Page({ title, description, actions, width = "default", children, className }: PageProps) {
  return (
    <div
      className={cn("mx-auto flex w-full flex-col", WIDTH[width], className)}
      style={{ gap: "var(--space-section)", padding: "var(--space-page)" }}
    >
      <PageHeader title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1
          className="font-semibold text-foreground"
          style={{ fontSize: "var(--text-title)", letterSpacing: "var(--tracking-title)" }}
        >
          {title}
        </h1>
        {description ? <p className="max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center" style={{ gap: "var(--space-control)" }}>
          {actions}
        </div>
      ) : null}
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
              <h2 className="font-semibold text-foreground" style={{ fontSize: "var(--text-section)" }}>
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
