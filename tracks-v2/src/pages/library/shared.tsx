import { Fragment, useCallback, useEffect, useId, useRef, useState, type ComponentType, type FormEvent, type ReactNode } from "react";
import { MoreHorizontal, Plus, Search, X, type LucideIcon } from "lucide-react";
import { MenuAction, MenuSeparator } from "@/app/menu";
import { PageSection } from "@/app/page-layout";
import { useToast } from "@/app/toast";
import { Button } from "@/components/motion/button/base";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/motion/card";
import {
  CenterMorphModal,
  CenterMorphModalClose,
  CenterMorphModalContent,
} from "@/components/motion/center-morph-modal";
import { Drawer } from "@/components/motion/drawer";
import { Input } from "@/components/motion/input";
import { MorphPopover, MorphPopoverContent, MorphPopoverTrigger } from "@/components/motion/popover-morph";
import { Table, type TableColumn } from "@/components/motion/table";
import { Tooltip } from "@/components/motion/tooltip";
import { cn } from "@/lib/utils";

export const ROW_HEIGHT = 60;

export function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

/** CodeBlock never soft-wraps (its `pre` is `min-w-max`), so generated prose is wrapped here. */
export function wrapText(text: string, width = 60) {
  return text
    .split("\n")
    .map((line) => {
      const out: string[] = [];
      let current = "";
      for (const word of line.split(" ")) {
        if (current && current.length + word.length + 1 > width) {
          out.push(current);
          current = word;
        } else {
          current = current ? `${current} ${word}` : word;
        }
      }
      out.push(current);
      return out.join("\n");
    })
    .join("\n");
}

export function matches(query: string, ...fields: string[]) {
  const needle = query.trim().toLowerCase();
  return !needle || fields.some((field) => field.toLowerCase().includes(needle));
}

/**
 * Tracks one record shown in a drawer or modal. Keeps the last record around
 * after it closes (or is removed) so the exit animation still has content.
 */
export function useRecord<T extends { id: string }>(items: T[]) {
  const [id, setId] = useState<string | null>(null);
  const last = useRef<T | null>(null);
  const live = id ? (items.find((item) => item.id === id) ?? null) : null;
  if (live) last.current = live;
  const hide = useCallback(() => setId(null), []);
  return { open: live !== null, item: live ?? last.current, show: setId, hide };
}

export function useCopy() {
  const { toast } = useToast();
  return useCallback(
    async (text: string, what: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: `${what} copied to clipboard.`, status: "success" });
      } catch {
        toast({ title: "Couldn't copy", description: "Your browser blocked clipboard access.", status: "error" });
      }
    },
    [toast],
  );
}

/* ───────────────────────── Page body ───────────────────────── */

export function IconTile({
  icon: Icon,
  size = "md",
  className,
  strokeWidth,
}: {
  icon: LucideIcon | ComponentType<{ className?: string; strokeWidth?: number }>;
  size?: "md" | "lg";
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-xl border border-border bg-muted text-muted-foreground",
        size === "lg" ? "size-10" : "size-8 rounded-lg",
        className,
      )}
    >
      <Icon className="size-4" strokeWidth={strokeWidth} />
    </span>
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button size="sm" onClick={onClick}>
      <Plus aria-hidden="true" className="size-4" />
      {label}
    </Button>
  );
}

/** The one empty state for every library page: a muted card, one sentence, one action. */
export function LibraryEmpty({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Card variant="muted" className="items-center py-14 text-center">
      <IconTile icon={icon} size="lg" className="bg-background" />
      <CardHeader className="justify-items-center">
        <CardTitle as="h2">{title}</CardTitle>
        <CardDescription className="max-w-sm">{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <AddButton label={actionLabel} onClick={onAction} />
      </CardFooter>
    </Card>
  );
}

/** Search, optional filters and a count above the table. */
export function LibraryToolbar({
  query,
  onQueryChange,
  placeholder,
  summary,
  children,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder: string;
  summary: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        value={query}
        onChange={onQueryChange}
        placeholder={placeholder}
        aria-label={placeholder}
        leftIcon={<Search />}
        className="w-full sm:w-72"
      />
      {children}
      <span className="ml-auto text-xs text-muted-foreground tabular-nums">{summary}</span>
    </div>
  );
}

/** beUI Table sized to its rows, so short lists don't leave a tall empty viewport. */
export function LibraryTable<T extends { id: string }>({
  rows,
  columns,
  noMatches,
  defaultSortKey = "name",
}: {
  rows: T[];
  columns: TableColumn<T>[];
  noMatches: ReactNode;
  defaultSortKey?: string;
}) {
  const height = rows.length ? (rows.length + 1) * ROW_HEIGHT + 2 : ROW_HEIGHT + 120;
  return (
    <Table
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      rowHeight={ROW_HEIGHT}
      height={Math.min(height, 12 * ROW_HEIGHT)}
      defaultSort={{ key: defaultSortKey, direction: "asc" }}
      emptyState={<span className="text-sm">{noMatches}</span>}
      className="rounded-2xl"
    />
  );
}

export function LibraryBody({ children }: { children: ReactNode }) {
  return <PageSection>{children}</PageSection>;
}

/** Primary cell: icon, a name that opens the details drawer, and a muted second line. */
export function NameCell({
  icon,
  name,
  detail,
  mono,
  onOpen,
}: {
  icon: LucideIcon;
  name: string;
  detail?: ReactNode;
  mono?: boolean;
  onOpen: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <IconTile icon={icon} />
      <div className="flex min-w-0 flex-col">
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            "truncate text-left text-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:underline",
            mono && "font-mono",
          )}
        >
          {name}
        </button>
        {detail ? <span className="truncate text-xs text-muted-foreground">{detail}</span> : null}
      </div>
    </div>
  );
}

