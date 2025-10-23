import { Plus } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-[var(--space-4)] py-[var(--space-8)] text-center">
      <div className="rounded-full bg-[var(--bg-muted)] p-[var(--space-4)]">
        <Plus className="h-6 w-6 text-[color:var(--text-muted)]" aria-hidden="true" />
      </div>
      <div className="space-y-[var(--space-1)]">
        <p className="text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[color:var(--text-primary)]">
          No tasks
        </p>
        <p className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)]">
          Add a task to get started.
        </p>
      </div>
    </div>
  );
}
