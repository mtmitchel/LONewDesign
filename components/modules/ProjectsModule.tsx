"use client";

import * as React from "react";
import { TriPane } from "../TriPane";
import { PaneColumn } from "../layout/PaneColumn";
import { PaneHeader } from "../layout/PaneHeader";
import { PaneCaret } from "../dev/PaneCaret";
import { ProjectNavigator } from "./projects/ProjectNavigator";
import { ProjectOverview } from "./projects/ProjectOverview";
import { ProjectContextPanel } from "./projects/ProjectContextPanel";
import {
  projects,
  getProjectById,
  getArtifactsForProject,
  getMilestonesForProject,
  getThreadsForProject,
} from "./projects/data";
import { openQuickAssistant } from "../assistant";
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
        threads: [],
      };
    }
    return {
      milestones: getMilestonesForProject(selectedProject.id),
      artifacts: getArtifactsForProject(selectedProject.id),
      threads: getThreadsForProject(selectedProject.id),
    };
  }, [selectedProject]);

  const handleAdd = React.useCallback(() => {
    if (!selectedProject) return;
    openQuickAssistant({
      scope: { projectId: selectedProject.id },
      mode: "capture",
    });
  }, [selectedProject]);

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
            <PaneHeader role="navigation" className="gap-[var(--space-4)] px-[var(--space-6)]">
              <TabList activeTab={activeTab} onTabChange={setActiveTab} />
            </PaneHeader>
            <div className="flex-1 overflow-y-auto">
              {selectedProject ? (
                activeTab === "overview" ? (
                  <ProjectOverview
                    project={selectedProject}
                    milestones={overviewData.milestones}
                    artifacts={overviewData.artifacts}
                    threads={overviewData.threads}
                    onAddAction={handleAdd}
                  />
                ) : (
                  <TabPlaceholder label={tabs.find((tab) => tab.id === activeTab)?.label ?? ""} />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[color:var(--text-secondary)]">
                  Create a project to get started.
                </div>
              )}
            </div>
          </PaneColumn>
        }
        right={
          rightPaneVisible ? (
            <ProjectContextPanel onCollapse={() => setRightPaneVisible(false)} />
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

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center px-[var(--space-6)] text-center text-sm text-[color:var(--text-secondary)]">
      <div className="max-w-md space-y-[var(--space-3)]">
        <p className="text-[length:var(--text-lg)] font-semibold text-[color:var(--text-primary)]">{label} coming soon</p>
        <p>
          The unified UI redesign will light up this surface once the respective module scopes are wired. Track progress in
          the overview tab.
        </p>
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
