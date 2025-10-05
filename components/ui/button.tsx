import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]",
  {
    variants: {
      variant: {
        // Solid - primary accent background
        solid: "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm",
        // Tonal - primary color with light background (Asana-style)
        tonal: "bg-[var(--primary-tint-10)] text-[var(--primary)] hover:bg-[var(--primary-tint-20)] border border-transparent",
        // Ghost - transparent with subtle hover (Sunsama-style)
        ghost: "bg-transparent text-[var(--text-primary)] hover:bg-[var(--hover-bg)] border border-transparent",
        // Danger - for destructive actions
        danger: "bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90 shadow-sm",
        // Outline - subtle border variant
        outline: "border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]",
        // Legacy compatibility
        default: "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm",
        destructive: "bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90 shadow-sm",
        secondary: "bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]/80",
        link: "text-[var(--primary)] underline-offset-4 hover:underline bg-transparent",
      },
      size: {
        // Comfortable density for long sessions (Asana-style)
        default: "h-9 px-[var(--space-4)] py-2 has-[>svg]:px-[var(--space-3)]",
        sm: "h-8 rounded-[var(--radius-sm)] gap-1.5 px-[var(--space-3)] has-[>svg]:px-[var(--space-2)]",
        lg: "h-10 rounded-[var(--radius-sm)] px-[var(--space-6)] has-[>svg]:px-[var(--space-4)]",
        icon: "size-9 rounded-[var(--radius-sm)]",
        // Compact for toolbars and dense interfaces
        compact: "h-7 px-[var(--space-2)] py-1 text-xs has-[>svg]:px-[var(--space-1)]",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "default",
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
