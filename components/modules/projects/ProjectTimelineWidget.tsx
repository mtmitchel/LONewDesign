import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { cn } from "../../ui/utils";

export type TimelinePhaseStatus = "completed" | "current" | "upcoming";

export interface ProjectPhase {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: TimelinePhaseStatus;
  completionPercentage: number;
  taskCount?: number;
}

export interface ProjectMilestoneTimeline {
  id: string;
  title: string;
  date: Date;
  status: "completed" | "upcoming" | "at-risk";
  description?: string;
}

export interface ProjectTimelineWidgetProps {
  projectName: string;
  phases: ProjectPhase[];
  milestones: ProjectMilestoneTimeline[];
  startDate: Date;
  endDate: Date;
  currentProgress: number;
  className?: string;
  onPhaseSelect?: (phaseId: string) => void;
  onMilestoneSelect?: (milestoneId: string) => void;
}

const PHASE_COLORS: Record<TimelinePhaseStatus, { fill: string; track: string }> = {
  completed: {
    fill: "bg-[var(--success)]",
    track: "bg-[var(--success-tint-20)]",
  },
  current: {
    fill: "bg-[var(--primary)]",
    track: "bg-[var(--primary-tint-10)]",
  },
  upcoming: {
    fill: "bg-[var(--text-tertiary)]",
    track: "bg-[var(--border-subtle)]",
  },
};

type ComputedPhase = ProjectPhase & {
  startPercentage: number;
  widthPercentage: number;
  isCurrent: boolean;
};

type ComputedMilestone = ProjectMilestoneTimeline & {
  position: number;
};

export function ProjectTimelineWidget({
  projectName,
  phases,
  milestones,
  startDate,
  endDate,
  currentProgress,
  className,
  onPhaseSelect,
  onMilestoneSelect,
}: ProjectTimelineWidgetProps) {
  const normalized = React.useMemo(() => normalizeTimelineBounds({ phases, milestones, startDate, endDate }), [phases, milestones, startDate, endDate]);

  const computedPhases = React.useMemo<ComputedPhase[]>(
    () =>
      phases.map((phase) => {
        const start = new Date(phase.startDate).getTime();
        const endMs = new Date(phase.endDate).getTime();
        const { rangeStart, rangeDuration } = normalized;
        const phaseStart = Math.max(start, rangeStart);
        const phaseEnd = Math.max(endMs, phaseStart + 1);
        const startPercentage = ((phaseStart - rangeStart) / rangeDuration) * 100;
        const widthPercentage = ((phaseEnd - phaseStart) / rangeDuration) * 100;
        return {
          ...phase,
          startPercentage: clamp(startPercentage, 0, 100),
          widthPercentage: clamp(widthPercentage, 1, 100),
          isCurrent: phase.status === "current",
        };
      }),
    [normalized, phases],
  );

  const computedMilestones = React.useMemo<ComputedMilestone[]>(
    () =>
      milestones.map((milestone) => {
        const ms = new Date(milestone.date).getTime();
        const position = ((ms - normalized.rangeStart) / normalized.rangeDuration) * 100;
        return {
          ...milestone,
          position: clamp(position, 0, 100),
        };
      }),
    [milestones, normalized.rangeDuration, normalized.rangeStart],
  );

  const clampedProgress = clamp(currentProgress, 0, 100);

  return (
    <Card
      className={cn(
        "border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--elevation-sm)]",
        "px-0",
        className,
      )}
      aria-label={`${projectName} timeline`}
    >
      <CardHeader className="pb-[var(--space-3)]">
        <CardTitle className="text-sm font-medium text-[color:var(--text-primary)]">Project timeline</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {computedPhases.length ? (
          <div className="space-y-[var(--space-3)]">
            <TimelineTrack
              phases={computedPhases}
              milestones={computedMilestones}
              progress={clampedProgress}
              onPhaseSelect={onPhaseSelect}
              onMilestoneSelect={onMilestoneSelect}
            />
            <PhaseList phases={computedPhases} onPhaseSelect={onPhaseSelect} />
          </div>
        ) : (
          <EmptyTimelineState />
        )}
      </CardContent>
    </Card>
  );
}

