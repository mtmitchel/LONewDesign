import * as React from "react";
import { CalendarDays, NotebookPen, Target } from "lucide-react";
import { Project, ProjectArtifact, ProjectMilestone } from "./data";
import { DashboardCard } from "../dashboard/DashboardPrimitives";
import { Button } from "../../ui/button";
import { cn } from "../../ui/utils";

interface ProjectOverviewProps {
  project: Project;
  milestones: ProjectMilestone[];
  artifacts: ProjectArtifact[];
  onAddAction: () => void;
}

export function ProjectOverview({ project, milestones, artifacts, onAddAction }: ProjectOverviewProps) {
  return (
    <div className="space-y-[var(--dash-gap)] px-[var(--space-6)] py-[var(--space-6)]">
      <header className="flex flex-wrap items-start gap-[var(--space-4)]">
        <div className="space-y-[var(--space-2)]">
          <p className="text-xs text-[color:var(--text-secondary)]">Category: {project.focusArea}</p>
          <h1 className="text-[length:var(--text-2xl)] font-semibold text-[color:var(--text-primary)]" data-user-content>
            {project.name}
          </h1>
          <p className="text-xs text-[color:var(--text-tertiary)]" aria-hidden>
            Press ⌘/Ctrl+K to add
          </p>
          <p className="max-w-prose text-sm text-[color:var(--text-secondary)]">{project.summary}</p>
          <p className="text-xs text-[color:var(--text-secondary)]">
            Due {formatDate(project.dueDate)} · Last updated {formatRelative(project.lastUpdated)}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-[var(--dash-gap)] xl:grid-cols-[1.2fr_1fr]">
        <DashboardCard id="project-progress" title="Progress snapshot" variant="chrome">
          <div className="space-y-[var(--space-4)]">
            <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)]">
              <div>
                <p className="text-xs text-[color:var(--text-tertiary)]">Completion</p>
                <p className="text-[length:var(--text-lg)] font-semibold text-[color:var(--text-primary)]">
                  {Math.round(project.progress * 100)}%
                </p>
              </div>
              <div className="flex items-center gap-[var(--space-2)] rounded-[var(--radius-full)] bg-[var(--chip-bg)] px-[var(--chip-pad-x)] py-[var(--chip-pad-y)] text-xs text-[color:var(--text-secondary)]">
                <Target className="size-[var(--icon-sm)]" aria-hidden />
                Phase {project.code}
              </div>
            </div>
            <div className="max-w-[var(--content-measure-short)]">
              <div className="h-2 rounded-full bg-[var(--bg-surface-elevated)]">
                <div
                  className="h-2 rounded-full bg-[var(--primary)]"
                  style={{ width: `${Math.min(100, Math.round(project.progress * 100))}%` }}
                  role="progressbar"
                  aria-valuenow={Math.round(project.progress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
            <div className="flex flex-col gap-[var(--space-2)] text-sm text-[color:var(--text-secondary)]">
              <span>
                Next up: <strong className="text-[color:var(--text-primary)]">{project.nextStep ?? milestones[0]?.title ?? "Outline your next milestone"}</strong>
              </span>
              <span>{relativeTime(project)}</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard id="project-milestones" title="Upcoming milestones" variant="chrome">
          <ul className="space-y-[var(--row-pad)]">
            {milestones.length === 0 ? (
              <EmptyState icon={<CalendarDays className="size-5" aria-hidden />} title="No milestones" subtitle="Schedule the next checkpoint to keep momentum." />
            ) : (
              milestones.map((milestone) => (
                <li key={milestone.id} className="flex items-start justify-between gap-[var(--space-3)]">
                  <div>
                    <p className="text-sm font-medium text-[color:var(--text-primary)]">{milestone.title}</p>
                    <p className="text-xs text-[color:var(--text-secondary)]">{formatDate(milestone.date)}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-[var(--space-3)] py-[var(--space-1)] text-xs",
                      milestone.status === "at-risk"
                        ? "bg-[var(--danger-tint-20)] text-[var(--danger)]"
                        : "bg-[var(--primary-tint-10)] text-[color:var(--text-secondary)]",
                    )}
                  >
                    {milestone.status === "at-risk" ? "At risk" : "Upcoming"}
                  </span>
                </li>
              ))
            )}
          </ul>
        </DashboardCard>
      </section>

      <section className="grid grid-cols-1 gap-[var(--dash-gap)] lg:grid-cols-2">
        <DashboardCard id="project-artifacts" title="Recent notes and emails" variant="chrome">
          <ul className="space-y-[var(--row-pad)]">
            {artifacts.length === 0 ? (
              <EmptyState icon={<NotebookPen className="size-5" aria-hidden />} title="No linked records" subtitle="Link notes or emails for quick access." />
            ) : (
              artifacts.map((artifact) => (
                <li key={artifact.id} className="flex items-center gap-[var(--space-3)]">
                  <div className="min-w-0 flex-1 space-y-[var(--space-1)]">
                    <p className="truncate text-sm font-medium text-[color:var(--text-primary)]">{artifact.title}</p>
                    <p className="text-xs text-[color:var(--text-secondary)]">
                      {artifact.kind === "note" ? "Note" : "Email"} · Updated {formatRelative(artifact.updatedAt)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
                    Open
                  </Button>
                </li>
              ))
            )}
          </ul>
        </DashboardCard>
      </section>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-[var(--space-4)] py-[var(--space-6)] text-center text-sm text-[color:var(--text-secondary)]">
      <div className="mx-auto mb-[var(--space-3)] grid size-10 place-items-center rounded-full bg-[var(--bg-surface)] text-[color:var(--text-secondary)] opacity-80">
        {icon}
      </div>
      <p className="font-medium text-[color:var(--text-primary)]">{title}</p>
      <p className="text-xs text-[color:var(--text-secondary)]">{subtitle}</p>
    </div>
  );
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return "TBD";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatRelative(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return "Recently";
  return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(
    Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    "day",
  );
}

function relativeTime(project: Project) {
  const percent = Math.round(project.progress * 100);
  if (percent >= 100) return "Ready for wrap-up";
  const remaining = Math.max(0, Math.ceil((new Date(project.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  return remaining > 0 ? `${remaining} days until due` : "Past due";
}
