import * as React from "react";
import { Search, Star } from "lucide-react";
import { Project } from "./data";
import { PaneColumn } from "../../layout/PaneColumn";
import { PaneHeader } from "../../layout/PaneHeader";
import { PaneCaret, PaneFooter } from "../../dev/PaneCaret";
import { Input } from "../../ui/input";
import { cn } from "../../ui/utils";

interface ProjectNavigatorProps {
  projects: Project[];
  selectedProjectId: string;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectProject: (projectId: string) => void;
  onCollapse: () => void;
}

export function ProjectNavigator({
  projects,
  selectedProjectId,
  search,
  onSearchChange,
  onSelectProject,
  onCollapse,
}: ProjectNavigatorProps) {
  const lowerSearch = search.trim().toLowerCase();
  const filtered = React.useMemo(() => {
    if (!lowerSearch) return projects;
    return projects.filter((project) =>
      project.name.toLowerCase().includes(lowerSearch) || project.code.toLowerCase().includes(lowerSearch),
    );
  }, [lowerSearch, projects]);

  const pinned = filtered.filter((project) => project.pinned);
  const regular = filtered.filter((project) => !project.pinned);

  return (
    <PaneColumn className="h-full" showRightDivider>
      <PaneHeader role="banner" className="justify-start">
        <h2 className="text-[length:var(--text-base)] font-semibold text-[color:var(--text-primary)]">Projects</h2>
      </PaneHeader>

      <div className="px-[var(--space-4)] py-[var(--space-4)]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-[var(--space-3)] top-1/2 size-4 -translate-y-1/2 text-[color:var(--text-tertiary)]" aria-hidden />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Find a project"
            className="h-9 w-full rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-10"
          />
        </div>
      </div>

      <nav aria-label="Project navigator" className="flex-1 overflow-y-auto px-[var(--space-2)]">
        {pinned.length > 0 ? (
          <ProjectSection label="Pinned" projects={pinned} selectedProjectId={selectedProjectId} onSelectProject={onSelectProject} pinned />
        ) : null}
        <ProjectSection
          label={pinned.length > 0 ? "All projects" : "Projects"}
          projects={regular}
          selectedProjectId={selectedProjectId}
          onSelectProject={onSelectProject}
        />
      </nav>

      <PaneFooter>
        <PaneCaret side="left" label="Hide projects rail" onClick={onCollapse} ariaKeyshortcuts="]" />
      </PaneFooter>
    </PaneColumn>
  );
}

function ProjectSection({
  label,
  projects,
  selectedProjectId,
  onSelectProject,
  pinned = false,
}: {
  label: string;
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  pinned?: boolean;
}) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="mb-[var(--space-4)] px-[var(--space-2)]">
      <p className="mb-[var(--space-2)] text-xs font-medium tracking-wide text-[color:var(--text-tertiary)]">
        {label}
      </p>
      <ul className="space-y-[var(--space-1)]">
        {projects.map((project) => {
          const active = project.id === selectedProjectId;
          return (
            <li key={project.id}>
              <button
                type="button"
                onClick={() => onSelectProject(project.id)}
                className={cn(
                  "flex w-full items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-transparent px-[var(--space-3)] py-[var(--space-2)] text-left",
                  "transition-colors motion-safe:duration-[var(--duration-fast)]",
                  active
                    ? "border-[var(--primary)] bg-[var(--primary-tint-10)] text-[color:var(--text-primary)]"
                    : "hover:bg-[var(--bg-surface-elevated)] text-[color:var(--text-secondary)]",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-[var(--space-1)] text-sm font-medium text-[color:var(--text-primary)]">
                    {project.name}
                    {pinned || project.pinned ? (
                      <Star className="size-3.5 text-[color:var(--warning)]" aria-hidden />
                    ) : null}
                  </span>
                  <span className="mt-1 block text-xs text-[color:var(--text-tertiary)]">
                    {project.code} · Due {formatDue(project.dueDate)} · {Math.round(project.progress * 100)}%
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatDue(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return "TBD";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
