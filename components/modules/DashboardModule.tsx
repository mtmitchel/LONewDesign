"use client";

import { useMemo, useState } from "react";
import {
  DashboardCard,
  QuietLink,
  ShowMore,
  TimeWeatherChip,
} from "./dashboard/DashboardPrimitives";
import { cn } from "../ui/utils";

type ScheduleEvent = {
  id: string;
  title: string;
  location?: string;
  start: number;
  end: number;
};

type UrgentTask = {
  id: string;
  title: string;
  dueLabel: string;
  done?: boolean;
};

type FocusBlock = {
  id: string;
  title: string;
  summary: string;
  start: number;
  end: number;
};

type InboxItem = {
  id: string;
  title: string;
  preview?: string;
  source?: string;
  age?: string;
  unread?: boolean;
};

type ProjectSummary = {
  id: string;
  name: string;
  progress: number;
  nextStep: string;
};

type ActivityEntry = {
  id: string;
  description: string;
  occurredAt: string;
};

type SignalItem = {
  id: string;
  title: string;
  source: string;
  url?: string;
};

const schedule: ScheduleEvent[] = [
  {
    id: "event-standup",
    title: "Daily stand-up",
    location: "Main project space",
    start: new Date().setHours(9, 30, 0, 0),
    end: new Date().setHours(9, 55, 0, 0),
  },
  {
    id: "event-ops-sync",
    title: "Ops enablement sync",
    location: "Room 3F",
    start: new Date().setHours(11, 0, 0, 0),
    end: new Date().setHours(12, 0, 0, 0),
  },
  {
    id: "event-brainstorm",
    title: "Canvas brainstorm",
    location: "Canvas studio",
    start: new Date().setHours(13, 0, 0, 0),
    end: new Date().setHours(14, 0, 0, 0),
  },
  {
    id: "event-retro",
    title: "Sprint retro",
    location: "Room 2D",
    start: new Date().setHours(16, 0, 0, 0),
    end: new Date().setHours(17, 0, 0, 0),
  },
];

const initialUrgent: UrgentTask[] = [
  {
    id: "task-dashboard-copy",
    title: "Polish dashboard hero copy",
    dueLabel: "Due in 2h",
  },
  {
    id: "task-calendar-map",
    title: "Review calendar ↔ tasks data map",
    dueLabel: "Today",
  },
  {
    id: "task-feedback",
    title: "Draft feedback for client PDF export",
    dueLabel: "Due soon",
  },
  {
    id: "task-ai-notes",
    title: "Prep AI assistant change-log",
    dueLabel: "Tomorrow",
  },
];

const focusBlocks: FocusBlock[] = [
  {
    id: "focus-deep-work",
    title: "Deep work",
    summary: "Mute notifications and close the Today stream.",
    start: new Date().setHours(10, 0, 0, 0),
    end: new Date().setHours(12, 0, 0, 0),
  },
];

const inboxItems: InboxItem[] = [
  {
    id: "inbox-note",
    title: "Interview notes: assistant routing",
    preview:
      "“When I capture something I want it to land in the right project automatically.”",
    age: "5m ago",
    source: "Docs",
    unread: true,
  },
  {
    id: "inbox-task",
    title: "Bug triage: tri-pane resize",
    preview: "Safari drag handles slip under footer when collapsed.",
    age: "18m ago",
    source: "Tasks",
  },
  {
    id: "inbox-email",
    title: "Client: export timeline as PDF",
    preview: "Could October include a printable view of the Today stream?",
    age: "1h ago",
    source: "Mail",
  },
  {
    id: "inbox-clip",
    title: "Clip: focus block inspiration",
    preview: "Great breakdown on guided focus workflows across surfaces.",
    age: "Yesterday",
    source: "Clips",
  },
];

const projects: ProjectSummary[] = [
  {
    id: "project-unified-ui",
    name: "Unified UI redesign",
    progress: 62,
    nextStep: "Link dashboard cards to context panel",
  },
  {
    id: "project-canvas-ai",
    name: "Canvas AI assist",
    progress: 44,
    nextStep: "Tune summarization prompts",
  },
  {
    id: "project-ops",
    name: "Ops enablement handoff",
    progress: 78,
    nextStep: "Finalize quick-start walkthrough",
  },
  {
    id: "project-scout",
    name: "Scout research hub",
    progress: 23,
    nextStep: "Tag interview clips",
  },
];

const signals: SignalItem[] = [
  {
    id: "signal-tauri",
    title: "Tauri 2.0 RC ships with sandbox improvements",
    source: "Desktop Weekly",
    url: "https://tauri.app/blog/tauri-2-rc",
  },
  {
    id: "signal-react",
    title: "React team shares 2025 server components roadmap",
    source: "React Status",
  },
  {
    id: "signal-ai",
    title: "Anthropic adds timeline summarizer hooks",
    source: "AI Digest",
  },
];

