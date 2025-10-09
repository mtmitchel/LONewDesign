import React from "react";
import {
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  Wind,
} from "lucide-react";
import { cn } from "../../ui/utils";

export function SectionHeader({
  eyebrow,
  title,
  action,
  titleId,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
  titleId: string;
}) {
  return (
    <div className="flex items-start justify-between px-[var(--card-pad)] pt-[var(--card-pad)]">
      <div>
        {eyebrow ? (
          <div
            className="text-xs [color:var(--eyebrow-color)]"
            style={{ letterSpacing: "var(--eyebrow-ls)" }}
          >
            {eyebrow}
          </div>
        ) : null}
        <h3
          id={titleId}
          className="text-base font-medium [color:var(--heading-color)]"
        >
          {title}
        </h3>
      </div>
      {action}
    </div>
  );
}

export function QuietLink({ className, ...rest }: React.ComponentProps<"a">) {
  return (
    <a
      {...rest}
      className={cn(
        "text-sm underline decoration-dotted underline-offset-2 transition-opacity",
        "[color:var(--link-quiet-color)] hover:opacity-90 focus-visible:opacity-100",
        className,
      )}
    />
  );
}

export function DashboardCard({
  id,
  title,
  eyebrow,
  action,
  children,
  className,
}: {
  id: string;
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const titleId = `${id}-title`;

  return (
    <section
      role="region"
      aria-labelledby={titleId}
      className={cn(
        "rounded-[var(--card-radius)] border border-[var(--card-border)]",
        "bg-[var(--bg-surface)] shadow-[var(--card-elevation)]",
        className,
      )}
    >
      <SectionHeader eyebrow={eyebrow} title={title} action={action} titleId={titleId} />
      <div className="px-[var(--card-pad)] pb-[var(--card-pad)] pt-[var(--space-2)]">
        {children}
      </div>
    </section>
  );
}

export type WeatherKind =
  | "sun"
  | "cloudSun"
  | "rain"
  | "drizzle"
  | "snow"
  | "fog"
  | "wind"
  | "thunder"
  | "moon"
  | "cloudMoon";

function WeatherIcon({ kind }: { kind: WeatherKind }) {
  const cls = "size-[var(--icon-md)] text-[color:var(--text-secondary)]";
  switch (kind) {
    case "sun":
      return <Sun className={cls} aria-hidden />;
    case "moon":
      return <Moon className={cls} aria-hidden />;
    case "cloudSun":
      return <CloudSun className={cls} aria-hidden />;
    case "cloudMoon":
      return <CloudMoon className={cls} aria-hidden />;
    case "rain":
      return <CloudRain className={cls} aria-hidden />;
    case "drizzle":
      return <CloudDrizzle className={cls} aria-hidden />;
    case "snow":
      return <CloudSnow className={cls} aria-hidden />;
    case "fog":
      return <CloudFog className={cls} aria-hidden />;
    case "wind":
      return <Wind className={cls} aria-hidden />;
    case "thunder":
      return <CloudLightning className={cls} aria-hidden />;
    default:
      return <CloudSun className={cls} aria-hidden />;
  }
}

export function TimeWeatherChip({
  time,
  tempC,
  kind,
  location,
  summary,
  onClick,
  className,
}: {
  time: string;
  tempC?: number;
  kind: WeatherKind;
  location?: string;
  summary?: string;
  onClick?: () => void;
  className?: string;
}) {
  const roundedTemp =
    typeof tempC === "number" && Number.isFinite(tempC)
      ? Math.round(tempC)
      : undefined;

  const labelParts: string[] = [];
  if (summary) labelParts.push(summary);
  if (roundedTemp !== undefined) labelParts.push(`${roundedTemp}°`);
  if (location) labelParts.push(location);
  const label = labelParts.join(", ") || "Weather";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--chip-radius)] border border-[var(--chip-border)] bg-[var(--chip-bg)] px-[var(--chip-pad-x)] py-[var(--chip-pad-y)] text-sm [color:var(--text-secondary)] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]",
        className,
      )}
      aria-label={label}
      title={location ?? summary ?? "Weather"}
    >
      <WeatherIcon kind={kind} />
      <span>{time}</span>
      <span aria-hidden>•</span>
      <span>{roundedTemp !== undefined ? `${roundedTemp}°` : "—"}</span>
    </button>
  );
}

export function ShowMore({ count, href, label }: { count: number; href: string; label: string }) {
  if (count <= 0) return null;
  return (
    <div className="pt-[var(--row-pad)]">
      <QuietLink href={href}>{label}</QuietLink>
    </div>
  );
}
