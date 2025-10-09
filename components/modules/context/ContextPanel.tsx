"use client";

import * as React from "react";
import { PaneColumn } from "../../layout/PaneColumn";
import { PaneHeader } from "../../layout/PaneHeader";
import { PaneCaret, PaneFooter } from "../../dev/PaneCaret";
import { cn } from "../../ui/utils";

export type ContextPanelTab = {
  id: string;
  label: string;
};

export type ContextPanelSlot =
  | React.ReactNode
  | {
      content: React.ReactNode;
      padding?: "default" | "none";
      scrollable?: boolean;
      className?: string;
    };

export interface ContextPanelProps {
  tabs?: ContextPanelTab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  panels: Record<string, ContextPanelSlot>;
  className?: string;
  showLeftDivider?: boolean;
  showRightDivider?: boolean;
  headerClassName?: string;
  bodyClassName?: string;
  onCollapse?: () => void;
  collapseLabel?: string;
  collapseShortcut?: string;
  collapseSide?: "left" | "right";
  collapseVariant?: "rail" | "button";
  footer?: React.ReactNode;
}

const DEFAULT_TABS: ContextPanelTab[] = [
  { id: "context", label: "Context" },
  { id: "settings", label: "Settings" },
];

export function ContextPanel({
  tabs = DEFAULT_TABS,
  defaultTab,
  activeTab: controlledActiveTab,
  onTabChange,
  panels,
  className,
  showLeftDivider = true,
  showRightDivider = false,
  headerClassName,
  bodyClassName,
  onCollapse,
  collapseLabel = "Hide context",
  collapseShortcut = "\\",
  collapseSide = "right",
  collapseVariant = "rail",
  footer,
}: ContextPanelProps) {
  const actualDefaultTab = React.useMemo(() => {
    if (defaultTab && tabs.some((tab) => tab.id === defaultTab)) return defaultTab;
    if (tabs.length > 0) return tabs[0].id;
    if (Object.keys(panels).length > 0) return Object.keys(panels)[0];
    return "context";
  }, [defaultTab, tabs, panels]);

  const [uncontrolledActiveTab, setUncontrolledActiveTab] = React.useState(actualDefaultTab);

  React.useEffect(() => {
    setUncontrolledActiveTab((prev) => {
      if (tabs.some((tab) => tab.id === prev)) return prev;
      return actualDefaultTab;
    });
  }, [actualDefaultTab, tabs]);

  const activeTab = controlledActiveTab ?? uncontrolledActiveTab;

  const setActiveTab = React.useCallback(
    (next: string) => {
      if (!tabs.some((tab) => tab.id === next)) {
        return;
      }
      if (controlledActiveTab === undefined) {
        setUncontrolledActiveTab(next);
      }
      onTabChange?.(next);
    },
    [controlledActiveTab, onTabChange, tabs]
  );

  const slot = panels[activeTab];
  const { content, padding, scrollable, className: slotClassName } = normalizeSlot(slot);

  const bodyClasses = cn(
    "flex-1 min-h-0",
    scrollable !== false && "overflow-y-auto",
    padding !== "none" && "px-[var(--panel-pad-x)] py-[var(--panel-pad-y)]",
    bodyClassName,
    slotClassName
  );

  const hasTabs = tabs.length > 1;

  return (
    <PaneColumn
      className={cn("h-full", className)}
      showLeftDivider={showLeftDivider}
      showRightDivider={showRightDivider}
    >
      {hasTabs ? (
        <PaneHeader
          role="tablist"
          className={cn("gap-[var(--space-6)] px-[var(--panel-pad-x)]", headerClassName)}
        >
          {tabs.map((tab) => (
            <ContextPanelTabButton
              key={tab.id}
              label={tab.label}
              active={tab.id === activeTab}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </PaneHeader>
      ) : null}

      <div className={bodyClasses}>{content}</div>

      {footer
        ? footer
        : onCollapse
        ? (
            <PaneFooter>
              <PaneCaret
                side={collapseSide}
                label={collapseLabel}
                ariaKeyshortcuts={collapseShortcut}
                onClick={onCollapse}
                variant={collapseVariant}
              />
            </PaneFooter>
          )
        : null}
    </PaneColumn>
  );
}

function ContextPanelTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative pb-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]",
        active
          ? "text-[color:var(--text-primary)]"
          : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
      )}
    >
      {label}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-0 right-0 -bottom-1 h-0.5 rounded-full transition-opacity",
          active ? "bg-[var(--primary)] opacity-100" : "bg-transparent opacity-0"
        )}
      />
    </button>
  );
}

