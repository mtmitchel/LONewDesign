import * as React from "react";
import { Project, ProjectArtifact, ProjectMilestone } from "./data";

interface ProjectOverviewProps {
  project: Project;
  milestones: ProjectMilestone[];
  artifacts: ProjectArtifact[];
}

export function ProjectOverview({ project, milestones, artifacts }: ProjectOverviewProps) {
  const progressPercent = Math.min(100, Math.max(0, Math.round(project.progress * 100)));
  const dueMeta = project.dueDate ? `Due ${formatDate(project.dueDate)}` : undefined;
  const updatedMeta = describeUpdated(project.lastUpdated);
  const nextLabel = project.nextStep ?? milestones[0]?.title ?? undefined;
  const nextDue = describeDue(project.dueDate);

  const milestoneItems = milestones.slice(0, 3).map((milestone) => ({
    title: milestone.title,
    date: formatDate(milestone.date),
  }));

  const recentWorkItems = artifacts.slice(0, 3).map((artifact) => ({
    title: artifact.title,
    kind: (artifact.kind === "note" ? "Note" : "Email") as WorkItem["kind"],
    meta: formatRelativeToNow(artifact.updatedAt),
    onOpen: () => {
      /* no-op placeholder */
    },
  }));

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
          <div className="md:col-span-7 md:order-none order-1">
            <ProgressCard percent={progressPercent} nextLabel={nextLabel} nextDue={nextDue} />
          </div>
          <div className="md:col-span-5 md:order-none order-2">
            <MilestonesCard items={milestoneItems} />
          </div>
          <div className="md:col-span-12 order-3">
            <RecentWorkCard items={recentWorkItems} onViewAll={() => {}} />
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

export function ProgressCard({
  percent,
  nextLabel,
  nextDue,
}: {
  percent: number;
  nextLabel?: string;
  nextDue?: string;
}) {
  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Progress</h2>
      </div>
      <div className="card-body">
        <div className="grid gap-[var(--space-2)]">
          <div
            className="h-[var(--progress-h)] overflow-hidden rounded-[var(--radius-sm)] bg-[var(--border-divider)]"
            role="progressbar"
            aria-label="Completion"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span className="block h-full bg-[var(--primary)]" style={{ width: `${percent}%` }} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[color:var(--text-secondary)]">{percent}%</span>
            {nextLabel ? (
              <span className="truncate text-[var(--meta-quiet)]">
                Next up: <span className="text-[color:var(--text-primary)]">{nextLabel}</span>
                {nextDue ? ` • ${nextDue}` : ""}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

type MilestoneItem = { title: string; date: string };

export function MilestonesCard({ items }: { items: MilestoneItem[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Milestones</h2>
      </div>
      <ul className="card-body space-y-[var(--space-1)]">
        {items.map((item, index) => (
          <li
            key={`${item.title}-${index}`}
            className="flex h-[var(--list-row-h)] items-center justify-between rounded-[var(--radius-md)] px-[var(--list-row-pad-x)] hover:bg-[var(--bg-surface-elevated)]"
          >
            <span className="truncate text-[color:var(--text-primary)]">{item.title}</span>
            <time className="ml-[var(--space-3)] shrink-0 text-sm text-[var(--meta-quiet)]">{item.date}</time>
          </li>
        ))}
      </ul>
    </section>
  );
}

type WorkItem = { title: string; kind: "Note" | "Email"; meta: string; onOpen: () => void };

export function RecentWorkCard({ items, onViewAll }: { items: WorkItem[]; onViewAll: () => void }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Recent work</h2>
      </div>
      <ul className="card-body space-y-[var(--space-1)]">
        {items.map((item, index) => (
          <li
            key={`${item.title}-${index}`}
            className="group flex h-[var(--list-row-h)] items-center justify-between rounded-[var(--radius-md)] px-[var(--list-row-pad-x)] hover:bg-[var(--bg-surface-elevated)]"
          >
            <div className="min-w-0 flex items-center gap-[var(--list-row-gap)] text-sm">
              <span className="truncate text-[color:var(--text-primary)]">{item.title}</span>
              <span className="shrink-0 text-[var(--meta-quiet)]">— {item.kind} • {item.meta}</span>
            </div>
            <button
              type="button"
              onClick={item.onOpen}
              className="text-sm underline opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              Open
            </button>
          </li>
        ))}
      </ul>
      <div className="card-footer flex justify-end">
        <button type="button" onClick={onViewAll} className="text-sm underline">
          View all
        </button>
      </div>
    </section>
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
