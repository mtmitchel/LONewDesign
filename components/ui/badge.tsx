import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--chip-radius)] text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90 px-2 py-0.5 transition-[color,box-shadow]",
        secondary:
          "border border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 px-2 py-0.5 transition-[color,box-shadow]",
        destructive:
          "border border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 px-2 py-0.5 transition-[color,box-shadow]",
        outline:
          "border border-[var(--chip-border)] text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground px-2 py-0.5 transition-[color,box-shadow]",
        soft:
          "px-[var(--chip-px)] py-[var(--chip-py)] border border-transparent shadow-[var(--chip-inset-shadow)] transition-colors motion-safe:duration-[var(--duration-fast)]",
      },
      tone: {
        high:
          "text-[var(--chip-high-fg)] bg-[var(--chip-high-bg)] hover:bg-[color-mix(in_oklab,var(--priority-high)_calc(14%+var(--chip-hover-bg-boost)),transparent)]",
        medium:
          "text-[var(--chip-medium-fg)] bg-[var(--chip-medium-bg)] hover:bg-[color-mix(in_oklab,var(--priority-medium)_calc(16%+var(--chip-hover-bg-boost)),transparent)]",
        low:
          "text-[var(--chip-low-fg)] bg-[var(--chip-low-bg)] hover:bg-[color-mix(in_oklab,var(--priority-low)_calc(16%+var(--chip-hover-bg-boost)),transparent)]",
        label:
          "text-[var(--chip-label-fg)] bg-[var(--chip-label-bg)] hover:bg-[color-mix(in_oklab,var(--label-neutral)_calc(14%+var(--chip-hover-bg-boost)),transparent)]",
        neutral:
          "text-[var(--chip-text)] bg-[color-mix(in_oklab,var(--text-secondary)_12%,transparent)] hover:bg-[color-mix(in_oklab,var(--text-secondary)_18%,transparent)]",
      },
      size: {
        sm: "text-xs",
        md: "text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      tone: "neutral",
      size: "md",
    },
  },
);

function Badge({
  className,
  variant,
  tone,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, tone, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
