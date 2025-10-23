import { cn } from "../../ui/utils";

export type WritingTool = 
  | "professional"
  | "friendly"
  | "concise"
  | "expand"
  | "proofread"
  | "summarize"
  | "translate"
  | "explain"
  | "list"
  | "extract";

interface WritingToolDefinition {
  id: WritingTool;
  label: string;
  description: string;
}

const WRITING_TOOLS: WritingToolDefinition[] = [
  { id: "professional", label: "Professional", description: "Make it more formal" },
  { id: "friendly", label: "Friendly", description: "Make it more casual" },
  { id: "concise", label: "Concise", description: "Make it shorter" },
  { id: "expand", label: "Expand", description: "Make it longer" },
  { id: "proofread", label: "Proofread", description: "Fix grammar & spelling" },
  { id: "summarize", label: "Summarize", description: "Create a summary" },
  { id: "translate", label: "Translate", description: "Translate to another language" },
  { id: "explain", label: "Explain", description: "Explain this concept" },
  { id: "list", label: "List", description: "Convert to bullet points" },
  { id: "extract", label: "Extract", description: "Extract key points" },
];

export interface WritingToolsGridProps {
  onToolSelect: (tool: WritingTool) => void;
  disabled?: boolean;
}

export function WritingToolsGrid({ onToolSelect, disabled }: WritingToolsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-[var(--space-2)] p-[var(--space-4)]">
      {WRITING_TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          onClick={() => onToolSelect(tool.id)}
          disabled={disabled}
          className={cn(
            "flex flex-col items-start gap-1 rounded-[var(--radius-md)] border border-[var(--border-subtle)]",
            "bg-[var(--bg-surface)] px-[var(--space-3)] py-[var(--space-2)] text-left",
            "transition-colors duration-[var(--duration-fast)]",
            "hover:bg-[var(--bg-surface-elevated)] hover:border-[var(--border-default)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <span className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
            {tool.label}
          </span>
          <span className="text-[length:var(--text-xs)] text-[color:var(--text-tertiary)]">
            {tool.description}
          </span>
        </button>
      ))}
    </div>
  );
}