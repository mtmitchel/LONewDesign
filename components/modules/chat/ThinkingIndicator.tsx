import React from 'react';
import { cn } from '../../ui/utils';

interface ThinkingIndicatorProps {
  modelName?: string;
  className?: string;
}

export function ThinkingIndicator({ modelName = 'Assistant', className }: ThinkingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex gap-1">
        <span className="animate-pulse inline-block w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]" 
              style={{ animationDelay: '0ms' }} />
        <span className="animate-pulse inline-block w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]" 
              style={{ animationDelay: '150ms' }} />
        <span className="animate-pulse inline-block w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]" 
              style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-[var(--text-tertiary)]">
        {modelName} is thinking
      </span>
    </div>
  );
}

export function StreamingIndicator({ modelName = 'Assistant', className }: ThinkingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg 
        className="animate-spin h-3 w-3 text-[var(--text-tertiary)]" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="text-xs text-[var(--text-tertiary)]">
        {modelName} is responding
      </span>
    </div>
  );
}
