import * as React from "react";
import { Project, ProjectArtifact, ProjectMilestone } from "./data";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

interface ProjectOverviewProps {
  project: Project;
  milestones: ProjectMilestone[];
  artifacts: ProjectArtifact[];
}

export function ProjectOverview({ project, milestones, artifacts }: ProjectOverviewProps) {
  const progressPercent = Math.round(project.progress * 100);
  const dueMeta = project.dueDate ? `Due ${formatDate(project.dueDate)}` : undefined;
  const updatedMeta = describeUpdated(project.lastUpdated);
  const nextUp = project.nextStep ?? milestones[0]?.title ?? "Outline your next milestone";
  const dueNarrative = describeDue(project.dueDate);

  const progressItems: React.ReactNode[] = [
    (
      <div key="summary" className="flex items-center justify-between gap-[var(--space-3)]">
        <div>
          <p className="text-xs text-[color:var(--text-secondary)]">Completion</p>
          <p className="text-[length:var(--text-lg)] font-semibold text-[color:var(--text-primary)]">{progressPercent}%</p>
        </div>
        {project.focusArea ? (
          <span className="rounded-full bg-[var(--bg-surface-elevated)] px-[var(--space-3)] py-[var(--space-1)] text-xs text-[color:var(--text-secondary)]">
            {project.focusArea}
          </span>
        ) : null}
      </div>
    ),
    (
      <div
        key="progress"
        className="h-[var(--progress-thin-h)] overflow-hidden rounded-[var(--radius-sm)] bg-[var(--progress-thin-bg)]"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-[var(--progress-thin-fg)]" style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }} />
      </div>
    ),
    (
      <div key="next" className="text-sm text-[color:var(--text-secondary)]">
        Next up: <strong className="text-[color:var(--text-primary)]">{nextUp}</strong>
        {dueNarrative ? (
          <span className="ml-[var(--space-2)] text-[color:var(--text-tertiary)]">• {dueNarrative}</span>
        ) : null}
      </div>
    ),
  ];

  const milestoneItems = milestones.slice(0, 3).map((milestone) => (
    <div key={milestone.id} className="flex items-center justify-between gap-[var(--space-3)]">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[color:var(--text-primary)]">{milestone.title}</p>
        <p className="text-xs text-[color:var(--text-secondary)]">{formatDate(milestone.date)}</p>
      </div>
      <span
        className={
          milestone.status === "at-risk"
            ? "shrink-0 rounded-full bg-[var(--danger-tint-20)] px-[var(--space-3)] py-[var(--space-1)] text-xs text-[var(--danger)]"
            : "shrink-0 rounded-full bg-[var(--primary-tint-10)] px-[var(--space-3)] py-[var(--space-1)] text-xs text-[color:var(--text-secondary)]"
        }
      >
        {milestone.status === "at-risk" ? "At risk" : "Upcoming"}
      </span>
    </div>
  ));

  const artifactItems = artifacts.slice(0, 3).map((artifact) => (
    <div key={artifact.id} className="flex items-center gap-[var(--space-3)]">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[color:var(--text-primary)]">{artifact.title}</p>
        <p className="text-xs text-[color:var(--text-secondary)]">
          {artifact.kind === "note" ? "Note" : "Email"} · Updated {formatRelativeToNow(artifact.updatedAt)}
        </p>
      </div>
      <Button variant="ghost" size="sm" className="shrink-0 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
        Open
      </Button>
    </div>
  ));

  return (
    <div className="px-[var(--space-6)] py-[var(--space-6)]">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-[var(--space-6)]">
        <ProjectOverviewHeader title={project.name} dueText={dueMeta} updatedText={updatedMeta} />
        {project.summary ? (
          <p className="max-w-[var(--content-measure)] text-sm text-[color:var(--text-secondary)]">{project.summary}</p>
        ) : null}

        <div className="grid gap-[var(--overview-card-gap)] xl:grid-cols-12">
          <section className="xl:col-span-6">
            <OverviewCard title="Progress snapshot" items={progressItems} />
          </section>
          <section className="xl:col-span-6">
            <OverviewCard title="Upcoming milestones" items={milestoneItems} />
          </section>
          <section className="xl:col-span-12">
            <OverviewCard
              title="Recent notes and emails"
              items={artifactItems}
              footer={
                artifactItems.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start px-0 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  >
                    View all
                  </Button>
                ) : undefined
              }
            />
          </section>
        </div>
      </div>
    </div>
  );
}

export function ProjectOverviewHeader({
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
        {meta ? <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{meta}</p> : null}
      </div>
    </header>
  );
}

type OverviewCardProps = {
  title: string;
  items: React.ReactNode[];
  footer?: React.ReactNode;
};

export function OverviewCard({ title, items, footer }: OverviewCardProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--elevation-sm)]">
      <CardHeader className="pb-[var(--space-3)]">
        <CardTitle className="text-base text-[color:var(--text-primary)]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-[var(--space-3)] p-[var(--overview-card-pad)] pt-0">
        {items.slice(0, 3).map((item, index) => (
          <React.Fragment key={index}>{item}</React.Fragment>
        ))}
        {footer ? <div className="pt-[var(--space-2)] text-sm text-[color:var(--text-secondary)]">{footer}</div> : null}
      </CardContent>
    </Card>
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

function describeDue(iso?: string) {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return undefined;
  const diffDays = Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays > 1) return `Due in ${diffDays} days`;
  const overdue = Math.abs(diffDays);
  if (overdue === 1) return "Past due by 1 day";
  return `Past due by ${overdue} days`;
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return "TBD";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatRelativeToNow(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return "recently";
  const diffDays = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays > 1) return `${diffDays} days ago`;
  const ahead = Math.abs(diffDays);
  if (ahead === 1) return "tomorrow";
  return `in ${ahead} days`;
}
