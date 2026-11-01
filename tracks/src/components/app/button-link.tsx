import { Link, type LinkProps } from "react-router-dom";
import { Button, type buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
type ButtonSize = VariantProps<typeof buttonVariants>["size"];

export function ButtonLink({
  to,
  variant = "default",
  size = "default",
  className,
  children,
  ...props
}: LinkProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Button
      render={<Link to={to} {...props} />}
      nativeButton={false}
      variant={variant}
      size={size}
      className={className}
    >
      {children}
    </Button>
  );
}

export function CtaButtonLink({
  to,
  className,
  children,
  ...props
}: LinkProps & { className?: string; children: ReactNode }) {
  return (
    <ButtonLink
      to={to}
      className={cn(
        "bg-[var(--cta)] text-[#051413] hover:bg-[var(--cta)]/90 dark:text-[#051413]",
        className,
      )}
      {...props}
    >
      {children}
    </ButtonLink>
  );
}
