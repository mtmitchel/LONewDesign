"use client";

import * as React from "react";
import { TriPane } from "../TriPane";
import { PaneColumn } from "../layout/PaneColumn";
import { PaneHeader } from "../layout/PaneHeader";
import { PaneCaret } from "../dev/PaneCaret";
import { ProjectNavigator } from "./projects/ProjectNavigator";
import { ProjectOverview } from "./projects/ProjectOverview";
import { ProjectContextPanel } from "./projects/ProjectContextPanel";
import { ProjectTasksBoard } from "./projects/ProjectTasksBoard";
import {
  projects,
  getProjectById,
  getArtifactsForProject,
  getMilestonesForProject,
  getTaskListsForProject,
  getTasksForProject,
  ProjectTask,
  ProjectTaskList,
} from "./projects/data";
import { openQuickAssistant } from "../assistant";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "notes", label: "Notes" },
  { id: "files", label: "Files" },
  { id: "canvas", label: "Canvas" },
  { id: "chat", label: "Chat" },
  { id: "emails", label: "Emails" },
];

export function ProjectsModule() {
  const [leftPaneVisible, setLeftPaneVisible] = React.useState(true);
  const [rightPaneVisible, setRightPaneVisible] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string>("overview");
  const [search, setSearch] = React.useState("");
  const [selectedProjectId, setSelectedProjectId] = React.useState(() => projects[0]?.id ?? "");
  const taskListsByProject = React.useMemo<Record<string, ProjectTaskList[]>>(() => {
    const map: Record<string, ProjectTaskList[]> = {};
    projects.forEach((project) => {
      map[project.id] = getTaskListsForProject(project.id);
    });
    return map;
  }, []);
  const [boardTasksByProject, setBoardTasksByProject] = React.useState<Record<string, ProjectTask[]>>(() => {
    const map: Record<string, ProjectTask[]> = {};
    projects.forEach((project) => {
      map[project.id] = getTasksForProject(project.id);
    });
    return map;
  });

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) return;
      if (event.key === "[") {
        event.preventDefault();
        setLeftPaneVisible(false);
      } else if (event.key === "]") {
        event.preventDefault();
        setLeftPaneVisible(true);
      } else if (event.key === "\\") {
        event.preventDefault();
        setRightPaneVisible((value) => !value);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectedProject = React.useMemo(() => getProjectById(selectedProjectId) ?? projects[0], [selectedProjectId]);

  const overviewData = React.useMemo(() => {
    if (!selectedProject) {
      return {
        milestones: [],
        artifacts: [],
      };
    }
    return {
      milestones: getMilestonesForProject(selectedProject.id),
      artifacts: getArtifactsForProject(selectedProject.id),
    };
  }, [selectedProject]);

  const currentTaskLists = selectedProject ? taskListsByProject[selectedProject.id] ?? [] : [];
  const currentTasks = React.useMemo(() => {
    if (!selectedProject) return [] as ProjectTask[];
    return boardTasksByProject[selectedProject.id] ?? [];
  }, [boardTasksByProject, selectedProject]);

  const handleAdd = React.useCallback(() => {
    if (!selectedProject) return;
    emitProjectEvent("project.add_clicked", { source: "overview", projectId: selectedProject.id });
    openQuickAssistant({
      scope: { projectId: selectedProject.id },
      mode: "capture",
    });
  }, [selectedProject]);

  const handleCreateTask = React.useCallback(
    (listId: string) => {
      if (!selectedProject) return;
      const timestamp = new Date().toISOString();
      const newTask: ProjectTask = {
        id: `project-task-${timestamp}`,
        projectId: selectedProject.id,
        listId,
        title: "New task",
        updatedAt: timestamp,
      };
      setBoardTasksByProject((prev) => ({
        ...prev,
        [selectedProject.id]: [newTask, ...(prev[selectedProject.id] ?? [])],
      }));
      emitProjectEvent("project.tasks.create", { projectId: selectedProject.id, listId, taskId: newTask.id });
      setTasksModuleScope(selectedProject.id);
    },
    [selectedProject],
  );

  const handleMoveTask = React.useCallback(
    (taskId: string, toListId: string) => {
      if (!selectedProject) return;
      setBoardTasksByProject((prev) => {
        const tasks = prev[selectedProject.id] ?? [];
        return {
          ...prev,
          [selectedProject.id]: tasks.map((task) =>
            task.id === taskId
              ? { ...task, listId: toListId, updatedAt: new Date().toISOString() }
              : task,
          ),
        };
      });
      emitProjectEvent("project.board.move", { projectId: selectedProject.id, taskId, listId: toListId });
    },
    [selectedProject],
  );

  const handleTabChange = React.useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      if (tabId === "tasks" && selectedProject) {
        setTasksModuleScope(selectedProject.id);
      }
    },
    [selectedProject],
  );

  React.useEffect(() => {
    if (activeTab === "tasks" && selectedProject) {
      setTasksModuleScope(selectedProject.id);
    }
  }, [activeTab, selectedProject]);

  return (
    <div className="h-full bg-[var(--bg-canvas)]">
      <TriPane
        leftWidth={leftPaneVisible ? "var(--tripane-left-width)" : "20px"}
        rightWidth={rightPaneVisible ? "var(--quick-panel-width)" : "20px"}
        left={
          leftPaneVisible ? (
            <ProjectNavigator
              projects={projects}
              selectedProjectId={selectedProject?.id ?? ""}
              search={search}
              onSearchChange={setSearch}
              onSelectProject={(id) => {
                setSelectedProjectId(id);
                setActiveTab("overview");
              }}
              onCollapse={() => setLeftPaneVisible(false)}
            />
          ) : (
            <CollapsedRail side="left" onClick={() => setLeftPaneVisible(true)} ariaKeyshortcuts="]" />
          )
        }
        center={
          <PaneColumn
            className="h-full"
            showLeftDivider={leftPaneVisible}
            showRightDivider={rightPaneVisible}
          >
            <PaneHeader role="navigation" className="items-center gap-[var(--space-4)] px-[var(--space-6)]">
              <TabList activeTab={activeTab} onTabChange={handleTabChange} />
              <Button
                variant="solid"
                size="sm"
                className="ml-auto md:hidden"
                onClick={handleAdd}
                aria-keyshortcuts="Meta+K,Control+K"
              >
                Add
              </Button>
            </PaneHeader>
            <div className="relative flex-1">
              <div className="absolute inset-0 overflow-y-auto">
                {selectedProject ? (
                  activeTab === "overview" ? (
                    <ProjectOverview
                      project={selectedProject}
                      milestones={overviewData.milestones}
                      artifacts={overviewData.artifacts}
                      onAddAction={handleAdd}
                    />
                  ) : activeTab === "tasks" ? (
                    <ProjectTasksBoard
                      projectId={selectedProject.id}
                      lists={currentTaskLists}
                      tasks={currentTasks}
                      onCreateTask={handleCreateTask}
                      onMoveTask={handleMoveTask}
                    />
                  ) : (
                    <TabPlaceholder tabId={activeTab} onAdd={handleAdd} />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[color:var(--text-secondary)]">
                    Create a project to get started.
                  </div>
                )}
              </div>
            </div>
          </PaneColumn>
        }
        right={
          rightPaneVisible ? (
            <ProjectContextPanel
              project={selectedProject}
              taskLists={currentTaskLists}
              onCollapse={() => setRightPaneVisible(false)}
            />
          ) : (
            <CollapsedRail side="right" onClick={() => setRightPaneVisible(true)} ariaKeyshortcuts="\\" />
          )
        }
      />
    </div>
  );
}

