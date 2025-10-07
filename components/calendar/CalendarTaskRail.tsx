import { Plus } from "lucide-react";
import { TaskRow, TaskRowProps } from "../tasks/TaskRow";

interface CalendarTaskRailProps {
  tasks: TaskRowProps[];
  onToggle: TaskRowProps["onToggle"];
  onOpen: TaskRowProps["onOpen"];
  onCreate: () => void;
}

export function CalendarTaskRail({
  tasks, onToggle, onOpen, onCreate
}: CalendarTaskRailProps) {
  return (
    <aside
      className="
        bg-[var(--bg-surface)]
        border border-[var(--tasks-rail-border)]
        rounded-[var(--tasks-rail-radius)]
        shadow-[var(--tasks-rail-shadow)]
        p-[var(--tasks-rail-padding)]
        flex flex-col gap-[var(--tasks-rail-gap)]
      "
      aria-label="Tasks"
    >
      {/* list */}
      <div className="flex flex-col gap-[var(--tasks-rail-gap)]">
        {tasks.map((t) => (
          <TaskRow key={t.id} {...t} onToggle={onToggle} onOpen={onOpen} />
        ))}
      </div>

      {/* add task at bottom */}
      <button
        type="button"
        onClick={onCreate}
        className="
          mt-auto inline-flex items-center gap-[var(--space-2)]
          text-[var(--primary)] rounded-[var(--radius-md)]
          px-[var(--space-3)] py-[var(--space-2)]
          hover:bg-[var(--bg-surface-elevated)] border border-transparent
          self-start
        "
        title="Add task"
        aria-keyshortcuts="N"
      >
        <Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
        Add task
      </button>
    </aside>
  );
}
