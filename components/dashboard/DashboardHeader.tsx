import { TimeWeatherChip, WeatherKind } from "../modules/dashboard/DashboardPrimitives";
import { cn } from "../ui/utils";

export interface DashboardHeaderProps {
  title?: string;
  dateLabel: string;
  time: string;
  tempC?: number;
  weatherKind: WeatherKind;
  location?: string;
  summary?: string;
  className?: string;
}

export function DashboardHeader({
  title = "Today's overview",
  dateLabel,
  time,
  tempC,
  weatherKind,
  location,
  summary,
  className,
}: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        "mx-auto w-full max-w-[var(--dashboard-max-w)] px-[var(--space-6)] py-[var(--dash-header-py)]",
        "grid grid-cols-1 items-center gap-[var(--dash-header-gap)]",
        "md:[grid-template-columns:1fr_auto_1fr]",
        className,
      )}
    >
      <h1 className="justify-self-start text-[length:var(--dash-title-size)] font-semibold leading-tight [color:var(--heading-color)]">
        {title}
      </h1>

      <p className="justify-self-start text-sm text-[color:var(--text-secondary)] md:justify-self-center">
        {dateLabel}
      </p>

      <div className="justify-self-end">
        <TimeWeatherChip
          time={time}
          tempC={tempC}
          kind={weatherKind}
          location={location}
          summary={summary}
        />
      </div>
    </header>
  );
}