function TabList({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tabId: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-[var(--space-3)]">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative pb-[var(--space-1)] text-sm font-medium transition-colors",
              isActive
                ? "text-[color:var(--text-primary)]"
                : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute left-0 right-0 -bottom-1 h-0.5 rounded-full transition-opacity",
                isActive ? "bg-[var(--primary)] opacity-100" : "bg-transparent opacity-0",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function TabPlaceholder({ tabId, onAdd }: { tabId: string; onAdd: () => void }) {
  const copy = placeholderCopy[tabId] ?? placeholderCopy.default;
  return (
    <div className="flex h-full items-center justify-center px-[var(--space-6)] text-center text-sm text-[color:var(--text-secondary)]">
      <div className="max-w-md space-y-[var(--space-3)]">
        <p className="text-[length:var(--text-lg)] font-semibold text-[color:var(--text-primary)]">{copy.title}</p>
        <p>{copy.body}</p>
        {copy.cta ? (
          <Button variant="ghost" onClick={onAdd} aria-keyshortcuts="Meta+K,Control+K">
            {copy.cta}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function CollapsedRail({
  side,
  onClick,
  ariaKeyshortcuts,
}: {
  side: "left" | "right";
  onClick: () => void;
  ariaKeyshortcuts?: string;
}) {
  return (
    <div className="flex h-full items-center justify-center bg-[var(--bg-surface-elevated)]">
      <PaneCaret side={side} label={side === "left" ? "Show projects rail" : "Show context"} onClick={onClick} ariaKeyshortcuts={ariaKeyshortcuts} />
    </div>
  );
}

const placeholderCopy: Record<string, { title: string; body: string; cta?: string }> = {
  notes: {
    title: "No notes yet",
    body: "Capture a note and it will stay linked to this project for quick recall.",
    cta: "Add note",
  },
  files: {
    title: "Files surface coming soon",
    body: "Attach documents from the assistant or drag them in once file sync ships.",
  },
  canvas: {
    title: "Canvas coming soon",
    body: "Projects will surface a linked Canvas space so you can sketch flows side by side.",
  },
  chat: {
    title: "Connect a provider",
    body: "Link a chat provider to keep transcripts nearby. Until then, everything routes through notes.",
  },
  emails: {
    title: "Emails not yet connected",
    body: "Once mail sync is configured, linked emails will appear here automatically.",
  },
  default: {
    title: "Surface coming soon",
    body: "The unified UI redesign will light up this surface once its module ships.",
  },
};

function emitProjectEvent(event: string, payload?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("project:telemetry", { detail: { event, payload } }));
  }
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[project-event] ${event}`, payload ?? {});
  }
}

function setTasksModuleScope(projectId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("tasks:set-project-scope", { detail: { projectId } }));
}
