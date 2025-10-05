"use client";

import * as React from "react";
import { cn } from "../ui/utils";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'secondary';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const variantClasses = {
  default: 'text-[var(--text-secondary)]',
  primary: 'text-[var(--primary)]',
  secondary: 'text-[var(--text-primary)]'
};

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  className
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin inline-block rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  children,
  message = "Loading...",
  className
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      
      {isLoading && (
        <div className="absolute inset-0 bg-[var(--surface)]/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <LoadingSpinner size="lg" variant="primary" />
            {message && (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export type { LoadingSpinnerProps, LoadingOverlayProps };