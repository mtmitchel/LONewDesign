"use client";

import * as React from "react";
import { TriPane } from "../TriPane";
import { PaneColumn } from "../layout/PaneColumn";
import { PaneHeader } from "../layout/PaneHeader";
import { PaneCaret } from "../dev/PaneCaret";
import { ProjectNavigator } from "./projects/ProjectNavigator";
import { ProjectOverview } from "./projects/ProjectOverview";
import { ProjectContextPanel } from "./projects/ProjectContextPanel";
import { CreateProjectModal } from "./projects/CreateProjectModal";
import { TasksBoard } from "./tasks/TasksBoard";
import type { ComposerLabel } from "./tasks/TaskComposer";
import { TaskSidePanel } from "./tasks/TaskSidePanel";
import type { Task as BoardTask } from "./tasks/types";
import { Plus } from "lucide-react";
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
import { Dialog, DialogContent } from "../ui/dialog";
import { cn } from "../ui/utils";
import { useMediaQuery } from "./settings/_parts/useMediaQuery";

type ProjectBoardTask = ProjectTask & {
  isCompleted?: boolean;
  labels?: BoardTask["labels"];
  createdAt?: string;
  dateCreated?: string;
  completedAt?: string | null;
  description?: string;
  subtasks?: BoardTask["subtasks"];
  checklist?: BoardTask["checklist"];
};

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "notes", label: "Notes" },
  { id: "files", label: "Files" },
  { id: "events", label: "Events" },
  { id: "canvas", label: "Canvases" },
  { id: "chat", label: "Chats" },
  { id: "emails", label: "Emails" },
];

const getLabelName = (label: BoardTask["labels"][number]) =>
  typeof label === "string" ? label : label.name;
const getLabelColor = (label: BoardTask["labels"][number]) =>
  typeof label === "string" ? "var(--label-gray)" : label.color;

