import React from 'react';
import { FileText, Tag, CheckSquare, FilePenLine, CalendarPlus } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../ui/utils';
import { PaneCaret, PaneFooter } from '../../dev/PaneCaret';
import { PaneColumn } from '../../layout/PaneColumn';
import { PaneHeader } from '../../layout/PaneHeader';
import { QuickTaskModal } from '../../extended/QuickTaskModal';
import { QuickNoteModal } from '../../extended/QuickNoteModal';
import { QuickEventModal } from '../../extended/QuickEventModal';
import { AddLabelModal } from '../../extended/AddLabelModal';

interface ChatRightPaneProps {
  onHidePane: () => void;
  className?: string;
  mode?: 'inline' | 'overlay';
  selectedModel?: string;
}

type WhichModal = null | "task" | "note" | "event" | "label";

export function ChatRightPane({ onHidePane, className, mode = 'inline', selectedModel = 'gpt-4' }: ChatRightPaneProps) {
  const [activeTab, setActiveTab] = React.useState<'context' | 'settings'>('context');
  const [whichModal, setWhichModal] = React.useState<WhichModal>(null);

  // Get portal container
  const portalContainer =
    typeof document !== "undefined" ? document.getElementById("chat-viewport") : null;

  // Get today's date for defaults
  const today = new Date().toISOString().slice(0, 10);

  return (
    <PaneColumn className={`h-full ${className || ''}`} showLeftDivider showRightDivider={false}>
      <PaneHeader role="tablist" className="gap-[var(--space-6)] px-[var(--panel-pad-x)]">
        <PaneTabButton
          label="Context"
          active={activeTab === 'context'}
          onClick={() => setActiveTab('context')}
        />
        <PaneTabButton
          label="Settings"
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        />
      </PaneHeader>

      {activeTab === 'context' ? (
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <div className="space-y-[var(--space-6)]">
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-[var(--space-4)]">
                Quick actions
              </h4>
              <div className="grid grid-cols-2 gap-[var(--space-4)]">
                <Button
                  variant="outline"
                  onClick={() => setWhichModal('task')}
                  className="h-[56px] justify-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] hover:shadow-[var(--elevation-sm)] motion-safe:transition-colors duration-[var(--duration-fast)]"
                  title="Create task (T)"
                  aria-keyshortcuts="KeyT"
                >
                  <span className="grid size-6 place-items-center rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)]">
                    <CheckSquare className="size-4 text-[var(--primary)] opacity-60" aria-hidden="true" />
                  </span>
                  <span className="text-[var(--text-base)]">Create task</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setWhichModal('note')}
                  className="h-[56px] justify-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] hover:shadow-[var(--elevation-sm)] motion-safe:transition-colors duration-[var(--duration-fast)]"
                  title="Take note (N)"
                  aria-keyshortcuts="KeyN"
                >
                  <span className="grid size-6 place-items-center rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)]">
                    <FilePenLine className="size-4 text-[var(--primary)] opacity-60" aria-hidden="true" />
                  </span>
                  <span className="text-[var(--text-base)]">Take note</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setWhichModal('event')}
                  className="h-[56px] justify-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] hover:shadow-[var(--elevation-sm)] motion-safe:transition-colors duration-[var(--duration-fast)]"
                  title="Schedule (E)"
                  aria-keyshortcuts="KeyE"
                >
                  <span className="grid size-6 place-items-center rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)]">
                    <CalendarPlus className="size-4 text-[var(--primary)] opacity-60" aria-hidden="true" />
                  </span>
                  <span className="text-[var(--text-base)]">Schedule</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setWhichModal('label')}
                  className="h-[56px] justify-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] hover:shadow-[var(--elevation-sm)] motion-safe:transition-colors duration-[var(--duration-fast)]"
                  title="Add tag (L)"
                  aria-keyshortcuts="KeyL"
                >
                  <span className="grid size-6 place-items-center rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)]">
                    <Tag className="size-4 text-[var(--primary)] opacity-60" aria-hidden="true" />
                  </span>
                  <span className="text-[var(--text-base)]">Add tag</span>
                </Button>
              </div>
            </div>

            <div className="text-center py-[var(--space-8)]">
              <FileText className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)] opacity-30" />
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                No active conversation
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Select a conversation to see context and actions
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <div className="space-y-[var(--space-6)]">
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-[var(--space-4)]">
                Settings for model
              </h4>
              <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-[var(--space-3)]">
                <div className="text-sm text-[var(--text-primary)] font-medium">
                  {selectedModel}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-[var(--space-4)]">
                System prompt
              </h4>
              <div className="space-y-[var(--space-2)]">
                <textarea
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[var(--space-3)] py-[var(--space-2)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] resize-none"
                  rows={6}
                  placeholder="Enter system prompt..."
                  defaultValue="You are a helpful assistant."
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-secondary)]">180/2000</span>
                  <Button variant="outline" size="sm">
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-[var(--space-4)]">
                Model behavior
              </h4>
              <div className="space-y-[var(--space-4)]">
                <div className="space-y-[var(--space-2)]">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-[var(--text-primary)]">Creativity</label>
                    <span className="text-sm text-[var(--text-primary)]">0.7</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    defaultValue="0.7"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                    <span>Precise</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div className="space-y-[var(--space-2)]">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-[var(--text-primary)]">Max response</label>
                    <span className="text-sm text-[var(--text-primary)]">tokens</span>
                  </div>
                  <input
                    type="number"
                    defaultValue="2000"
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[var(--space-3)] py-[var(--space-2)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-[var(--space-4)]">
                Actions
              </h4>
              <div className="space-y-[var(--space-2)]">
                <Button variant="outline" className="w-full justify-start">
                  Save as default for gemma3n:e4b
                </Button>
                <div className="grid grid-cols-2 gap-[var(--space-2)]">
                  <Button variant="outline" className="justify-center">
                    Reset session
                  </Button>
                  <Button variant="outline" className="justify-center">
                    Reset model defaults
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <PaneFooter>
        <PaneCaret
          side="right"
          label="Hide assistant info"
          ariaKeyshortcuts="\\"
          onClick={() => {
            console.debug('chat:pane:right:toggle', { visible: false, source: 'footer' });
            onHidePane();
          }}
        />
      </PaneFooter>

      {/* Quick Action Modals */}
      <QuickTaskModal
        open={whichModal === "task"}
        onOpenChange={(v) => !v && setWhichModal(null)}
        portalContainer={portalContainer}
        defaultDate={today}
        onCreate={(payload) => {
          console.log("Create task:", payload);
        }}
      />

      <QuickNoteModal
        open={whichModal === "note"}
        onOpenChange={(v) => !v && setWhichModal(null)}
        portalContainer={portalContainer}
        onCreate={(payload) => {
          console.log("Create note:", payload);
        }}
      />

      <QuickEventModal
        open={whichModal === "event"}
        onOpenChange={(v) => !v && setWhichModal(null)}
        portalContainer={portalContainer}
        defaultDate={today}
        defaultStart="09:00"
        defaultEnd="10:00"
        onCreate={(payload) => {
          console.log("Create event:", payload);
        }}
      />

      <AddLabelModal
        open={whichModal === "label"}
        onOpenChange={(v) => !v && setWhichModal(null)}
        portalContainer={portalContainer}
        onAdd={(name) => {
          console.log("Add label:", name);
        }}
      />
    </PaneColumn>
  );
}

function PaneTabButton({
  label,
  active,
  onClick
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
        'relative pb-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]',
        active
          ? 'text-[var(--text-primary)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      )}
    >
      {label}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-0 right-0 -bottom-1 h-0.5 rounded-full transition-opacity',
          active ? 'bg-[var(--primary)] opacity-100' : 'bg-transparent opacity-0'
        )}
      />
    </button>
  );
}