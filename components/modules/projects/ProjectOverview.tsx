import * as React from "react";
import { CalendarDays, MessageSquare, NotebookPen, Target } from "lucide-react";
import { Project, ProjectArtifact, ProjectMilestone, ProjectThread } from "./data";
import { DashboardCard, QuietLink } from "../dashboard/DashboardPrimitives";
import { Button } from "../../ui/button";
import { cn } from "../../ui/utils";

interface ProjectOverviewProps {
  project: Project;
  milestones: ProjectMilestone[];
  artifacts: ProjectArtifact[];
  threads: ProjectThread[];
  onAddAction: () => void;
}

export function ProjectOverview({ project, milestones, artifacts, threads, onAddAction }: ProjectOverviewProps) {
  return (
    <div className="space-y-[var(--dash-gap)] px-[var(--space-6)] py-[var(--space-6)]">
      <header className="flex flex-wrap items-start justify-between gap-[var(--space-4)]">
        <div className="space-y-[var(--space-2)]">
          <span className="inline-flex items-center gap-[var(--space-2)] text-xs uppercase tracking-wide text-[color:var(--text-tertiary)]">
            {project.focusArea}
            <StatusBadge status={project.status} />
          </span>
          <h1 className="text-[length:var(--text-2xl)] font-semibold text-[color:var(--text-primary)]">
            {project.name}
          </h1>
          <p className="max-w-prose text-sm text-[color:var(--text-secondary)]">{project.summary}</p>
          <ul className="flex flex-wrap gap-[var(--space-3)] text-xs text-[color:var(--text-secondary)]">
            <li>
              Lead <strong className="text-[color:var(--text-primary)]">{project.lead}</strong>
            </li>
            <li role="separator" aria-hidden className="text-[color:var(--text-tertiary)]">
              •
            </li>
            <li>
              Team {project.team.join(", ")}
            </li>
            <li role="separator" aria-hidden className="text-[color:var(--text-tertiary)]">
              •
            </li>
            <li>Due {formatDate(project.dueDate)}</li>
          </ul>
        </div>
        <Button onClick={onAddAction} size="lg" className="whitespace-nowrap">
          Add
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-[var(--dash-gap)] xl:grid-cols-[1.2fr_1fr]">
        <DashboardCard id="project-progress" title="Progress snapshot">
          <div className="space-y-[var(--space-4)]">
            <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)]">
              <div>
                <p className="text-xs uppercase tracking-wide text-[color:var(--text-tertiary)]">Completion</p>
                <p className="text-[length:var(--text-lg)] font-semibold text-[color:var(--text-primary)]">
                  {Math.round(project.progress * 100)}%
                </p>
              </div>
              <div className="flex items-center gap-[var(--space-2)] rounded-[var(--radius-full)] bg-[var(--chip-bg)] px-[var(--chip-pad-x)] py-[var(--chip-pad-y)] text-xs text-[color:var(--text-secondary)]">
                <Target className="size-[var(--icon-sm)]" aria-hidden />
                Phase {project.code.toUpperCase()}
              </div>
            </div>
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
            <div className="flex flex-col gap-[var(--space-2)] text-sm text-[color:var(--text-secondary)]">
              <span>
                Next up: <strong className="text-[color:var(--text-primary)]">{milestones[0]?.title ?? "Assign upcoming milestone"}</strong>
              </span>
              <span>Last updated {relativeTime(project)}</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard id="project-milestones" title="Upcoming milestones" action={<QuietLink href="#">View timeline</QuietLink>}>
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
                        : "bg-[var(--primary-tint-10)] text-[var(--text-secondary)]",
                    )}
                  >
                    {milestone.status === "at-risk" ? "At risk" : "On track"}
                  </span>
                </li>
              ))
            )}
          </ul>
        </DashboardCard>
      </section>

      <section className="grid grid-cols-1 gap-[var(--dash-gap)] lg:grid-cols-2">
        <DashboardCard id="project-artifacts" title="Recent notes & emails" action={<QuietLink href="#">Open library</QuietLink>}>
          <ul className="space-y-[var(--row-pad)]">
            {artifacts.length === 0 ? (
              <EmptyState icon={<NotebookPen className="size-5" aria-hidden />} title="No linked records" subtitle="Link notes, emails, or files for quick access." />
            ) : (
              artifacts.map((artifact) => (
                <li key={artifact.id} className="flex items-center justify-between gap-[var(--space-3)]">
                  <div>
                    <p className="text-sm font-medium text-[color:var(--text-primary)]">{artifact.title}</p>
                    <p className="text-xs text-[color:var(--text-secondary)]">
                      {artifact.kind === "note" ? "Note" : "Email"} · Updated {formatRelative(artifact.updatedAt)} by {artifact.owner}
                    </p>
                  </div>
                  <QuietLink href="#">Open</QuietLink>
                </li>
              ))
            )}
          </ul>
        </DashboardCard>

        <DashboardCard id="project-threads" title="Pinned threads" action={<QuietLink href="#">Jump to chat</QuietLink>}>
          <ul className="space-y-[var(--row-pad)]">
            {threads.length === 0 ? (
              <EmptyState icon={<MessageSquare className="size-5" aria-hidden />} title="No pinned chats" subtitle="Pin an important thread to see it here." />
            ) : (
              threads.map((thread) => (
                <li key={thread.id} className="space-y-1">
                  <p className="text-sm font-medium text-[color:var(--text-primary)]">{thread.title}</p>
                  <div className="flex items-center justify-between text-xs text-[color:var(--text-secondary)]">
                    <span>{thread.channel}</span>
                    <span>{formatRelative(thread.lastMessageAt)}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </DashboardCard>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: Project["status"] }) {
  const content =
    status === "blocked"
      ? { label: "Blocked", tone: "bg-[var(--danger-tint-20)] text-[var(--danger)]" }
      : status === "at-risk"
        ? { label: "At risk", tone: "bg-[var(--warning-tint-20)] text-[var(--warning)]" }
        : { label: "On track", tone: "bg-[var(--success-tint-20)] text-[var(--success)]" };

  return (
    <span className={cn("rounded-full px-[var(--space-3)] py-[var(--space-1)] text-[10px] font-medium", content.tone)}>
      {content.label}
    </span>
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
