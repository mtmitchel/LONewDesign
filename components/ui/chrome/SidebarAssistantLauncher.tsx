import { Sparkles } from 'lucide-react';

import { cn } from '../utils';

type SidebarAssistantLauncherProps = {
  collapsed: boolean;
  onOpen: () => void;
  className?: string;
};

export function SidebarAssistantLauncher({ collapsed, onOpen, className }: SidebarAssistantLauncherProps) {
  return (
    <div
      className={cn(
        'flex w-full justify-center',
        collapsed ? 'px-[var(--space-2)]' : 'px-[var(--sidebar-gutter)]',
        className,
      )}
      role="region"
      aria-label="Assistant"
      data-collapsed={collapsed ? 'true' : undefined}
    >
      <button
        type="button"
        onClick={onOpen}
        title="Add (⌘/Ctrl+K)"
        aria-label="Add"
        aria-keyshortcuts="Meta+K,Control+K"
        className={cn(
          'grid place-items-center',
          'h-[var(--launcher-closed-size)] w-[var(--launcher-closed-size)]',
          'rounded-[var(--radius-full)] shadow-[var(--launcher-elevation)]',
          'bg-[var(--primary)] text-[var(--primary-foreground)]',
          'hover:opacity-95 focus:outline-none',
          'focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30',
          'transition-opacity motion-safe:duration-[var(--duration-fast)]',
        )}
      >
        <Sparkles className="h-[var(--launcher-icon)] w-[var(--launcher-icon)]" aria-hidden="true" />
      </button>
    </div>
  );
}

export default SidebarAssistantLauncher;
