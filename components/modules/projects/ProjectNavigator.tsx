import * as React from "react";
import { Search, Star, Pin, Pencil, Trash2 } from "lucide-react";
import { Project } from "./data";
import { PaneColumn } from "../../layout/PaneColumn";
import { PaneHeader } from "../../layout/PaneHeader";
import { PaneCaret, PaneFooter } from "../../dev/PaneCaret";
import { Input } from "../../ui/input";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../ui/context-menu";

interface ProjectNavigatorProps {
  projects: Project[];
  selectedProjectId: string;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectProject: (projectId: string) => void;
  onCollapse: () => void;
  onProjectAction?: (projectId: string, action: "pin" | "rename" | "delete") => void;
  onCreateProject?: () => void;
}

export function ProjectNavigator({
  projects,
  selectedProjectId,
  search,
  onSearchChange,
  onSelectProject,
  onCollapse,
  onProjectAction,
  onCreateProject,
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
  const totalProjects = pinned.length + regular.length;
  const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  buttonRefs.current.length = totalProjects;

  const registerButton = React.useCallback(
    (index: number) => (node: HTMLButtonElement | null) => {
      buttonRefs.current[index] = node;
    },
    [],
  );

  const handleNavKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
        return;
      }
      const items = buttonRefs.current.filter((item): item is HTMLButtonElement => Boolean(item));
      if (items.length === 0) {
        return;
      }

      const activeElement = document.activeElement as HTMLButtonElement | null;
      let focusIndex = activeElement ? items.indexOf(activeElement) : -1;
      if (focusIndex === -1 && event.key === "ArrowUp") {
        focusIndex = items.length;
      }

      event.preventDefault();

      if (event.key === "ArrowDown") {
        const nextIndex = Math.min(items.length - 1, focusIndex + 1);
        items[nextIndex]?.focus();
      } else {
        const prevIndex = Math.max(0, focusIndex - 1);
        items[prevIndex]?.focus();
      }
    },
    [],
  );

  return (
    <PaneColumn className="h-full" showRightDivider>
      <PaneHeader
        role="banner"
        label="Projects"
        actions={
          onCreateProject ? (
            <Button
              type="button"
              size="sm"
              variant="solid"
              className="gap-[var(--space-1)] px-[var(--space-3)]"
              onClick={onCreateProject}
            >
              + New
            </Button>
          ) : null
        }
      />

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

      <nav
        aria-label="Project navigator"
        className="flex-1 overflow-y-auto px-[var(--space-3)]"
        onKeyDown={handleNavKeyDown}
      >
        {pinned.length > 0 ? (
          <ProjectSection
            label="Pinned"
            projects={pinned}
            selectedProjectId={selectedProjectId}
            onSelectProject={onSelectProject}
            pinned
            startIndex={0}
            registerButton={registerButton}
            onProjectAction={onProjectAction}
          />
        ) : null}
        <ProjectSection
          label={pinned.length > 0 ? "All projects" : "Projects"}
          projects={regular}
          selectedProjectId={selectedProjectId}
          onSelectProject={onSelectProject}
          startIndex={pinned.length}
          registerButton={registerButton}
          onProjectAction={onProjectAction}
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
  startIndex,
  registerButton,
  onProjectAction,
}: {
  label: string;
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  pinned?: boolean;
  startIndex: number;
  registerButton: (index: number) => (node: HTMLButtonElement | null) => void;
  onProjectAction?: (projectId: string, action: "pin" | "rename" | "delete") => void;
}) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="mb-[var(--space-4)]">
      <p className="mb-[var(--space-2)] px-[var(--project-nav-pad-x)] text-xs font-medium tracking-wide text-[color:var(--text-tertiary)]">
        {label}
      </p>
      <ul className="space-y-[var(--project-nav-gap)]">
        {projects.map((project, index) => {
          const navIndex = startIndex + index;
          const active = project.id === selectedProjectId;
          return (
            <li key={project.id}>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <ProjectNavItem
                    ref={registerButton(navIndex)}
                    name={project.name}
                    pinned={pinned || project.pinned}
                    selected={active}
                    onClick={() => onSelectProject(project.id)}
                    onContextMenu={() => onSelectProject(project.id)}
                    title={project.code ? `${project.name} (${project.code})` : project.name}
                    navIndex={navIndex}
                  />
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuItem onSelect={() => onProjectAction?.(project.id, "pin")}>
                    <div className="flex items-center gap-[var(--space-2)]">
                      <Pin className="h-4 w-4" aria-hidden />
                      <span>Pin</span>
                    </div>
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => onProjectAction?.(project.id, "rename")}>
                    <div className="flex items-center gap-[var(--space-2)]">
                      <Pencil className="h-4 w-4" aria-hidden />
                      <span>Rename</span>
                    </div>
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => onProjectAction?.(project.id, "delete")} variant="destructive">
                    <div className="flex items-center gap-[var(--space-2)]">
                      <Trash2 className="h-4 w-4" aria-hidden />
                      <span>Delete</span>
                    </div>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export type ProjectNavItemProps = Omit<React.ComponentPropsWithoutRef<"button">, "children"> & {
  name: string;
  pinned?: boolean;
  selected?: boolean;
  navIndex: number;
};

export const ProjectNavItem = React.forwardRef<HTMLButtonElement, ProjectNavItemProps>(function ProjectNavItem(
  { name, pinned, selected, title, navIndex, className, ...buttonProps },
  ref,
) {
  const { type = "button", ...restButtonProps } = buttonProps;

  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "group w-full text-left",
        "grid grid-cols-[1fr_auto] items-center gap-[var(--project-nav-gap)]",
        "h-[var(--project-nav-item-h)] rounded-[var(--radius-md)] px-[var(--project-nav-pad-x)]",
        "text-sm transition-colors",
        selected
          ? "border border-transparent bg-[var(--primary)] text-white shadow-[inset_0_0_0_1px_hsla(0,0%,100%,0.18)]"
          : "border border-transparent text-[color:var(--text-primary)] hover:bg-[var(--primary-tint-10)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]",
        className,
      )}
      aria-current={selected ? "page" : undefined}
      title={title ?? name}
      data-nav-index={navIndex}
      {...restButtonProps}
    >
      <span className={cn("truncate", selected ? "text-white" : "text-[color:var(--text-primary)]")}>{name}</span>
      {pinned ? (
        <Star
          className={cn(
            "size-[var(--icon-sm)]",
            selected ? "text-white" : "text-[var(--accent-coral)]",
          )}
          aria-label="Pinned"
        />
      ) : null}
    </button>
  );
});