export function ProjectsModule() {
  const [leftPaneVisible, setLeftPaneVisible] = React.useState(true);
  const [rightPaneVisible, setRightPaneVisible] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>(() => parseProjectRouteFromLocation().tab ?? "overview");
  const [search, setSearch] = React.useState("");
  const [selectedProjectId, setSelectedProjectId] = React.useState(() => parseProjectRouteFromLocation().projectId ?? projects[0]?.id ?? "");
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [taskListsByProject, setTaskListsByProject] = React.useState<Record<string, ProjectTaskList[]>>(() => {
    const map: Record<string, ProjectTaskList[]> = {};
    projects.forEach((project) => {
      map[project.id] = getTaskListsForProject(project.id);
    });
    return map;
  });
  const [boardTasksByProject, setBoardTasksByProject] = React.useState<Record<string, ProjectBoardTask[]>>(() => {
    const map: Record<string, ProjectBoardTask[]> = {};
    projects.forEach((project) => {
      map[project.id] = getTasksForProject(project.id).map((task) => ({
        ...task,
        isCompleted: false,
        createdAt: task.updatedAt,
        dateCreated: task.updatedAt,
        labels: [],
      }));
    });
    return map;
  });
  const [isAddingProjectList, setIsAddingProjectList] = React.useState(false);
  const [newProjectListName, setNewProjectListName] = React.useState("");
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(() => parseProjectRouteFromLocation().taskId ?? null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const rightPaneRestoreRef = React.useRef<boolean | null>(null);

  const isHandlingPopRef = React.useRef(false);

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

  React.useEffect(() => {
    const handlePopState = () => {
      isHandlingPopRef.current = true;
      const route = parseProjectRouteFromLocation();
      if (route.projectId) {
        setSelectedProjectId(route.projectId);
      }
      setActiveTab(route.tab ?? "overview");
      setSelectedTaskId(route.taskId ?? null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const previousRouteRef = React.useRef({ projectId: selectedProjectId, tab: activeTab, taskId: selectedTaskId });
  const hasSyncedInitialRoute = React.useRef(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !selectedProjectId) return;
    const targetPath = buildProjectPath(selectedProjectId, activeTab, selectedTaskId);
    const currentPath = window.location.pathname;
    const previous = previousRouteRef.current;

    const hasTaskChanged = previous.taskId !== selectedTaskId;
    const hasProjectChanged = previous.projectId !== selectedProjectId;
    const hasTabChanged = previous.tab !== activeTab;

    const method: "pushState" | "replaceState" = !hasSyncedInitialRoute.current
      ? "replaceState"
      : hasTaskChanged || hasProjectChanged || hasTabChanged
      ? "pushState"
      : "replaceState";

    if (currentPath !== targetPath) {
      window.history[method](null, "", targetPath);
    }

    previousRouteRef.current = { projectId: selectedProjectId, tab: activeTab, taskId: selectedTaskId };
    hasSyncedInitialRoute.current = true;
  }, [selectedProjectId, activeTab, selectedTaskId]);

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

  const currentTaskLists = React.useMemo(
    () => (selectedProject ? taskListsByProject[selectedProject.id] ?? [] : []),
    [selectedProject, taskListsByProject],
  );
  const currentTasks = React.useMemo(() => {
    if (!selectedProject) return [] as ProjectBoardTask[];
    return boardTasksByProject[selectedProject.id] ?? [];
  }, [boardTasksByProject, selectedProject]);
  const boardColumns = React.useMemo(() => currentTaskLists.map((list) => ({ id: list.id, title: list.name })), [currentTaskLists]);
  const boardTasks = React.useMemo<BoardTask[]>(
    () =>
      currentTasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.listId,
        priority: (task.priority ?? "none") as BoardTask["priority"],
        dueDate: task.dueDate,
        createdAt: task.createdAt ?? task.updatedAt,
        dateCreated: task.dateCreated ?? task.updatedAt,
        updatedAt: task.updatedAt,
        labels: task.labels ?? [],
        listId: task.listId,
        projectId: task.projectId,
        isCompleted: Boolean(task.isCompleted),
        checklist: task.checklist ?? [],
        description: task.description,
        subtasks: task.subtasks ?? [],
      })),
    [currentTasks],
  );
  const projectAvailableLabels = React.useMemo<ComposerLabel[]>(() => {
    const map = new Map<string, string>();
    boardTasks.forEach((task) => {
      (task.labels ?? []).forEach((label) => {
        const name = getLabelName(label);
        const color = getLabelColor(label);
        if (!map.has(name)) {
          map.set(name, color);
        }
      });
    });
    return Array.from(map.entries()).map(([name, color]) => ({ name, color }));
  }, [boardTasks]);
  const selectedBoardTask = React.useMemo(() => boardTasks.find((task) => task.id === selectedTaskId) ?? null, [boardTasks, selectedTaskId]);
  const showInlineTaskPanel = Boolean(isDesktop && activeTab === "tasks" && selectedBoardTask);

  React.useEffect(() => {
    if (showInlineTaskPanel && !rightPaneVisible) {
      rightPaneRestoreRef.current = rightPaneRestoreRef.current ?? false;
      setRightPaneVisible(true);
    }
    if (!selectedBoardTask) {
      rightPaneRestoreRef.current = null;
    }
  }, [rightPaneVisible, selectedBoardTask, showInlineTaskPanel]);

  const handleAdd = React.useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handlePhaseNavigate = React.useCallback(
    (phaseId: string) => {
      if (!selectedProject) return;
      emitProjectEvent("project.timeline.phase_select", { projectId: selectedProject.id, phaseId });
      setActiveTab("tasks");
      setTasksModuleScope(selectedProject.id);
    },
    [selectedProject],
  );

  const handleMilestoneNavigate = React.useCallback(
    (milestoneId: string) => {
      if (!selectedProject) return;
      emitProjectEvent("project.timeline.milestone_select", { projectId: selectedProject.id, milestoneId });
    },
    [selectedProject],
  );

  React.useEffect(() => {
    setIsAddingProjectList(false);
    setNewProjectListName("");
    setSelectedTaskId(null);
  }, [selectedProjectId]);

  React.useEffect(() => {
    if (activeTab !== "tasks") {
      setSelectedTaskId(null);
    }
  }, [activeTab]);

  const handleCreateTask = React.useCallback(
    (
      listId: string,
      draft?: {
        title?: string;
        dueDate?: string;
        priority?: BoardTask["priority"];
        labels?: ComposerLabel[];
      },
    ) => {
      if (!selectedProject) return;
      const timestamp = new Date().toISOString();
      const priority = draft?.priority && draft.priority !== "none" ? draft.priority : undefined;
      const newTask: ProjectBoardTask = {
        id: `project-task-${timestamp}`,
        projectId: selectedProject.id,
        listId,
        title: draft?.title?.trim() || "New task",
        priority,
        dueDate: draft?.dueDate,
        updatedAt: timestamp,
        createdAt: timestamp,
        dateCreated: timestamp,
        isCompleted: false,
        labels: draft?.labels?.map((label) => ({ name: label.name, color: label.color })) ?? [],
        completedAt: null,
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

  const handleOpenTaskDetails = React.useCallback(
    (task: BoardTask) => {
      if (!selectedProject) return;
      rightPaneRestoreRef.current = rightPaneVisible;
      if (!rightPaneVisible) {
        setRightPaneVisible(true);
      }
      setSelectedTaskId(task.id);
      emitProjectEvent("project.tasks.details_open", { projectId: selectedProject.id, taskId: task.id, source: "project-board" });
    },
    [rightPaneVisible, selectedProject],
  );

  const handleCloseTaskDetails = React.useCallback(() => {
    if (!selectedProject || !selectedTaskId) {
      setSelectedTaskId(null);
      return;
    }
    emitProjectEvent("project.tasks.details_close", { projectId: selectedProject.id, taskId: selectedTaskId });
    setSelectedTaskId(null);
    if (rightPaneRestoreRef.current === false) {
      setRightPaneVisible(false);
    }
    rightPaneRestoreRef.current = null;
  }, [selectedProject, selectedTaskId]);

  const handleUpdateProjectTask = React.useCallback(
    (updatedTask: BoardTask) => {
      if (!selectedProject) return;
      setBoardTasksByProject((prev) => {
        const tasks = prev[selectedProject.id] ?? [];
        const timestamp = new Date().toISOString();
        return {
          ...prev,
          [selectedProject.id]: tasks.map((task) =>
            task.id === updatedTask.id
              ? {
                  ...task,
                  title: updatedTask.title,
                  listId: updatedTask.listId,
                  priority: updatedTask.priority !== "none" ? updatedTask.priority : undefined,
                  dueDate: updatedTask.dueDate,
                  description: updatedTask.description,
                  labels: updatedTask.labels,
                  subtasks: updatedTask.subtasks,
                  checklist: updatedTask.checklist,
                  isCompleted: updatedTask.isCompleted,
                  completedAt: updatedTask.isCompleted ? task.completedAt ?? timestamp : null,
                  updatedAt: timestamp,
                }
              : task,
          ),
        };
      });
      emitProjectEvent("project.tasks.details_update", { projectId: selectedProject.id, taskId: updatedTask.id });
    },
    [selectedProject],
  );

  const handleAddProjectList = React.useCallback(() => {
    if (!selectedProject) return;
    const name = newProjectListName.trim();
    if (!name) return;
    const newList: ProjectTaskList = {
      id: `${selectedProject.id}-list-${Date.now()}`,
      projectId: selectedProject.id,
      name,
      order: currentTaskLists.length,
    };
    setTaskListsByProject((prev) => ({
      ...prev,
      [selectedProject.id]: [...(prev[selectedProject.id] ?? []), newList],
    }));
    emitProjectEvent("project.tasks.add_list", { projectId: selectedProject.id, listId: newList.id });
    setNewProjectListName("");
    setIsAddingProjectList(false);
  }, [currentTaskLists.length, newProjectListName, selectedProject, setTaskListsByProject]);

  const handleToggleProjectTask = React.useCallback(
    (taskId: string) => {
      if (!selectedProject) return;
      setBoardTasksByProject((prev) => {
        const tasks = prev[selectedProject.id] ?? [];
        return {
          ...prev,
          [selectedProject.id]: tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  isCompleted: !task.isCompleted,
                  completedAt: !task.isCompleted ? new Date().toISOString() : null,
                }
              : task,
          ),
        };
      });
    },
    [selectedProject],
  );
  const handleDeleteProjectTask = React.useCallback(
    (taskId: string) => {
      if (!selectedProject) return;
      setBoardTasksByProject((prev) => {
        const tasks = prev[selectedProject.id] ?? [];
        return {
          ...prev,
          [selectedProject.id]: tasks.filter((task) => task.id !== taskId),
        };
      });
      setSelectedTaskId((prev) => {
        if (prev === taskId) {
          if (rightPaneRestoreRef.current === false) {
            setRightPaneVisible(false);
          }
          rightPaneRestoreRef.current = null;
          return null;
        }
        return prev;
      });
      emitProjectEvent("project.tasks.delete", { projectId: selectedProject.id, taskId });
    },
    [selectedProject],
  );
  const handleDuplicateProjectTask = React.useCallback(
    (taskId: string) => {
      if (!selectedProject) return;
      setBoardTasksByProject((prev) => {
        const tasks = prev[selectedProject.id] ?? [];
        const source = tasks.find((task) => task.id === taskId);
        if (!source) return prev;
        const timestamp = new Date().toISOString();
        const duplicated: ProjectBoardTask = {
          ...source,
          id: `project-task-${timestamp}`,
          title: `${source.title} (Copy)`,
          updatedAt: timestamp,
          createdAt: timestamp,
          dateCreated: timestamp,
          isCompleted: false,
          completedAt: null,
        };
        return {
          ...prev,
          [selectedProject.id]: [duplicated, ...tasks],
        };
      });
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
              onProjectAction={(projectId, action) =>
                emitProjectEvent("project.navigator.menu", { projectId, action })
              }
              onCreateProject={handleAdd}
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
            </PaneHeader>
            <div className="relative flex-1">
              <div className={cn("absolute inset-0 overflow-y-auto", activeTab === "tasks" && "bg-[var(--bg-canvas)]") }>
                {selectedProject ? (
                  activeTab === "overview" ? (
                    <ProjectOverview
                      project={selectedProject}
                      milestones={overviewData.milestones}
                      artifacts={overviewData.artifacts}
                      onPhaseNavigate={handlePhaseNavigate}
                      onMilestoneNavigate={handleMilestoneNavigate}
                    />
                  ) : activeTab === "tasks" ? (
                    <TasksBoard
                      variant="embedded"
                      columns={boardColumns}
                      tasks={boardTasks}
                      availableLabels={projectAvailableLabels}
                      onAddTask={(listId, draft) => handleCreateTask(listId, draft)}
                      onToggleTaskCompletion={handleToggleProjectTask}
                      onDeleteTask={handleDeleteProjectTask}
                      onDuplicateTask={(task) => handleDuplicateProjectTask(task.id)}
                      onTaskSelect={(task) => {
                        handleOpenTaskDetails(task);
                        setTasksModuleScope(selectedProject.id);
                      }}
                      className="bg-[var(--bg-canvas)] min-h-full"
                      trailingColumn={
                        isAddingProjectList ? (
                          <div className="flex min-w-[260px] flex-col gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-[var(--space-3)]">
                            <input
                              type="text"
                              autoFocus
                              value={newProjectListName}
                              onChange={(e) => setNewProjectListName(e.target.value)}
                              placeholder="New section"
                              className="h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-3)] text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:border-[var(--primary)] focus:outline-none"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddProjectList();
                                if (e.key === "Escape") {
                                  setIsAddingProjectList(false);
                                  setNewProjectListName("");
                                }
                              }}
                            />
                            <div className="flex items-center gap-[var(--space-2)]">
                              <button
                                onClick={handleAddProjectList}
                                className="inline-flex h-8 items-center rounded-[var(--radius-sm)] px-[var(--space-3)] text-xs font-medium bg-[var(--btn-primary-bg)] text-[color:var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]"
                              >
                                Add list
                              </button>
                              <button
                                onClick={() => {
                                  setIsAddingProjectList(false);
                                  setNewProjectListName("");
                                }}
                                className="inline-flex h-8 items-center rounded-[var(--radius-sm)] px-[var(--space-3)] text-xs font-medium text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[color:var(--text-primary)]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsAddingProjectList(true)}
                            className="flex min-w-[220px] items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)] bg-transparent px-[var(--space-4)] py-[var(--space-5)] text-sm font-medium text-[color:var(--text-secondary)] hover:border-[var(--border-default)] hover:text-[color:var(--text-primary)]"
                          >
                            <Plus className="mr-[var(--space-2)] h-4 w-4" />
                            Add list
                          </button>
                        )
                      }
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
            showInlineTaskPanel && selectedBoardTask ? (
              <TaskSidePanel
                task={selectedBoardTask}
                onClose={handleCloseTaskDetails}
                onUpdateTask={handleUpdateProjectTask}
                onDeleteTask={handleDeleteProjectTask}
                presentation="inline"
                className="h-full"
              />
            ) : (
              <ProjectContextPanel
                project={selectedProject}
                taskLists={currentTaskLists}
                onCollapse={() => setRightPaneVisible(false)}
                onOpenAssistant={(projectId) => {
                  console.debug("projects:open-assistant", { projectId });
                  // TODO: wire to QuickAssistantProvider with project scope
                }}
              />
            )
          ) : (
            <CollapsedRail side="right" onClick={() => setRightPaneVisible(true)} ariaKeyshortcuts="\\" />
          )
        }
      />
      {!isDesktop && selectedBoardTask ? (
        <Dialog open onOpenChange={(open) => { if (!open) handleCloseTaskDetails(); }}>
          <DialogContent
            hideClose
            overlayClassName="fixed inset-0 z-[var(--z-overlay)] bg-[var(--overlay-scrim)] backdrop-blur-[var(--overlay-blur)]"
            className="fixed inset-0 z-[var(--z-overlay)] m-0 h-full w-full max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-[var(--quick-panel-bg)] shadow-[var(--modal-elevation)]"
          >
            <TaskSidePanel
              task={selectedBoardTask}
              onClose={handleCloseTaskDetails}
              onUpdateTask={handleUpdateProjectTask}
              onDeleteTask={handleDeleteProjectTask}
              presentation="inline"
              className="h-full"
            />
          </DialogContent>
        </Dialog>
      ) : null}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={(project) => {
          console.log('New project created:', project);
          // TODO: Add the new project to the projects list
          // For now, just close the modal
          setIsCreateModalOpen(false);
        }}
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
  events: {
    title: "Events landing soon",
    body: "Calendar links will collect here once project scheduling sync is wired up.",
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

type ProjectRouteState = {
  projectId?: string;
  tab?: string;
  taskId?: string;
};

function parseProjectRouteFromLocation(): ProjectRouteState {
  if (typeof window === "undefined") return {};
  const path = window.location.pathname;
  const tasksMatch = path.match(/^\/projects\/([^/]+)\/tasks(?:\/([^/]+))?/);
  if (tasksMatch) {
    return {
      projectId: tasksMatch[1],
      tab: "tasks",
      taskId: tasksMatch[2],
    };
  }
  const genericMatch = path.match(/^\/projects\/([^/]+)(?:\/([^/]+))?/);
  if (genericMatch) {
    return {
      projectId: genericMatch[1],
      tab: genericMatch[2] ?? "overview",
    };
  }
  return {};
}

function buildProjectPath(projectId: string, tab: string, taskId: string | null): string {
  if (!projectId) return "/projects";
  if (tab === "tasks") {
    return taskId ? `/projects/${projectId}/tasks/${taskId}` : `/projects/${projectId}/tasks`;
  }
  if (tab && tab !== "overview") {
    return `/projects/${projectId}/${tab}`;
  }
  return `/projects/${projectId}`;
}

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
