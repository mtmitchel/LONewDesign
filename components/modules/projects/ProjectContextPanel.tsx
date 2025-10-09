import * as React from "react";
import {
  Calendar,
  CalendarClock,
  FolderKanban,
  Link,
  ListTodo,
  NotebookPen,
  Palette,
  Sparkles,
} from "lucide-react";
import { PaneColumn } from "../../layout/PaneColumn";
import { PaneHeader } from "../../layout/PaneHeader";
import { PaneCaret, PaneFooter } from "../../dev/PaneCaret";
import { Button } from "../../ui/button";
import { Switch } from "../../ui/switch";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { cn } from "../../ui/utils";
import { Project, ProjectTaskList } from "./data";

interface ProjectContextPanelProps {
  onCollapse: () => void;
  project?: Project;
  taskLists?: ProjectTaskList[];
}

type TabId = "context" | "settings";

type SettingsState = {
  defaultList: string;
  defaultDue: "none" | "today" | "tomorrow";
  showInDashboard: boolean;
  autoLinkNotes: boolean;
  suggestRelated: boolean;
  projectColor: string;
  projectIcon: string;
};

export function ProjectContextPanel({ onCollapse, project, taskLists = [] }: ProjectContextPanelProps) {
  const [activeTab, setActiveTab] = React.useState<TabId>("context");
  const [settings, setSettings] = React.useState<SettingsState>(() => createDefaultSettings(taskLists));

  React.useEffect(() => {
    setSettings(createDefaultSettings(taskLists));
  }, [taskLists]);

  const handleSettingChange = React.useCallback(
    <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      emitContextEvent("context.settings.changed", { key, value, projectId: project?.id });
    },
    [project?.id],
  );

  return (
    <PaneColumn className="h-full" showLeftDivider showRightDivider={false}>
      <PaneHeader role="tablist" className="justify-between px-[var(--panel-pad-x)]">
        <div className="flex items-center gap-[var(--space-4)] text-sm font-medium text-[color:var(--text-secondary)]">
          <button
            type="button"
            className={cn(
              "relative pb-2 transition-colors",
              activeTab === "context" ? "text-[color:var(--text-primary)]" : "text-[color:var(--text-tertiary)]",
            )}
            onClick={() => setActiveTab("context")}
          >
            Context
            {activeTab === "context" ? (
              <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-[var(--primary)]" aria-hidden />
            ) : null}
          </button>
          <button
            type="button"
            className={cn(
              "relative pb-2 transition-colors",
              activeTab === "settings" ? "text-[color:var(--text-primary)]" : "text-[color:var(--text-tertiary)]",
            )}
            onClick={() => setActiveTab("settings")}
          >
            Settings
            {activeTab === "settings" ? (
              <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-[var(--primary)]" aria-hidden />
            ) : null}
          </button>
        </div>
      </PaneHeader>

      <div className="flex-1 overflow-y-auto border-t border-[var(--border-subtle)] px-[var(--panel-pad-x)] py-[var(--panel-pad-y)]">
        {activeTab === "context" ? (
          <ContextTab />
        ) : (
          <SettingsTabContent taskLists={taskLists} settings={settings} onChange={handleSettingChange} />
        )}
      </div>

      <PaneFooter>
        <PaneCaret side="right" label="Hide context" onClick={onCollapse} ariaKeyshortcuts="\\" />
      </PaneFooter>
    </PaneColumn>
  );
}

function ContextTab() {
  return (
    <div className="space-y-[var(--space-6)]">
      <ContextSection title="Related notes" icon={<NotebookPen className="size-4" aria-hidden />}>
        <PlaceholderBody label="No related notes" hint="Capture one with ⌘/Ctrl+K to pin it here." />
      </ContextSection>

      <ContextSection title="Related tasks" icon={<ListTodo className="size-4" aria-hidden />}>
        <PlaceholderBody label="No linked tasks" hint="Use the board or press ⌘/Ctrl+K to add one." />
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

      <ContextSection title="Suggestions" icon={<Sparkles className="size-4" aria-hidden />}>
        <PlaceholderBody label="Assistant is learning" hint="Link work to surface smarter prompts over time." />
      </ContextSection>

      <ContextSection title="Backlinks" icon={<Link className="size-4" aria-hidden />}>
        <PlaceholderBody label="No backlinks yet" hint="Notes that reference this project will land here automatically." />
      </ContextSection>
    </div>
  );
}

