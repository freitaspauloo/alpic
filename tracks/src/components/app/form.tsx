import { Button } from "@/components/ui/button";
import { Input } from "@/components/motion/input";
import { cn } from "@/lib/utils";
import type { ReactNode, TextareaHTMLAttributes } from "react";

export const nativeSelectClassName =
  "h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function FormShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid max-w-2xl gap-4", className)}>{children}</div>;
}

export function TextField({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
  required,
  autoFocus,
  type = "text",
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  type?: string;
}) {
  return (
    <div className="grid gap-1">
      <Input
        id={id}
        label={label}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function TextAreaField({
  id,
  label,
  hint,
  rows = 4,
  value,
  onChange,
  required,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  rows?: number;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-20 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
      />
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

export function FormActions({
  onCancel,
  submitLabel,
  submitDisabled,
}: {
  onCancel: () => void;
  submitLabel: string;
  submitDisabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2 pt-2">
      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={submitDisabled}>
        {submitLabel}
      </Button>
    </div>
  );
}

export function MenuButton({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Button type="button" variant="ghost" size="sm" className={cn("h-7 px-2 text-xs", className)} onClick={onClick}>
      {children}
    </Button>
  );
}

export function ChipToggle({
  pressed,
  onClick,
  children,
}: {
  pressed?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={pressed ? "secondary" : "outline"}
      size="sm"
      aria-pressed={pressed}
      className="rounded-full"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

/** @deprecated use TextAreaField props directly */
export type LegacyTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;
