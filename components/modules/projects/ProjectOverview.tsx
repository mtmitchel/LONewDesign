import * as React from "react";
import { Project, ProjectArtifact, ProjectMilestone, getPhasesForProject } from "./data";
import { ProjectTimelineWidget, ProjectMilestoneTimeline, ProjectPhase as TimelinePhase } from "./ProjectTimelineWidget";
import { ProjectActivityWidget } from "./ProjectActivityWidget";
import { ProjectQuickActionsWidget } from "./ProjectQuickActionsWidget";

interface ProjectOverviewProps {
  project: Project;
  milestones: ProjectMilestone[];
  artifacts: ProjectArtifact[];
  onPhaseNavigate?: (phaseId: string) => void;
  onMilestoneNavigate?: (milestoneId: string) => void;
}

export function ProjectOverview({ project, milestones, artifacts, onPhaseNavigate, onMilestoneNavigate }: ProjectOverviewProps) {
  const progressPercent = Math.min(100, Math.max(0, Math.round(project.progress * 100)));
  const dueMeta = project.dueDate ? `Due ${formatDate(project.dueDate)}` : undefined;
  const updatedMeta = describeUpdated(project.lastUpdated);

  const timelinePhases = React.useMemo<TimelinePhase[]>(
    () =>
      getPhasesForProject(project.id).map((phase) => ({
        id: phase.id,
        name: phase.name,
        startDate: new Date(phase.startDate),
        endDate: new Date(phase.endDate),
        status: phase.status,
        completionPercentage: phase.completionPercentage,
        taskCount: phase.taskCount,
      })),
    [project.id],
  );

  const timelineMilestones = React.useMemo<ProjectMilestoneTimeline[]>(
    () =>
      milestones.map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        date: new Date(milestone.date),
        status: milestone.status === "at-risk" ? "at-risk" : milestone.status,
        description: milestone.description,
      })),
    [milestones],
  );

  const projectStart = React.useMemo(() => timelinePhases[0]?.startDate ?? new Date(project.lastUpdated ?? Date.now()), [timelinePhases, project.lastUpdated]);
  const projectEnd = React.useMemo(() => timelinePhases.at(-1)?.endDate ?? new Date(project.dueDate ?? Date.now()), [timelinePhases, project.dueDate]);



  return (
    <div className="px-[var(--space-6)] py-[var(--space-6)]">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-[var(--space-6)]">
        <ProjectOverviewHeaderCompact title={project.name} dueText={dueMeta} updatedText={updatedMeta} />

        {project.summary ? (
          <details className="max-w-[var(--content-measure)] text-sm text-[color:var(--text-secondary)]">
            <summary className="cursor-pointer select-none text-sm font-medium text-[color:var(--text-secondary)]">
              About
            </summary>
            <p className="mt-[var(--space-2)] leading-relaxed">{project.summary}</p>
          </details>
        ) : null}

        <div className="grid gap-[var(--overview-card-gap)] md:grid-cols-12">
          <div className="md:col-span-12 order-1">
            <ProjectTimelineWidget
              projectName={project.name}
              phases={timelinePhases}
              milestones={timelineMilestones}
              startDate={projectStart}
              endDate={projectEnd}
              currentProgress={progressPercent}
              onPhaseSelect={onPhaseNavigate}
              onMilestoneSelect={onMilestoneNavigate}
            />
          </div>
          <div className="md:col-span-7 order-2">
            <ProjectQuickActionsWidget 
              project={project}
              onTaskCreate={(id) => console.log('Create task for project:', id)}
              onNoteCreate={(id) => console.log('Create note for project:', id)}
              onEventCreate={(id) => console.log('Create event for project:', id)}
              onCanvasCreate={(id) => console.log('Create canvas for project:', id)}
              onChatCreate={(id) => console.log('Create chat for project:', id)}
              onEmailCreate={(id) => console.log('Create email for project:', id)}
            />
          </div>
          <div className="md:col-span-5 order-3">
            <ProjectActivityWidget 
              maxItems={8}
              onActivitySelect={(id) => console.log('Activity selected:', id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectOverviewHeaderCompact({
  title,
  dueText,
  updatedText,
}: {
  title: string;
  dueText?: string;
  updatedText?: string;
}) {
  const meta = [dueText, updatedText].filter(Boolean).join(" • ");

  return (
    <header className="pb-[var(--space-4)]">
      <div className="min-w-0">
        <h1 className="truncate text-[length:var(--text-2xl)] font-semibold text-[color:var(--text-primary)]">{title}</h1>
        {meta ? (
          <p className="mt-[var(--overview-header-gap)] text-sm text-[var(--meta-quiet)]">{meta}</p>
        ) : null}
      </div>
    </header>
  );
}



function describeUpdated(iso?: string) {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return undefined;
  const diffDays = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Updated today";
  if (diffDays === 1) return "Updated yesterday";
  if (diffDays > 1) return `Updated ${diffDays} days ago`;
  const ahead = Math.abs(diffDays);
  if (ahead === 1) return "Updates tomorrow";
  return `Updates in ${ahead} days`;
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return "TBD";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