const activity: ActivityEntry[] = [
  {
    id: "activity-link",
    description: "Linked “Tasks ↔ Calendar Sync Spec” to dashboard overview",
    occurredAt: new Date().toISOString(),
  },
  {
    id: "activity-task",
    description: "Alex completed “Console audit for Quick Assistant”",
    occurredAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "activity-note",
    description: "Priya added highlights to “Client roundtable recap”",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
];

function formatDateLabel(): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function formatTime(): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

function formatTimeRange(start: number, end: number) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function isWithinWindow(start: number, end: number) {
  const now = Date.now();
  return now >= start && now <= end;
}

export function DashboardModule() {
  const [urgentTasks, setUrgentTasks] = useState(initialUrgent);

  const topEvents = schedule.slice(0, 3);
  const remainingEvents = schedule.slice(3);

  const nowMs = Date.now();
  const focusCandidate = focusBlocks.find((block) => {
    const active = isWithinWindow(block.start, block.end);
    const startsSoon = !active && block.start > nowMs && block.start - nowMs <= 90 * 60 * 1000;
    return active || startsSoon;
  });
  const focusIsActive = Boolean(
    focusCandidate && isWithinWindow(focusCandidate.start, focusCandidate.end),
  );
  const hasUpcomingFocus = Boolean(focusCandidate);

  const urgentVisible = urgentTasks.slice(0, 3);
  const urgentOverflow = Math.max(urgentTasks.length - urgentVisible.length, 0);

  const inboxVisible = inboxItems.slice(0, 3);
  const inboxOverflow = Math.max(inboxItems.length - inboxVisible.length, 0);

  const projectVisible = projects.slice(0, 3);
  const projectOverflow = Math.max(projects.length - projectVisible.length, 0);

  const signalVisible = signals.slice(0, 3);
  const signalOverflow = Math.max(signals.length - signalVisible.length, 0);

  const recentActivityCount = useMemo(() => {
    const dayAgo = Date.now() - 1000 * 60 * 60 * 24;
    return activity
      .filter((entry) => Date.parse(entry.occurredAt) >= dayAgo)
      .length;
  }, []);
  const showTimelineLink = recentActivityCount > 0;

  const handleTaskToggle = (id: string) => {
    setUrgentTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              done: !task.done,
            }
          : task,
      ),
    );
  };

  const headerLinks: JSX.Element[] = [];
  if (!hasUpcomingFocus) {
    headerLinks.push(
      <QuietLink key="focus-session" href="/focus/new">
        Start focus session
      </QuietLink>,
    );
  }
  if (showTimelineLink) {
    headerLinks.push(
      <QuietLink key="view-timeline" href="/timeline">
        View timeline
      </QuietLink>,
    );
  }

  const hour = new Date().getHours();
  const isNight = hour >= 20 || hour < 6;
  const weatherKind = isNight ? "cloudMoon" : "cloudSun";
  const currentTime = formatTime();
  const dateLabel = formatDateLabel();
  const focusSummary = focusCandidate?.summary;

  return (
    <div className="h-full overflow-auto bg-[var(--bg-canvas)]">
      <header className="mx-auto flex w-full max-w-[var(--dashboard-max-w)] items-start justify-between px-[var(--space-6)] py-[var(--dash-header-pad-y)]">
        <div>
          <div
            className="mb-[var(--dash-header-gap)] text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Today + inbox
          </div>
          <h1
            className="text-[var(--dash-title-size)] font-semibold leading-tight"
            style={{ color: "var(--heading-color)" }}
          >
            Today overview
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {dateLabel}
          </p>
          {headerLinks.length ? (
            <div
              className="mt-2 flex flex-wrap gap-3 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {headerLinks}
            </div>
          ) : null}
        </div>
        <TimeWeatherChip
          className="shrink-0"
          time={currentTime}
          tempC={18}
          kind={weatherKind}
          location="San Francisco"
          summary="Partly cloudy"
        />
      </header>

      <main className="mx-auto w-full max-w-[var(--dashboard-max-w)] px-[var(--space-6)] pb-[var(--space-8)]">
        <section
          className={cn(
            "grid grid-cols-1 gap-[var(--dash-gap)] md:grid-cols-2",
            hasUpcomingFocus && "xl:grid-cols-3",
          )}
          aria-label="Now"
        >
          <DashboardCard
            id="dashboard-next-up"
            title="Next up"
            action={<QuietLink href="/calendar">Open calendar</QuietLink>}
          >
            <ul className="divide-y divide-[var(--card-border)]">
              {topEvents.map((event) => (
                <li key={event.id} className="flex items-start justify-between gap-4 py-[var(--row-pad)]">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">
                      {event.title}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {formatTimeRange(event.start, event.end)}
                      {event.location ? ` · ${event.location}` : ""}
                    </p>
                  </div>
                  <QuietLink href={`/calendar/${event.id}`}>Open</QuietLink>
                </li>
              ))}
            </ul>
            <ShowMore
              count={remainingEvents.length}
              href="/calendar"
              label={`${remainingEvents.length} later today →`}
            />
          </DashboardCard>

          <DashboardCard
            id="dashboard-urgent"
            title="Urgent tasks"
            action={<QuietLink href="/tasks">Open tasks</QuietLink>}
          >
            <ul className="divide-y divide-[var(--card-border)]">
              {urgentVisible.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-4 py-[var(--row-pad)]">
                  <label className="flex min-w-0 items-center gap-3">
                    <input
                      type="checkbox"
                      className="size-4 rounded border border-[var(--card-border)] accent-[var(--primary)]"
                      checked={Boolean(task.done)}
                      onChange={() => handleTaskToggle(task.id)}
                    />
                    <span
                      className={cn(
                        "truncate text-sm text-[var(--text-primary)]",
                        task.done && "line-through text-[var(--text-tertiary)]",
                      )}
                    >
                      {task.title}
                    </span>
                  </label>
                  <span className="shrink-0 text-xs text-[var(--text-tertiary)]">{task.dueLabel}</span>
                </li>
              ))}
            </ul>
            <ShowMore
              count={urgentOverflow}
              href="/tasks?filter=urgent"
              label={`${urgentOverflow} remaining today →`}
            />
          </DashboardCard>

            {hasUpcomingFocus && focusCandidate ? (
              <DashboardCard id="dashboard-focus" title="Focus">
                <div className="space-y-[var(--row-pad)]">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">
                      {focusCandidate.title}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {focusIsActive
                        ? "Focus is running"
                        : formatTimeRange(focusCandidate.start, focusCandidate.end)}
                    </p>
                    {focusSummary ? (
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-1">
                        {focusSummary}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <QuietLink href="/focus">{focusIsActive ? "Stop" : "Start"}</QuietLink>
                    {!focusIsActive ? (
                      <QuietLink href="/focus/schedule" className="opacity-80">
                        Schedule
                      </QuietLink>
                    ) : null}
                  </div>
                </div>
              </DashboardCard>
            ) : null}
        </section>

        <section className="mt-[var(--dash-gap)] grid grid-cols-1 gap-[var(--dash-gap)] lg:grid-cols-2">
          <DashboardCard
            id="dashboard-projects"
            title="Projects"
            action={<QuietLink href="/projects">View all</QuietLink>}
          >
            <div className="space-y-2">
              {projectVisible.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </div>
            <ShowMore
              count={projectOverflow}
              href="/projects"
              label={`${projectOverflow} more projects →`}
            />
          </DashboardCard>

          <DashboardCard
            id="dashboard-inbox"
            title="Inbox"
            action={<QuietLink href="/inbox">Open inbox</QuietLink>}
          >
            <ul className="divide-y divide-[var(--card-border)]">
              {inboxVisible.map((item) => (
                <li key={item.id} className="py-[var(--row-pad)]">
                  <div className="flex items-start gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        "mt-2 size-1.5 rounded-full",
                        item.unread ? "bg-[var(--text-primary)]" : "bg-transparent",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-[var(--text-primary)] line-clamp-1">
                          {item.title}
                        </span>
                        {item.age ? (
                          <span className="shrink-0 text-xs text-[var(--text-tertiary)]">
                            {item.age}
                          </span>
                        ) : null}
                      </div>
                      {item.preview ? (
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-1">
                          {item.preview}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                        <QuietLink href={`/inbox/${item.id}`}>Open</QuietLink>
                        <QuietLink href={`/inbox/${item.id}/file`} className="opacity-80">
                          File
                        </QuietLink>
                        <QuietLink href={`/inbox/${item.id}/snooze`} className="opacity-80">
                          Snooze
                        </QuietLink>
                        {item.source ? (
                          <span className="ml-auto text-xs text-[var(--text-tertiary)]">
                            {item.source}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <ShowMore
              count={inboxOverflow}
              href="/inbox"
              label={`${inboxOverflow} waiting →`}
            />
          </DashboardCard>
        </section>

        <section className="mt-[var(--dash-gap)]">
          <DashboardCard
            id="dashboard-signals"
            title="Signals"
            action={<QuietLink href="/signals">View feed</QuietLink>}
          >
            <ul className="space-y-[var(--row-pad)]">
              {signalVisible.map((item) => (
                <li key={item.id} className="space-y-1">
                  <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">
                    {item.title}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>{item.source}</span>
                    <QuietLink href={item.url ?? "#"}>Open</QuietLink>
                  </div>
                </li>
              ))}
            </ul>
            <ShowMore
              count={signalOverflow}
              href="/signals"
              label={`${signalOverflow} more updates →`}
            />
          </DashboardCard>
        </section>
      </main>
    </div>
  );
}

function ProjectRow({ project }: { project: ProjectSummary }) {
  return (
    <a
      href={`/projects/${project.id}`}
      className="block rounded-[var(--radius-md)] px-3 py-2 transition-colors hover:bg-[var(--bg-surface-elevated)]"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-[var(--text-primary)] line-clamp-1">
          {project.name}
        </span>
        <span className="rounded-full border border-[var(--card-border)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
          {Math.round(project.progress)}%
        </span>
      </div>
      <p className="text-sm text-[var(--text-secondary)] line-clamp-1">
        Next step: {project.nextStep}
      </p>
      <div className="mt-2 h-1 rounded-full bg-[var(--bg-surface-elevated)]">
        <div
          className="h-1 rounded-full bg-[var(--primary)]"
          style={{ width: `${project.progress}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(project.progress)}
        />
      </div>
    </a>
  );
}