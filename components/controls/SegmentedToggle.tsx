import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import type { LucideIcon } from 'lucide-react';

import { cn } from '../ui/utils';

type SurfaceId = 'tasks' | 'calendar';

type IconType = LucideIcon | React.ComponentType<React.SVGProps<SVGSVGElement>>;

export type SegmentedOption = {
  value: string;
  label: string;
  icon?: IconType;
  title?: string;
  ariaKeyShortcuts?: string;
  disabled?: boolean;
};

type Props = {
  id: string;
  value: string;
  options: SegmentedOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
  dense?: boolean;
  surface?: SurfaceId;
};

type ThumbStyle = React.CSSProperties | null;

export function SegmentedToggle({
  id,
  value,
  options,
  onChange,
  ariaLabel,
  className,
  dense = false,
  surface,
}: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const [thumbStyle, setThumbStyle] = React.useState<ThumbStyle>(null);

  optionRefs.current.length = options.length;

  const updateThumb = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const index = options.findIndex(option => option.value === value);
    if (index === -1) {
      setThumbStyle(null);
      return;
    }

    const active = optionRefs.current[index];
    if (!active) {
      setThumbStyle(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const styles = getComputedStyle(container);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const inset = parseFloat(styles.getPropertyValue('--space-1')) || 4;

    const rawLeft = activeRect.left - containerRect.left;
    const rawRight = containerRect.right - activeRect.right;
    const isFirst = index === 0;
    const isLast = index === options.length - 1;

    const adjustedLeft = rawLeft - (isFirst ? paddingLeft - inset : 0);
    const adjustedRight = rawRight - (isLast ? paddingRight - inset : 0);

    const left = Math.max(isFirst ? inset : 0, adjustedLeft);
    const right = Math.max(isLast ? inset : 0, adjustedRight);

    setThumbStyle({
      left: `${left}px`,
      right: `${right}px`,
      top: `var(--space-1)`,
      bottom: `var(--space-1)`,
    });
  }, [options, value]);

  React.useLayoutEffect(() => {
    updateThumb();
  }, [updateThumb]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => updateThumb();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateThumb]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (typeof ResizeObserver === 'undefined' || !container) return;

    const observer = new ResizeObserver(() => updateThumb());
    observer.observe(container);
    return () => observer.disconnect();
  }, [updateThumb]);

  const handleValueChange = React.useCallback(
    (next: string) => {
      if (!next || next === value) return;
      onChange(next);

      if (surface && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toggle.change', {
            detail: {
              id,
              value: next,
              surface,
              timestamp: Date.now(),
            },
          }),
        );
      }
    },
    [id, onChange, surface, value],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative inline-flex items-center gap-[var(--space-1)]',
        'rounded-[var(--radius-lg)] border border-[var(--control-border)] bg-[var(--control-bg)]',
        'p-[var(--space-1)] shadow-[var(--elevation-sm)]',
        'transition-shadow motion-safe:duration-[var(--duration-quick)] motion-safe:ease-[var(--easing-standard)]',
        className,
      )}
      id={id}
      role="presentation"
    >
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute rounded-[var(--radius-md)]',
          'bg-[var(--control-segment-selected)] transition-all',
          'motion-safe:duration-[var(--duration-quick)] motion-safe:ease-[var(--easing-standard)]',
        )}
        style={{
          opacity: thumbStyle ? 1 : 0,
          ...thumbStyle,
        }}
      />
      <ToggleGroupPrimitive.Root
        type="single"
        value={value}
        onValueChange={handleValueChange}
        aria-label={ariaLabel ?? id}
        className="relative z-10 inline-flex items-center gap-[var(--space-1)]"
        orientation="horizontal"
      >
        {options.map((option, index) => {
          const Icon = option.icon;
          return (
            <ToggleGroupPrimitive.Item
              key={option.value}
              ref={node => {
                optionRefs.current[index] = node;
              }}
              value={option.value}
              className={cn(
                'relative inline-flex min-w-0 items-center justify-center gap-[var(--space-2)]',
                'rounded-[var(--radius-md)] bg-transparent px-[var(--space-3)]',
                dense ? 'py-[var(--space-1)]' : 'py-[var(--space-2)]',
                'text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[color:var(--control-text-muted)]',
                'transition-[color,background,transform] motion-safe:duration-[var(--duration-quick)] motion-safe:ease-[var(--easing-standard)]',
                'hover:bg-[var(--control-segment-bg)] hover:text-[color:var(--control-text)]',
                'data-[state=on]:text-[color:var(--control-text)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--control-ring)] focus-visible:ring-offset-0 focus-visible:ring-inset',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'active:motion-safe:scale-[0.99]',
              )}
              disabled={option.disabled}
              title={option.title}
              aria-keyshortcuts={option.ariaKeyShortcuts}
            >
              <span className="inline-flex min-w-0 items-center gap-[var(--space-2)]">
                {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                <span className="truncate whitespace-nowrap">{option.label}</span>
              </span>
            </ToggleGroupPrimitive.Item>
          );
        })}
      </ToggleGroupPrimitive.Root>
    </div>
  );
}