function TimelineTrack({
  phases,
  milestones,
  progress,
  onPhaseSelect,
  onMilestoneSelect,
}: {
  phases: ComputedPhase[];
  milestones: ComputedMilestone[];
  progress: number;
  onPhaseSelect?: (phaseId: string) => void;
  onMilestoneSelect?: (milestoneId: string) => void;
}) {
  return (
    <div className="relative">
      <div className="h-2 rounded-[var(--radius-sm)] bg-[var(--bg-surface-elevated)]" aria-hidden />
      {phases.map((phase) => {
        const colors = PHASE_COLORS[phase.status];
        const label = buildPhaseLabel(phase);
        return (
          <Tooltip key={phase.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={cn(
                  "absolute top-0 h-2 rounded-[var(--radius-sm)] transition-all",
                  colors.fill,
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]",
                  phase.isCurrent && "shadow-[var(--elevation-sm)]",
                )}
                style={{
                  left: `${phase.startPercentage}%`,
                  width: `${phase.widthPercentage}%`,
                }}
                aria-label={label}
                onClick={() => onPhaseSelect?.(phase.id)}
              />
            </TooltipTrigger>
            <TooltipContent sideOffset={12}>
              <span className="font-medium">{phase.name}</span>
              <div className="text-xs opacity-85">{formatPhaseDates(phase.startDate, phase.endDate)}</div>
            </TooltipContent>
          </Tooltip>
        );
      })}
      {milestones.map((milestone) => (
        <Tooltip key={milestone.id}>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                "absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-[var(--bg-surface)] transition-transform",
                getMilestoneColor(milestone.status),
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]",
              )}
              style={{ left: `${milestone.position}%` }}
              aria-label={buildMilestoneLabel(milestone)}
              onClick={() => onMilestoneSelect?.(milestone.id)}
            />
          </TooltipTrigger>
          <TooltipContent sideOffset={10}>
            <span className="font-medium">{milestone.title}</span>
            <div className="text-xs opacity-85">{formatDate(milestone.date)}</div>
            {milestone.description ? (
              <div className="mt-1 max-w-[240px] text-xs opacity-80">{milestone.description}</div>
            ) : null}
          </TooltipContent>
        </Tooltip>
      ))}
      <div
        className="absolute -top-2 h-6 w-0.5 rounded-full bg-[var(--primary)]"
        style={{ left: `${progress}%` }}
        aria-hidden
      />
    </div>
  );
}

function PhaseList({ phases, onPhaseSelect }: { phases: ComputedPhase[]; onPhaseSelect?: (phaseId: string) => void }) {
  return (
    <div className="space-y-[var(--space-2)]">
      {phases.map((phase) => (
        <button
          key={phase.id}
          type="button"
          className={cn(
            "flex w-full items-center justify-between rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1)] text-left text-sm transition-colors",
            phase.isCurrent ? "text-[color:var(--text-primary)] font-medium" : "text-[color:var(--text-secondary)]",
            "hover:bg-[var(--bg-surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]",
          )}
          onClick={() => onPhaseSelect?.(phase.id)}
          aria-label={`${phase.name}, ends ${formatDate(phase.endDate)}`}
        >
          <span className="truncate">{phase.name}</span>
          <span className="ml-[var(--space-3)] shrink-0 text-[color:var(--text-secondary)]">{formatDate(phase.endDate)}</span>
        </button>
      ))}
    </div>
  );
}

function EmptyTimelineState() {
  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center gap-[var(--space-2)] text-center text-sm text-[color:var(--text-secondary)]">
      <p>No timeline data yet.</p>
      <p className="max-w-sm text-[color:var(--text-tertiary)]">Connect phases and milestones to visualize project progress in a single calm view.</p>
    </div>
  );
}

function normalizeTimelineBounds({
  phases,
  milestones,
  startDate,
  endDate,
}: {
  phases: ProjectPhase[];
  milestones: ProjectMilestoneTimeline[];
  startDate: Date;
  endDate: Date;
}) {
  const phaseDates = phases.flatMap((phase) => [new Date(phase.startDate).getTime(), new Date(phase.endDate).getTime()]);
  const milestoneDates = milestones.map((milestone) => new Date(milestone.date).getTime());
  const candidates = [startDate.getTime(), endDate.getTime(), ...phaseDates, ...milestoneDates].filter((value) => Number.isFinite(value));
  const rangeStart = Math.min(...candidates);
  const rangeEnd = Math.max(...candidates);
  const safeEnd = Number.isFinite(rangeEnd) && rangeEnd !== rangeStart ? rangeEnd : rangeStart + 1;
  return {
    rangeStart,
    rangeDuration: safeEnd - rangeStart,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function formatPhaseDates(start: Date, end: Date) {
  const startLabel = formatDate(start);
  const endLabel = formatDate(end);
  return `${startLabel} – ${endLabel}`;
}

function buildPhaseLabel(phase: ProjectPhase) {
  const completion = `${Math.round(phase.completionPercentage)}% complete`;
  const due = `Ends ${formatDate(phase.endDate)}`;
  return `${phase.name}, ${phase.status} phase, ${completion}, ${due}`;
}

function buildMilestoneLabel(milestone: ProjectMilestoneTimeline) {
  return `${milestone.title}, ${milestone.status} milestone due ${formatDate(milestone.date)}`;
}

function getMilestoneColor(status: ProjectMilestoneTimeline["status"]) {
  switch (status) {
    case "completed":
      return "bg-[var(--success)]";
    case "at-risk":
      return "bg-[var(--warning)]";
    default:
      return "bg-[var(--primary)]";
  }
}
