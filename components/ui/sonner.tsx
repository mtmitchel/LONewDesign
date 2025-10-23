"use client";

import type { CSSProperties } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const baseToastStyle: CSSProperties = {
  maxWidth: "360px",
  width: "min(360px, calc(100vw - 48px))",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border-subtle)",
  background: "var(--bg-surface)",
  color: "var(--text-primary)",
  boxShadow: "var(--elevation-sm)",
};

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
  className="toaster group"
  position="top-center"
  expand={false}
  richColors={false}
      closeButton
      // Default duration: 3 seconds for all toast types
      duration={3000}
      toastOptions={{
        // Define default duration for all toasts
        duration: 3000,
        style: baseToastStyle,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
