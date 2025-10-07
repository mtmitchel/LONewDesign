"use client";

import * as React from "react";
import { cn } from "../ui/utils";
import { Button } from "../ui/button";

interface EmptyStateProps {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  children
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center py-12 px-4",
      className
    )}>
      {Icon && (
        <div className="mb-4">
          <Icon 
            size={64} 
            className="text-[var(--text-secondary)] opacity-50" 
          />
        </div>
      )}
      
      {title && (
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {children}
      
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button 
              onClick={action.onClick}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
            >
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button 
              variant="outline" 
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export type { EmptyStateProps };