import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "../ui/utils";
import { CommandType } from "./useCaptureSession";

type CommandSuggestion = {
  command: CommandType;
  label: string;
  description: string;
};

const COMMAND_SUGGESTIONS: CommandSuggestion[] = [
  { command: "task", label: "/task", description: "Create a task" },
  { command: "note", label: "/note", description: "Save as note" },
  { command: "event", label: "/event", description: "Schedule event" },
  { command: "summarize", label: "/summarize", description: "AI summary (coming soon)" },
];

type CommandInputProps = {
  value: string;
  onChange: (value: string) => void;
  onCommandSelect: (command: CommandType) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmit?: () => void;
};

export function CommandInput({
  value,
  onChange,
  onCommandSelect,
  placeholder = "Capture a thought or type /task, /note, /event",
  autoFocus = false,
  onSubmit,
}: CommandInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const detectCommand = (text: string): CommandType => {
    const trimmed = text.trim().toLowerCase();
    if (trimmed.startsWith("/task")) return "task";
    if (trimmed.startsWith("/note")) return "note";
    if (trimmed.startsWith("/event")) return "event";
    if (trimmed.startsWith("/summarize")) return "summarize";
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    const command = detectCommand(newValue);
    if (command) {
      onCommandSelect(command);
    }

    setShowSuggestions(newValue.startsWith("/") && !command);
  };

  const handleSuggestionClick = (suggestion: CommandSuggestion) => {
    onChange(suggestion.label + " ");
    onCommandSelect(suggestion.command);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(value.startsWith("/"))}
          className={cn(
            "w-full rounded-[var(--radius-lg)] border border-[color:var(--border-subtle)]",
            "bg-[color:var(--bg-surface)] px-[var(--space-5)] py-[var(--space-4)]",
            "pr-10",
            "text-[length:var(--text-lg)] placeholder:text-[color:var(--text-tertiary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
            "transition-all duration-[var(--duration-base)]"
          )}
          placeholder={placeholder}
          aria-label="Command input"
        />
        <Search
          className="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-[color:var(--text-tertiary)] pointer-events-none"
          aria-hidden
        />
      </div>

      {showSuggestions && (
        <div
          className={cn(
            "absolute top-full left-0 right-0 mt-2 z-10",
            "rounded-[var(--radius-md)] border border-[color:var(--border-subtle)]",
            "bg-[color:var(--bg-surface)] shadow-[var(--elevation-lg)]",
            "overflow-hidden"
          )}
        >
          {COMMAND_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.command}
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3",
                "text-left hover:bg-[color:var(--bg-surface-elevated)]",
                "transition-colors duration-[var(--duration-fast)]"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
                  {suggestion.label}
                </div>
                <div className="text-[length:var(--text-xs)] text-[color:var(--text-tertiary)]">
                  {suggestion.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CommandSuggestionChips({
  onSelect,
}: {
  onSelect: (command: CommandType) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[length:var(--text-sm)] text-[color:var(--text-tertiary)]">Suggestions:</span>
      {COMMAND_SUGGESTIONS.slice(0, 4).map((suggestion) => (
        <button
          key={suggestion.command}
          onClick={() => onSelect(suggestion.command!)}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1",
            "rounded-[var(--radius-sm)] border border-[color:var(--border-subtle)]",
            "bg-[color:var(--bg-surface)] hover:bg-[color:var(--bg-surface-elevated)]",
            "text-[length:var(--text-xs)] font-medium text-[color:var(--text-primary)]",
            "transition-colors duration-[var(--duration-fast)]"
          )}
        >
          <span>{suggestion.label}</span>
        </button>
      ))}
    </div>
  );
}
