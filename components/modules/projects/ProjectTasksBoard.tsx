import * as React from "react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { ProjectTask, ProjectTaskList } from "./data";

type ProjectTasksBoardProps = {
  projectId: string;
  lists: ProjectTaskList[];
  tasks: ProjectTask[];
  onCreateTask: (listId: string) => void;
  onMoveTask: (taskId: string, toListId: string) => void;
};

export function ProjectTasksBoard({ projectId, lists, tasks, onCreateTask, onMoveTask }: ProjectTasksBoardProps) {
  const handleDragStart = React.useCallback((event: React.DragEvent<HTMLDivElement>, taskId: string) => {
    event.dataTransfer.setData("text/plain", taskId);
    event.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>, listId: string) => {
      event.preventDefault();
      const taskId = event.dataTransfer.getData("text/plain");
      if (taskId) {
        onMoveTask(taskId, listId);
      }
    },
    [onMoveTask],
  );

  return (
    <div className="h-full overflow-x-auto">
      <div className="grid auto-cols-[280px] grid-flow-col gap-[var(--task-col-gap)] px-[var(--space-6)] pb-[var(--space-6)]">
        {lists.sort((a, b) => a.order - b.order).map((list) => {
          const items = tasks.filter((task) => task.projectId === projectId && task.listId === list.id);
          return (
            <section key={list.id} className="flex min-h-[320px] flex-col">
              <header className="sticky top-0 z-10 rounded-[var(--task-header-radius)] border border-[var(--task-header-border)] bg-[var(--task-header-bg)] px-[var(--task-header-pad-x)] py-[var(--task-header-pad-y)]">
                <div className="flex items-center justify-between gap-[var(--space-2)]">
                  <h3 className="text-[var(--list-header-title)] font-medium text-[color:var(--text-primary)]">{list.name}</h3>
                  <Button variant="link" size="sm" className="px-0 text-[color:var(--text-secondary)]" onClick={() => onCreateTask(list.id)}>
                    Add
                  </Button>
                </div>
              </header>

              <div
                className="mt-[var(--space-3)] flex-1 space-y-[var(--task-card-gap)]"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, list.id)}
              >
                {items.length === 0 ? (
                  <button
                    type="button"
                    className="w-full rounded-[var(--task-card-radius)] border border-dashed border-[var(--border-subtle)] bg-transparent px-[var(--task-card-pad-x)] py-[var(--task-card-pad-y)] text-left text-sm text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"
                    onClick={() => onCreateTask(list.id)}
                  >
                    Add a task
                  </button>
                ) : (
                  items.map((task) => (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={(event) => handleDragStart(event, task.id)}
                      className="rounded-[var(--task-card-radius)] border-[var(--task-card-border)] bg-[var(--bg-surface)] px-[var(--task-card-pad-x)] py-[var(--task-card-pad-y)] shadow-[var(--task-card-shadow)]"
                    >
                      <div className="space-y-[var(--space-2)]">
                        <p className="text-sm font-medium text-[color:var(--text-primary)]">{task.title}</p>
                        <Footer task={task} />
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Footer({ task }: { task: ProjectTask }) {
  if (!task.dueDate && !task.priority) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-[var(--space-2)] text-xs text-[color:var(--text-tertiary)]">
      {task.dueDate ? <span>Due {formatDate(task.dueDate)}</span> : null}
      {task.priority ? (
        <span className="rounded-full bg-[var(--chip-bg)] px-[var(--chip-pad-x)] py-[var(--chip-pad-y)] text-[color:var(--text-secondary)]">
          {capitalize(task.priority)}
        </span>
      ) : null}
    </div>
  );
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return "Soon";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function capitalize(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