export type RowAction = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  /** Draw a separator above this row. */
  separated?: boolean;
};

/** Overflow menu for one table row. */
export function RowActions({ name, actions }: { name: string; actions: RowAction[] }) {
  const [open, setOpen] = useState(false);
  return (
    <MorphPopover open={open} onOpenChange={setOpen}>
      <MorphPopoverTrigger>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${name}`}>
          <MoreHorizontal aria-hidden="true" className="size-4" />
        </Button>
      </MorphPopoverTrigger>
      <MorphPopoverContent side="bottom" align="end" sideOffset={6} radius={12} className="w-52 p-1.5">
        {actions.map((action) => (
          <Fragment key={action.label}>
            {action.separated ? <MenuSeparator /> : null}
            <MenuAction
              icon={action.icon}
              onSelect={() => {
                setOpen(false);
                action.onSelect();
              }}
            >
              {action.label}
            </MenuAction>
          </Fragment>
        ))}
      </MorphPopoverContent>
    </MorphPopover>
  );
}

export const ACTIONS_COLUMN = { key: "actions", header: "", align: "right", width: "64px" } as const;

/* ───────────────────────── Details drawer ───────────────────────── */

export function DetailDrawer({
  open,
  onOpenChange,
  icon,
  title,
  subtitle,
  mono,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  title: string;
  subtitle?: ReactNode;
  mono?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} side="right" ariaLabel={title} className="w-[34rem] max-w-[92vw]">
      <div className="flex items-start gap-3 border-b border-border px-5 py-4">
        <IconTile icon={icon} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
          <h2 className={cn("truncate text-base font-semibold text-foreground", mono && "font-mono")}>{title}</h2>
          {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <Tooltip content="Close" side="bottom">
          <Button variant="ghost" size="icon" aria-label="Close details" onClick={() => onOpenChange(false)}>
            <X aria-hidden="true" className="size-4" />
          </Button>
        </Tooltip>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">{children}</div>
      {footer ? <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-4">{footer}</div> : null}
    </Drawer>
  );
}

export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 text-sm">
      {items.map((item) => (
        <Fragment key={item.label}>
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="min-w-0 text-foreground">{item.value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

export function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

/* ───────────────────────── Modals ───────────────────────── */

function ModalHeading({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 pr-8">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

/** Create dialog shell. The caller owns the fields and validation. */
export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  onSubmit,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  submitLabel: string;
  onSubmit: () => void;
  children: ReactNode;
}) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel={title} className="max-w-lg">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5 p-6">
          <ModalHeading title={title} description={description} />
          {children}
          <div className="flex justify-end gap-2 pt-1">
            <CenterMorphModalClose>
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
            </CenterMorphModalClose>
            <Button type="submit" size="sm">
              {submitLabel}
            </Button>
          </div>
        </form>
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  children,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel={title} className="max-w-md">
        <div className="flex flex-col gap-5 p-6">
          <ModalHeading title={title} />
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">{children}</div>
          <div className="flex justify-end gap-2">
            <CenterMorphModalClose>
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
            </CenterMorphModalClose>
            <Button size="sm" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
}

/** Resets a form's fields every time its modal opens. */
export function useResetOnOpen(open: boolean, reset: () => void) {
  const latest = useRef(reset);
  latest.current = reset;
  useEffect(() => {
    if (open) latest.current();
  }, [open]);
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="-mt-3.5 px-1 text-xs text-muted-foreground">{children}</p>;
}

/** No beUI textarea is installed; this follows the textarea recipe in CONVENTIONS.md. */
export function TextAreaField({
  label,
  value,
  onChange,
  error,
  placeholder,
  mono,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  mono?: boolean;
  rows?: number;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="px-1 text-sm font-medium text-foreground">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        spellCheck={!mono}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "min-h-32 w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring",
          mono && "font-mono text-xs leading-5",
          error && "border-destructive ring-2 ring-destructive/25",
        )}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="px-1 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