function SettingsTabContent({
  taskLists,
  settings,
  onChange,
}: {
  taskLists: ProjectTaskList[];
  settings: SettingsState;
  onChange: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}) {
  return (
    <div className="space-y-[var(--settings-sec-gap,24px)]" style={{ maxWidth: "var(--settings-content-w)" }}>
      <SettingsSection
        icon={<CalendarClock className="size-4" aria-hidden />}
        title="Defaults"
        description="Control where quick captures land by default."
      >
        <div className="grid gap-[var(--form-row-gap)] sm:grid-cols-2">
          <Field label="Default task list">
            <Select value={settings.defaultList} onValueChange={(value) => onChange("defaultList", value)}>
              <SelectTrigger aria-label="Default task list">
                <SelectValue placeholder="Choose a list" />
              </SelectTrigger>
              <SelectContent>
                {taskLists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Default due date">
            <Select value={settings.defaultDue} onValueChange={(value: "none" | "today" | "tomorrow") => onChange("defaultDue", value)}>
              <SelectTrigger aria-label="Default due date">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<FolderKanban className="size-4" aria-hidden />}
        title="Visibility"
        description="Choose whether this project appears in shared surfaces."
      >
        <ToggleRow>
          <Label htmlFor="toggle-dashboard">Show in dashboard</Label>
          <Switch id="toggle-dashboard" checked={settings.showInDashboard} onCheckedChange={(value) => onChange("showInDashboard", value)} />
        </ToggleRow>
      </SettingsSection>

      <SettingsSection
        icon={<ListTodo className="size-4" aria-hidden />}
        title="Capture and linking"
        description="Keep related work attached automatically."
      >
        <ToggleRow>
          <Label htmlFor="toggle-autolink">Auto-link new notes to this project</Label>
          <Switch id="toggle-autolink" checked={settings.autoLinkNotes} onCheckedChange={(value) => onChange("autoLinkNotes", value)} />
        </ToggleRow>
        <ToggleRow>
          <Label htmlFor="toggle-suggest">Suggest related notes and tasks</Label>
          <Switch id="toggle-suggest" checked={settings.suggestRelated} onCheckedChange={(value) => onChange("suggestRelated", value)} />
        </ToggleRow>
      </SettingsSection>

      <SettingsSection
        icon={<Palette className="size-4" aria-hidden />}
        title="Presentation"
        description="Pick a color and icon for this project chip."
      >
        <div className="flex flex-wrap gap-[var(--space-3)]">
          {colorOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange("projectColor", option.id)}
              className={cn(
                "grid size-9 place-items-center rounded-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]",
                settings.projectColor === option.id ? "border-[var(--primary)]" : "border-[var(--border-subtle)]",
              )}
              style={{ backgroundColor: option.swatch }}
              aria-label={option.label}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-[var(--space-2)] pt-[var(--space-3)]">
          {iconOptions.map((option) => (
            <Button
              key={option.id}
              type="button"
              variant={settings.projectIcon === option.id ? "default" : "outline"}
              size="sm"
              className="gap-[var(--space-2)]"
              onClick={() => onChange("projectIcon", option.id)}
            >
              {option.icon}
              {option.label}
            </Button>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}

function ContextSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-[var(--space-3)]">
      <header className="flex items-center gap-[var(--space-2)] text-sm font-medium text-[color:var(--text-secondary)]">
        <span className="grid size-6 place-items-center rounded-full bg-[var(--bg-surface-elevated)] text-[color:var(--text-secondary)]">
          {icon}
        </span>
        <span className="text-[color:var(--text-primary)]">{title}</span>
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

function SettingsSection({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="space-y-[var(--space-3)]">
      <div className="flex items-center gap-[var(--space-2)] text-sm text-[color:var(--text-secondary)]">
        <span className="grid size-6 place-items-center rounded-full bg-[var(--bg-surface-elevated)] text-[color:var(--text-secondary)]">
          {icon}
        </span>
        <div className="space-y-[var(--space-1)]">
          <p className="font-medium text-[color:var(--text-primary)]">{title}</p>
          <p className="text-xs text-[color:var(--text-secondary)]">{description}</p>
        </div>
      </div>
      <div className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--settings-surface-border)] bg-[var(--settings-surface-bg)] p-[var(--space-4)] shadow-[var(--settings-surface-elevation)]">
        {children}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-[var(--space-2)] text-sm text-[color:var(--text-secondary)]">
      <span className="font-medium text-[color:var(--text-primary)]">{label}</span>
      {children}
    </label>
  );
}

function ToggleRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-[var(--space-4)] py-[var(--space-1)]">{children}</div>;
}

function createDefaultSettings(taskLists: ProjectTaskList[]): SettingsState {
  return {
    defaultList: taskLists[0]?.id ?? "",
    defaultDue: "none",
    showInDashboard: true,
    autoLinkNotes: true,
    suggestRelated: true,
    projectColor: colorOptions[0]?.id ?? "iris",
    projectIcon: iconOptions[0]?.id ?? "folder",
  };
}

const colorOptions = [
  { id: "iris", label: "Iris", swatch: "var(--canvas-accent-iris)" },
  { id: "mint", label: "Mint", swatch: "var(--canvas-accent-mint)" },
  { id: "sun", label: "Sun", swatch: "var(--canvas-accent-sun)" },
  { id: "tangerine", label: "Tangerine", swatch: "var(--canvas-accent-tangerine)" },
  { id: "berry", label: "Berry", swatch: "var(--canvas-accent-berry)" },
];

const iconOptions = [
  { id: "folder", label: "Folder", icon: <FolderKanban className="size-4" aria-hidden /> },
  { id: "sparkles", label: "Spark", icon: <Sparkles className="size-4" aria-hidden /> },
  { id: "note", label: "Note", icon: <NotebookPen className="size-4" aria-hidden /> },
  { id: "calendar", label: "Calendar", icon: <Calendar className="size-4" aria-hidden /> },
];

function emitContextEvent(event: string, payload?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("project:telemetry", { detail: { event, payload } }));
  }
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[project-event] ${event}`, payload ?? {});
  }
}
