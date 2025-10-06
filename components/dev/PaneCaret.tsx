import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../ui/utils';

interface PaneCaretProps {
  /** Direction the caret points - affects visual direction and collapse behavior */
  direction: 'left' | 'right';
  /** Current state of the pane */
  state?: 'rest' | 'hover' | 'active' | 'focus' | 'disabled';
  /** Click handler for toggle action */
  onClick: () => void;
  /** Tooltip text to display on hover */
  tooltipText: string;
  /** Optional keyboard shortcut to display in tooltip */
  shortcut?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Custom className for additional styling */
  className?: string;
}

export function PaneCaret({ 
  direction, 
  state = 'rest', 
  onClick, 
  tooltipText, 
  shortcut,
  disabled = false,
  className = ''
}: PaneCaretProps) {
  const CaretIcon = direction === 'left' ? ChevronLeft : ChevronRight;

  const tooltipContent = shortcut ? `${tooltipText} (${shortcut})` : tooltipText;
  const stateColorClass = disabled
    ? 'text-[var(--caret-disabled)]'
    : state === 'active'
      ? 'text-[var(--caret-active)]'
      : state === 'hover' || state === 'focus'
        ? 'text-[var(--caret-hover)]'
        : 'text-[var(--caret-rest)]';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'w-6 h-6 p-0 mx-auto flex items-center justify-center rounded-full',
            'text-[var(--caret-rest)] hover:text-[var(--caret-hover)] active:text-[var(--caret-active)]',
            'hover:bg-[var(--caret-hover-bg)] motion-safe:transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)]',
            'hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(51,65,85,0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]',
            stateColorClass,
            disabled && 'pointer-events-none opacity-60 hover:scale-100 hover:bg-transparent',
            className
          )}
          title={tooltipContent}
        >
          <CaretIcon 
            className="w-3.5 h-3.5"
            strokeWidth={1.75}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side={direction === 'left' ? 'right' : 'left'}
        sideOffset={12}
        className="motion-safe:transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)]"
      >
        <p>{tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * PaneFooter component - standardized 40px footer for pane toggles
 */
interface PaneFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function PaneFooter({ children, className = '' }: PaneFooterProps) {
  return (
    <div
      className={cn(
        'h-10 border-t border-[var(--border-default)] flex items-center justify-center px-4 py-2 bg-[var(--bg-surface)]',
        className
      )}
    >
      {children}
    </div>
  );
}