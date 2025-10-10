import * as React from "react";
import { differenceInDays, format, startOfMonth, addMonths, isAfter, isBefore } from "date-fns";
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
    () => {
      const projectStart = new Date(normalized.rangeStart);
      const projectEnd = new Date(normalized.rangeStart + normalized.rangeDuration);
      const totalDays = differenceInDays(projectEnd, projectStart);

      return phases.map((phase) => {
        const phaseStartDate = new Date(phase.startDate);
        const phaseEndDate = new Date(phase.endDate);
        const daysFromStart = differenceInDays(phaseStartDate, projectStart);
        const phaseDuration = differenceInDays(phaseEndDate, phaseStartDate);
        
        const startPercentage = (daysFromStart / totalDays) * 100;
        const widthPercentage = (phaseDuration / totalDays) * 100;
        
        return {
          ...phase,
          startPercentage: clamp(startPercentage, 0, 100),
          widthPercentage: clamp(widthPercentage, 1, 100),
          isCurrent: phase.status === "current",
        };
      });
    },
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

  const timeMarkers = React.useMemo(() => {
    const projectStart = new Date(normalized.rangeStart);
    const projectEnd = new Date(normalized.rangeStart + normalized.rangeDuration);
    const markers: Array<{ date: Date; label: string; position: number }> = [];
    
    let currentMarker = startOfMonth(projectStart);
    const totalDays = differenceInDays(projectEnd, projectStart);
    
    while (isBefore(currentMarker, projectEnd) || currentMarker.getTime() === projectEnd.getTime()) {
      if (isAfter(currentMarker, projectStart) || currentMarker.getTime() === projectStart.getTime()) {
        const daysFromStart = differenceInDays(currentMarker, projectStart);
        const position = (daysFromStart / totalDays) * 100;
        markers.push({
          date: currentMarker,
          label: format(currentMarker, 'MMM d'),
          position: clamp(position, 0, 100),
        });
      }
      currentMarker = addMonths(currentMarker, 1);
    }
    
    return markers;
  }, [normalized]);

  const todayPosition = React.useMemo(() => {
    const projectStart = new Date(normalized.rangeStart);
    const projectEnd = new Date(normalized.rangeStart + normalized.rangeDuration);
    const today = new Date();
    
    if (isBefore(today, projectStart)) return -1;
    if (isAfter(today, projectEnd)) return -1;
    
    const totalDays = differenceInDays(projectEnd, projectStart);
    const daysFromStart = differenceInDays(today, projectStart);
    return clamp((daysFromStart / totalDays) * 100, 0, 100);
  }, [normalized]);

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
              timeMarkers={timeMarkers}
              todayPosition={todayPosition}
              onPhaseSelect={onPhaseSelect}
              onMilestoneSelect={onMilestoneSelect}
            />
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
  timeMarkers,
  todayPosition,
  onPhaseSelect,
  onMilestoneSelect,
}: {
  phases: ComputedPhase[];
  milestones: ComputedMilestone[];
  progress: number;
  timeMarkers: Array<{ date: Date; label: string; position: number }>;
  todayPosition: number;
  onPhaseSelect?: (phaseId: string) => void;
  onMilestoneSelect?: (milestoneId: string) => void;
}) {
  return (
    <div className="space-y-[var(--space-3)]">
      {/* Time scale header */}
      <div className="flex">
        <div className="w-28 shrink-0" /> {/* Spacer for phase name column */}
        <div className="flex-1 relative">
          <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2 text-xs text-[color:var(--text-secondary)]">
            {timeMarkers.map((marker, index) => (
              <div
                key={`${marker.label}-${index}`}
                className="absolute -translate-x-1/2"
                style={{ left: `${marker.position}%` }}
              >
                {marker.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vertically stacked phase rows */}
      <div className="space-y-[var(--space-2)] relative">
        {/* Today indicator - spans all rows */}
        {todayPosition >= 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[var(--primary)] z-10 pointer-events-none"
            style={{ 
              left: `calc(7rem + (100% - 7rem) * ${todayPosition / 100})`,
            }}
            aria-label="Current date"
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-medium text-[color:var(--primary)] whitespace-nowrap">
              Today
            </div>
          </div>
        )}
        
        {phases.map((phase, index) => {
          const colors = PHASE_COLORS[phase.status];
          const label = buildPhaseLabel(phase);
          
          return (
            <div key={phase.id} className="flex items-center">
              {/* Phase name column */}
              <div className="w-28 shrink-0 pr-3">
                <button
                  type="button"
                  onClick={() => onPhaseSelect?.(phase.id)}
                  className={cn(
                    "text-sm text-left hover:text-[color:var(--text-primary)] transition-colors",
                    phase.isCurrent 
                      ? "text-[color:var(--text-primary)] font-medium" 
                      : "text-[color:var(--text-secondary)]"
                  )}
                >
                  {phase.name}
                </button>
              </div>
              
              {/* Timeline row with positioned bar */}
              <div className="flex-1 relative h-6">
                {/* Track background */}
                <div className="absolute inset-0 bg-[var(--bg-surface-elevated)] rounded-[var(--radius-sm)]" />
                
                {/* Phase bar */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "absolute h-4 rounded-[var(--radius-sm)] transition-all",
                        colors.fill,
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]",
                        phase.isCurrent && "shadow-[var(--elevation-sm)]",
                      )}
                      style={{
                        left: `${phase.startPercentage}%`,
                        width: `${phase.widthPercentage}%`,
                        top: '4px',
                      }}
                      aria-label={label}
                      onClick={() => onPhaseSelect?.(phase.id)}
                    />
                  </TooltipTrigger>
                  <TooltipContent sideOffset={8}>
                    <span className="font-medium">{phase.name}</span>
                    <div className="text-xs opacity-85">{formatPhaseDates(phase.startDate, phase.endDate)}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {phase.completionPercentage}% complete
                    </div>
                  </TooltipContent>
                </Tooltip>
                

              </div>
            </div>
          );
        })}
        
        {/* Milestone row - no label needed */}
        {milestones.length > 0 && (
          <div className="flex items-center pt-2">
            <div className="w-28 shrink-0 pr-3">
              {/* Empty spacer to align with phase columns */}
            </div>
            <div className="flex-1 relative h-6">
              <div className="absolute inset-0 border-t border-[var(--border-subtle)]" />
              {milestones.map((milestone) => (
                <Tooltip key={milestone.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "absolute h-3 w-3 -translate-x-1/2 rounded-full border-2 border-[var(--bg-surface)] transition-transform z-20",
                        getMilestoneColor(milestone.status),
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]",
                      )}
                      style={{ 
                        left: `${milestone.position}%`,
                        top: '12px'
                      }}
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
            </div>
          </div>
        )}
      </div>
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
