import * as React from "react";
import { Link, ListTodo, NotebookPen, Calendar, MessageCircle, Brain } from "lucide-react";
import { PaneColumn } from "../../layout/PaneColumn";
import { PaneHeader } from "../../layout/PaneHeader";
import { PaneCaret, PaneFooter } from "../../dev/PaneCaret";
import { Button } from "../../ui/button";
import { cn } from "../../ui/utils";

interface ProjectContextPanelProps {
  onCollapse: () => void;
}

export function ProjectContextPanel({ onCollapse }: ProjectContextPanelProps) {
  return (
    <PaneColumn className="h-full" showLeftDivider showRightDivider={false}>
      <PaneHeader role="tablist" className="justify-between px-[var(--panel-pad-x)]">
        <div className="flex items-center gap-[var(--space-4)] text-sm font-medium text-[color:var(--text-secondary)]">
          <button type="button" className="relative pb-2 text-[color:var(--text-primary)]">
            Context
            <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-[var(--primary)]" aria-hidden />
          </button>
          <button type="button" className="relative pb-2 text-[color:var(--text-tertiary)] opacity-80" disabled>
            Settings
          </button>
        </div>
        <PaneCaret side="right" label="Hide context" variant="button" onClick={onCollapse} ariaKeyshortcuts="\\" />
      </PaneHeader>

      <div className="flex-1 overflow-y-auto px-[var(--panel-pad-x)] py-[var(--panel-pad-y)]">
        <ContextSection title="Create link" icon={<Link className="size-4" aria-hidden />}>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {chips.map((chip) => (
              <Button
                key={chip}
                variant="outline"
                size="sm"
                className="rounded-full border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[color:var(--text-secondary)]"
              >
                {chip}
              </Button>
            ))}
          </div>
        </ContextSection>

        <ContextSection title="Related notes" icon={<NotebookPen className="size-4" aria-hidden />}>
          <PlaceholderBody label="No related notes yet" hint="Link a note or capture one with the assistant." />
        </ContextSection>

        <ContextSection title="Related tasks" icon={<ListTodo className="size-4" aria-hidden />}>
          <PlaceholderBody label="No tasks attached" hint="Drag a task here or create one from the project overview." />
        </ContextSection>

        <ContextSection title="Upcoming events" icon={<Calendar className="size-4" aria-hidden />}>
          <ul className="space-y-[var(--space-2)] text-sm text-[color:var(--text-secondary)]">
            <li className="flex items-center justify-between">
              <span>Sync with success team</span>
              <span className="text-xs text-[color:var(--text-tertiary)]">Oct 15 · 2:00 PM</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Dashboard QA sweep</span>
              <span className="text-xs text-[color:var(--text-tertiary)]">Oct 17 · 10:30 AM</span>
            </li>
          </ul>
        </ContextSection>

        <ContextSection title="Threads" icon={<MessageCircle className="size-4" aria-hidden />}>
          <ul className="space-y-[var(--space-2)] text-sm text-[color:var(--text-secondary)]">
            <li className="flex items-center justify-between">
              <span>#project-uui</span>
              <span className="text-xs text-[color:var(--text-tertiary)]">3 new</span>
            </li>
            <li className="flex items-center justify-between">
              <span>#feedback-uui</span>
              <span className="text-xs text-[color:var(--text-tertiary)]">1 follow-up</span>
            </li>
          </ul>
        </ContextSection>

        <ContextSection title="AI suggestions" icon={<Brain className="size-4" aria-hidden />}>
          <PlaceholderBody label="Assistant is learning" hint="Run captures or link work to see tailored suggestions." />
        </ContextSection>

        <ContextSection title="Backlinks" icon={<Link className="size-4" aria-hidden />}>
          <PlaceholderBody label="No backlinks yet" hint="Items that reference this project will appear here." />
        </ContextSection>
      </div>

      <PaneFooter>
        <PaneCaret side="right" label="Hide context" onClick={onCollapse} ariaKeyshortcuts="\\" />
      </PaneFooter>
    </PaneColumn>
  );
}

const chips = ["Add note", "Attach task", "Schedule", "Link file"];

function ContextSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-[var(--space-6)]">
      <header className="mb-[var(--space-3)] flex items-center gap-[var(--space-2)] text-xs font-semibold uppercase tracking-wide text-[color:var(--text-tertiary)]">
        <span className="grid size-6 place-items-center rounded-full bg-[var(--bg-surface-elevated)] text-[color:var(--text-secondary)]">
          {icon}
        </span>
        {title}
      </header>
      <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--space-4)]">
        {children}
      </div>
    </section>
  );
}

function PlaceholderBody({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="text-sm text-[color:var(--text-secondary)]">
      <p className="font-medium text-[color:var(--text-primary)]">{label}</p>
      <p className="text-xs text-[color:var(--text-tertiary)]">{hint}</p>
    </div>
  );
}
