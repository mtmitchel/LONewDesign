import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

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
  
  // Color mapping using CSS custom properties
  const getCaretColor = () => {
    if (disabled) return 'var(--caret-disabled)';
    switch (state) {
      case 'active':
        return 'var(--caret-active)';
      case 'hover':
        return 'var(--caret-hover)';
      default:
        return 'var(--caret-rest)';
    }
  };

  const tooltipContent = shortcut ? `${tooltipText} (${shortcut})` : tooltipText;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={`
            w-8 h-8 p-0 mx-auto flex items-center justify-center
            transition-all duration-200 rounded-lg
            hover:bg-[var(--caret-hover-bg)]
            focus-visible:outline-2 focus-visible:outline-[rgba(51,65,85,0.4)] focus-visible:outline-offset-2
            ${className}
          `}
          style={{
            color: getCaretColor()
          }}
          title={tooltipContent}
        >
          <CaretIcon 
            size={16} 
            strokeWidth={1.75}
            style={{ color: getCaretColor() }}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side={direction === 'left' ? 'right' : 'left'}>
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
    <div className={`
      h-10 border-t border-[#E5E7EB]
      flex items-center justify-center
      px-4 py-2
      bg-[var(--bg-surface)]
      ${className}
    `}>
      {children}
    </div>
  );
}