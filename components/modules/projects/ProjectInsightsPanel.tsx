import * as React from "react";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";
import { ChevronRight, Lightbulb, Bell, Link as LinkIcon } from "lucide-react";

type Severity = "info" | "warn" | "danger" | "success";
type Insight = {
  id: string;
  title: string;
  detail?: string;
  severity?: Severity;
  cta?: { label: string; onClick: () => void; title?: string; ariaKeyshortcuts?: string };
};
type Reminder = {
  id: string;
  text: string;
  dueLabel?: string;
  onSnooze?: () => void;
  onDone?: () => void;
};
type RelatedKind = "task" | "note" | "email" | "file" | "chat" | "canvas";
type RelatedItem = { id: string; kind: RelatedKind; title: string; meta?: string; onOpen: () => void };

export interface ProjectInsightsPanelProps {
  projectId: string;
  loading?: boolean;
  lastUpdatedISO?: string;
  insights: Insight[];
  reminders: Reminder[];
  related: RelatedItem[];
  backlinks: { id: string; title: string; onOpen: () => void }[];
  onOpenAssistant: (projectId: string) => void;
}

export function ProjectInsightsPanel({
  projectId,
  loading,
  lastUpdatedISO,
  insights,
  reminders,
  related,
  backlinks,
  onOpenAssistant,
}: ProjectInsightsPanelProps) {
  const updatedLabel = lastUpdatedISO ? new Date(lastUpdatedISO).toLocaleString() : undefined;

  return (
    <aside
      role="complementary"
      aria-label="Project insights"
      className="h-full overflow-auto hide-scrollbar"
      style={{ borderLeft: "var(--tripane-border)" }}
    >
      <div className="bg-[var(--bg-panel)] p-[var(--panel-pad-y)] px-[var(--panel-pad-x)]">
        <header className="mb-[var(--space-6)]">
          <h3 className="text-[color:var(--text-primary)] text-[length:var(--text-lg)] font-semibold">Insights</h3>
          {updatedLabel && (
            <span className="text-[color:var(--text-secondary)] text-[length:var(--text-xs)]">
              Updated {updatedLabel}
            </span>
          )}
        </header>

        <Section title="AI insights" icon={<Lightbulb className="size-[var(--icon-md)]" />}>
          <StackedList>
            {loading ? (
              <SkeletonRows />
            ) : (
              insights.slice(0, 4).map((i) => (
                <Row key={i.id}>
                  <div className="min-w-0">
                    <div className="text-[color:var(--text-primary)] text-[length:var(--text-sm)] line-clamp-2">
                      {i.title}
                    </div>
                    {i.detail && (
                      <div className="text-[color:var(--text-secondary)] text-[length:var(--text-xs)] line-clamp-2">
                        {i.detail}
                      </div>
                    )}
                  </div>
                  {i.cta && (
                    <Button
                      variant="ghost"
                      className="shrink-0"
                      onClick={i.cta.onClick}
                      title={i.cta.title ?? i.cta.label}
                      aria-keyshortcuts={i.cta.ariaKeyshortcuts}
                    >
                      {i.cta.label}
                      <ChevronRight className="ml-[var(--space-1)] size-[var(--icon-sm)]" />
                    </Button>
                  )}
                </Row>
              ))
            )}
            {!loading && insights.length === 0 && <EmptyHint text="Nothing to surface right now." />}
          </StackedList>
        </Section>

        <Separator className="my-[var(--space-6)] bg-[var(--border-divider)]" />

        <Section title="Reminders" icon={<Bell className="size-[var(--icon-md)]" />}>
          <StackedList>
            {loading ? (
              <SkeletonRows />
            ) : (
              reminders.slice(0, 3).map((r) => (
                <Row key={r.id}>
                  <div className="min-w-0">
                    <div className="text-[color:var(--text-primary)] text-[length:var(--text-sm)] line-clamp-2">
                      {r.text}
                    </div>
                    {r.dueLabel && (
                      <div className="text-[color:var(--text-secondary)] text-[length:var(--text-xs)]">{r.dueLabel}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-[var(--space-2)]">
                    {r.onSnooze && (
                      <Button variant="ghost" onClick={r.onSnooze}>
                        Snooze
                      </Button>
                    )}
                    {r.onDone && (
                      <Button variant="ghost" onClick={r.onDone}>
                        Done
                      </Button>
                    )}
                  </div>
                </Row>
              ))
            )}
            {!loading && reminders.length === 0 && <EmptyHint text="No reminders." />}
          </StackedList>
        </Section>

        <Separator className="my-[var(--space-6)] bg-[var(--border-divider)]" />

        <Section title="Related items" icon={<LinkIcon className="size-[var(--icon-md)]" />}>
          <StackedList>
            {loading ? (
              <SkeletonRows />
            ) : (
              related.slice(0, 3).map((it) => (
                <Row key={it.id} onClick={it.onOpen} role="button" tabIndex={0}>
                  <span className="text-[color:var(--text-secondary)] text-[length:var(--text-xs)] mr-[var(--space-2)] capitalize">
                    {it.kind}
                  </span>
                  <span className="min-w-0 text-[color:var(--text-primary)] text-[length:var(--text-sm)] line-clamp-1">
                    {it.title}
                  </span>
                </Row>
              ))
            )}
            {!loading && related.length === 0 && <EmptyHint text="No recent related items." />}
          </StackedList>
        </Section>

        {backlinks.length > 0 && (
          <>
            <Separator className="my-[var(--space-6)] bg-[var(--border-divider)]" />
            <Section title="Backlinks">
              <StackedList>
                {backlinks.slice(0, 4).map((b) => (
                  <Row key={b.id} onClick={b.onOpen} role="button" tabIndex={0}>
                    <span className="min-w-0 text-[color:var(--text-primary)] text-[length:var(--text-sm)] line-clamp-1">
                      {b.title}
                    </span>
                  </Row>
                ))}
              </StackedList>
            </Section>
          </>
        )}
      </div>
    </aside>
  );
}

/* — helpers — */

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-[var(--space-4)]">
      <div className="flex items-center gap-[var(--space-2)]">
        {icon && <span className="text-[color:var(--text-primary)]">{icon}</span>}
        <h4 className="text-[length:var(--text-sm)] text-[color:var(--text-primary)] font-semibold">{title}</h4>
      </div>
      {children}
    </section>
  );
}
function StackedList({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}
function Row(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className="group flex items-center justify-between gap-[var(--row-gap)] min-h-[var(--row-min-h)] rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)] hover:bg-[var(--hover-bg)] motion-safe:transition"
    />
  );
}
function EmptyHint({ text }: { text: string }) {
  return (
    <div className="text-[color:var(--text-secondary)] text-[length:var(--text-sm)] italic py-[var(--space-2)]">
      {text}
    </div>
  );
}
function SkeletonRows() {
  return (
    <div aria-live="polite" className="animate-pulse space-y-[var(--space-2)]">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-[var(--row-min-h)] rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)]" />
      ))}
    </div>
  );
}
