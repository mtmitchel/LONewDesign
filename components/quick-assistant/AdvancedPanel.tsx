import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../ui/utils";
import { CommandType } from "./useCaptureSession";
import { DatePopoverField } from "../extended/DatePopoverField";

type AdvancedPanelProps = {
  command: CommandType;
  isOpen: boolean;
  onToggle: () => void;
  metadata: any;
  onMetadataChange: (metadata: any) => void;
};

export function AdvancedPanel({
  command,
  isOpen,
  onToggle,
  metadata = {},
  onMetadataChange,
}: AdvancedPanelProps) {
  if (!command || command === "summarize") return null;

  const updateField = (field: string, value: any) => {
    onMetadataChange({ ...metadata, [field]: value });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between",
          "px-4 py-2 rounded-[var(--radius-md)]",
          "border border-[color:var(--border-subtle)]",
          "bg-[color:var(--bg-surface)] hover:bg-[color:var(--bg-surface-elevated)]",
          "text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]",
          "transition-colors duration-[var(--duration-fast)]"
        )}
      >
        <span>Add details</span>
        {isOpen ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            "rounded-[var(--radius-md)] border border-[color:var(--border-subtle)]",
            "bg-[color:var(--bg-surface)] p-4 space-y-4",
            "animate-in slide-in-from-top-2 duration-200"
          )}
        >
          {command === "task" && (
            <TaskFields metadata={metadata} onUpdate={updateField} />
          )}
          {command === "note" && (
            <NoteFields metadata={metadata} onUpdate={updateField} />
          )}
          {command === "event" && (
            <EventFields metadata={metadata} onUpdate={updateField} />
          )}
        </div>
      )}
    </div>
  );
}

function TaskFields({
  metadata,
  onUpdate,
}: {
  metadata: any;
  onUpdate: (field: string, value: any) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <label
          htmlFor="assignee"
          className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]"
        >
          Assignee
        </label>
        <input
          id="assignee"
          type="text"
          placeholder="Assign to..."
          value={metadata.assignee || ""}
          onChange={(e) => onUpdate("assignee", e.target.value)}
          className={cn(
            "w-full rounded-[var(--radius-md)] border border-[color:var(--border-subtle)]",
            "bg-[color:var(--bg-surface)] px-3 py-2",
            "text-[length:var(--text-sm)] placeholder:text-[color:var(--text-tertiary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          )}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
          Due date
        </label>
        <DatePopoverField
          value={metadata.dueDate ? new Date(metadata.dueDate) : undefined}
          onChange={(date) =>
            onUpdate("dueDate", date?.toISOString().slice(0, 10))
          }
          placeholder="Pick a date"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
          Priority
        </label>
        <div className="flex gap-2">
          {(["low", "medium", "high"] as const).map((priority) => (
            <button
              key={priority}
              onClick={() => onUpdate("priority", priority)}
              className={cn(
                "flex-1 px-3 py-2 rounded-[var(--radius-md)]",
                "border text-[length:var(--text-sm)] font-medium",
                "transition-all duration-[var(--duration-fast)]",
                metadata.priority === priority
                  ? "border-[color:var(--primary)] bg-[color:var(--primary-tint-10)] text-[color:var(--primary)]"
                  : "border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] text-[color:var(--text-primary)] hover:bg-[color:var(--bg-surface-elevated)]"
              )}
            >
              {priority === "low" && "⚪ Low"}
              {priority === "medium" && "🟡 Medium"}
              {priority === "high" && "🔴 High"}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function NoteFields({
  metadata,
  onUpdate,
}: {
  metadata: any;
  onUpdate: (field: string, value: any) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <label
          htmlFor="notebook"
          className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]"
        >
          Notebook
        </label>
        <input
          id="notebook"
          type="text"
          placeholder="Select notebook..."
          value={metadata.notebook || ""}
          onChange={(e) => onUpdate("notebook", e.target.value)}
          className={cn(
            "w-full rounded-[var(--radius-md)] border border-[color:var(--border-subtle)]",
            "bg-[color:var(--bg-surface)] px-3 py-2",
            "text-[length:var(--text-sm)] placeholder:text-[color:var(--text-tertiary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          )}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="tags"
          className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]"
        >
          Tags
        </label>
        <input
          id="tags"
          type="text"
          placeholder="Add tags (comma separated)"
          value={metadata.tags?.join(", ") || ""}
          onChange={(e) =>
            onUpdate(
              "tags",
              e.target.value.split(",").map((t) => t.trim())
            )
          }
          className={cn(
            "w-full rounded-[var(--radius-md)] border border-[color:var(--border-subtle)]",
            "bg-[color:var(--bg-surface)] px-3 py-2",
            "text-[length:var(--text-sm)] placeholder:text-[color:var(--text-tertiary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          )}
        />
      </div>
    </>
  );
}

function EventFields({
  metadata,
  onUpdate,
}: {
  metadata: any;
  onUpdate: (field: string, value: any) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <label className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
          Date
        </label>
        <DatePopoverField
          value={metadata.date ? new Date(metadata.date) : undefined}
          onChange={(date) => onUpdate("date", date?.toISOString().slice(0, 10))}
          placeholder="Pick a date"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label
            htmlFor="startTime"
            className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]"
          >
            Start time
          </label>
          <input
            id="startTime"
            type="time"
            value={metadata.startTime || ""}
            onChange={(e) => onUpdate("startTime", e.target.value)}
            className={cn(
              "w-full rounded-[var(--radius-md)] border border-[color:var(--border-subtle)]",
              "bg-[color:var(--bg-surface)] px-3 py-2",
              "text-[length:var(--text-sm)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            )}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="endTime"
            className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]"
          >
            End time
          </label>
          <input
            id="endTime"
            type="time"
            value={metadata.endTime || ""}
            onChange={(e) => onUpdate("endTime", e.target.value)}
            className={cn(
              "w-full rounded-[var(--radius-md)] border border-[color:var(--border-subtle)]",
              "bg-[color:var(--bg-surface)] px-3 py-2",
              "text-[length:var(--text-sm)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="location"
          className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]"
        >
          Location
        </label>
        <input
          id="location"
          type="text"
          placeholder="Add location..."
          value={metadata.location || ""}
          onChange={(e) => onUpdate("location", e.target.value)}
          className={cn(
            "w-full rounded-[var(--radius-md)] border border-[color:var(--border-subtle)]",
            "bg-[color:var(--bg-surface)] px-3 py-2",
            "text-[length:var(--text-sm)] placeholder:text-[color:var(--text-tertiary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          )}
        />
      </div>
    </>
  );
}
