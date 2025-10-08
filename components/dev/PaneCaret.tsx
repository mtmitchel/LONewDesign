import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../ui/utils';

type PaneSide = 'left' | 'right';

interface ModernPaneCaretProps {
  side: PaneSide;
  label: string;
  onClick: () => void;
  ariaKeyshortcuts?: string;
  variant?: 'rail' | 'button';
  disabled?: boolean;
  className?: string;
}

interface LegacyPaneCaretProps {
  direction: PaneSide;
  state?: 'rest' | 'hover' | 'active' | 'focus' | 'disabled';
  onClick: () => void;
  tooltipText: string;
  shortcut?: string;
  disabled?: boolean;
  className?: string;
}

type PaneCaretProps = ModernPaneCaretProps | LegacyPaneCaretProps;

function isModernProps(props: PaneCaretProps): props is ModernPaneCaretProps {
  return (props as ModernPaneCaretProps).label !== undefined;
}

const railBase = 'group grid h-full place-items-center w-[20px] min-w-[20px] max-w-[20px]';

export function PaneCaret(props: PaneCaretProps) {
  if (isModernProps(props)) {
    const {
      side,
      label,
      onClick,
      ariaKeyshortcuts,
      variant = 'rail',
      disabled = false,
      className = '',
    } = props;

    const Icon = side === 'left' ? ChevronRight : ChevronLeft;
    const tooltip = ariaKeyshortcuts ? `${label} (${ariaKeyshortcuts})` : label;

    if (variant === 'rail') {
      const tooltipSide = side === 'left' ? 'right' : 'left';

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onClick}
              disabled={disabled}
              aria-label={label}
              {...(ariaKeyshortcuts ? { 'aria-keyshortcuts': ariaKeyshortcuts } : {})}
              className={cn(
                railBase,
                side === 'left'
                  ? 'border-r border-[var(--border-subtle)]'
                  : 'border-l border-[var(--border-subtle)]',
                'bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-base)] ease-[var(--easing-standard)]',
                'hover:bg-[var(--primary-tint-5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]',
                disabled && 'opacity-60 pointer-events-none hover:bg-[var(--bg-surface-elevated)]',
                className
              )}
            >
              <Icon
                aria-hidden="true"
                strokeWidth={2}
                className="size-[18px] text-[var(--caret-rest)] motion-safe:transition-transform duration-[var(--duration-base)] ease-[var(--easing-standard)] group-hover:text-[var(--caret-hover)] group-hover:scale-110"
              />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side={tooltipSide}
            sideOffset={12}
            className="motion-safe:transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)] px-[var(--space-3)] py-[var(--space-2)] text-sm"
          >
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    const tooltipSide = side === 'left' ? 'right' : 'left';

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className={cn(
              'grid h-8 w-8 place-items-center rounded-full p-0 text-[var(--caret-rest)]',
              'transition-colors duration-[var(--duration-base)] ease-[var(--easing-standard)]',
              'hover:text-[var(--caret-hover)] active:text-[var(--caret-active)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]',
              disabled && 'pointer-events-none opacity-60',
              className
            )}
            {...(ariaKeyshortcuts ? { 'aria-keyshortcuts': ariaKeyshortcuts } : {})}
          >
            <Icon className="size-[18px]" strokeWidth={2} aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={tooltipSide}
          sideOffset={12}
          className="motion-safe:transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)] px-[var(--space-3)] py-[var(--space-2)] text-sm"
        >
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const {
    direction,
    state = 'rest',
    onClick,
    tooltipText,
    shortcut,
    disabled = false,
    className = '',
  } = props as LegacyPaneCaretProps;

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
            'transition-colors duration-[var(--duration-base)] ease-[var(--easing-standard)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(51,65,85,0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]',
            stateColorClass,
            disabled && 'pointer-events-none opacity-60',
            className
          )}
        >
          <CaretIcon
            className="size-[18px]"
            strokeWidth={2}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side={direction === 'left' ? 'right' : 'left'}
        sideOffset={12}
        className="motion-safe:transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)] px-[var(--space-3)] py-[var(--space-2)] text-sm"
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