function normalizeSlot(slot: ContextPanelSlot | undefined) {
  if (!slot || !isSlotObject(slot)) {
    return {
      content: slot ?? null,
      padding: "default" as const,
      scrollable: true,
      className: undefined,
    };
  }

  return {
    content: slot.content,
    padding: slot.padding ?? "default",
    scrollable: slot.scrollable ?? true,
    className: slot.className,
  };
}

function isSlotObject(slot: ContextPanelSlot): slot is Exclude<ContextPanelSlot, React.ReactNode> {
  return typeof slot === "object" && slot !== null && "content" in slot;
}

export interface ContextSectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  titleAs?: keyof JSX.IntrinsicElements;
}

export function ContextSection({
  title,
  children,
  icon,
  description,
  actions,
  className,
  titleAs: TitleTag = "h4",
}: ContextSectionProps) {
  return (
    <section className={cn("space-y-[var(--space-3)]", className)}>
      <header className="flex items-start justify-between gap-[var(--space-3)]">
        <div className="flex items-center gap-[var(--space-2)]">
          {icon ? (
            <span className="grid size-6 place-items-center rounded-[var(--radius-md)] bg-[color-mix(in_oklab,_var(--bg-surface)_92%,_transparent)] text-[color:var(--text-secondary)]">
              {icon}
            </span>
          ) : null}
          <div className="space-y-[var(--space-1)]">
            <TitleTag className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
              {title}
            </TitleTag>
            {description ? (
              <p className="text-[length:var(--text-xs)] text-[color:var(--text-secondary)]">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-[var(--space-2)]">{actions}</div> : null}
      </header>
      <div className="space-y-[var(--space-2)]">{children}</div>
    </section>
  );
}

export interface ContextQuickAction {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  hint?: string;
  onSelect?: (id: string) => void;
}

export function ContextQuickActions({
  actions,
  onSelect,
  className,
}: {
  actions: ContextQuickAction[];
  onSelect?: (id: string) => void;
  className?: string;
}) {
  if (!actions.length) return null;

  return (
    <div className={cn("grid gap-[var(--space-2)]", className)}>
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => {
            if (action.onSelect) {
              action.onSelect(action.id);
            } else {
              onSelect?.(action.id);
            }
          }}
          className="group flex w-full items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[var(--space-3)] py-[var(--space-3)] text-left transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--border-default)] hover:bg-[var(--bg-surface-elevated)] hover:shadow-[var(--elevation-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
        >
          {action.icon ? (
            <span className="grid size-8 place-items-center rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)] text-[color:var(--primary)] opacity-80 group-hover:opacity-100">
              {action.icon}
            </span>
          ) : null}
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
              {action.label}
            </span>
            {action.description ? (
              <span className="truncate text-[length:var(--text-xs)] text-[color:var(--text-secondary)]">
                {action.description}
              </span>
            ) : null}
          </div>
          {action.hint ? (
            <span className="ml-auto text-[length:var(--text-xs)] font-medium text-[color:var(--primary)] opacity-0 transition-opacity duration-[var(--duration-fast)] ease-[var(--easing-standard)] group-hover:opacity-100">
              {action.hint}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export interface ContextListItemProps {
  title: string;
  description?: string;
  meta?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  actionLabel?: string;
  className?: string;
}

export function ContextListItem({
  title,
  description,
  meta,
  icon,
  onClick,
  actionLabel,
  className,
}: ContextListItemProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[var(--space-3)] py-[var(--space-3)] text-left transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
        onClick &&
          "hover:bg-[var(--bg-surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]",
        className
      )}
    >
      {icon ? (
        <span className="grid size-8 place-items-center rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)] text-[color:var(--primary)]">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
          {title}
        </div>
        {description ? (
          <div className="mt-[var(--space-1)] truncate text-[length:var(--text-xs)] text-[color:var(--text-secondary)]">
            {description}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-[var(--space-2)]">
        {meta ? (
          <span className="text-[length:var(--text-xs)] text-[color:var(--text-secondary)]">{meta}</span>
        ) : null}
        {actionLabel ? (
          <span className="text-[length:var(--text-xs)] font-medium text-[color:var(--primary)] opacity-0 transition-opacity duration-[var(--duration-fast)] ease-[var(--easing-standard)] group-hover:opacity-100">
            {actionLabel}
          </span>
        ) : null}
      </div>
    </Component>
  );
}
