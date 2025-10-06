import React from 'react';
import { FileText, Tag, CheckSquare, FilePenLine, CalendarPlus } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../ui/utils';
import { TriPaneHeader, TriPaneContent } from '../../TriPane';
import { PaneCaret, PaneFooter } from '../../dev/PaneCaret';
import { QuickTaskModal } from '../../extended/QuickTaskModal';
import { QuickNoteModal } from '../../extended/QuickNoteModal';
import { QuickEventModal } from '../../extended/QuickEventModal';
import { AddLabelModal } from '../../extended/AddLabelModal';
import RightContextSettings, {
  DEFAULT_MAIL_SETTINGS,
  MailSettings,
  RECOMMENDED_MAIL_SETTINGS
} from './RightContextSettings';

interface MailRightPaneProps {
  onHidePane: () => void;
}

type WhichModal = null | "task" | "note" | "event" | "label";

export function MailRightPane({ onHidePane }: MailRightPaneProps) {
  const [activeTab, setActiveTab] = React.useState<'context' | 'settings'>('context');
  const [settings, setSettings] = React.useState<MailSettings>(DEFAULT_MAIL_SETTINGS);
  const [whichModal, setWhichModal] = React.useState<WhichModal>(null);
  
  // Get portal container
  const portalContainer =
    typeof document !== "undefined" ? document.getElementById("mail-viewport") : null;
  
  // Get today's date for defaults
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="h-full flex flex-col">
      <TriPaneHeader className="gap-[var(--space-6)] px-[var(--panel-pad-x)] py-[var(--panel-pad-y)]">
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
      </TriPaneHeader>

      {activeTab === 'context' ? (
        <TriPaneContent className="flex-1 overflow-y-auto">
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
                No related items
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Select a note to see related items
              </p>
            </div>
          </div>
        </TriPaneContent>
      ) : (
        <TriPaneContent className="flex-1 overflow-y-auto" padding={false}>
          <RightContextSettings
            value={settings}
            onChange={setSettings}
            onResetDefaults={() => setSettings({ ...DEFAULT_MAIL_SETTINGS })}
            onRestoreRecommended={() => setSettings({ ...RECOMMENDED_MAIL_SETTINGS })}
            className="pb-[var(--space-8)]"
          />
        </TriPaneContent>
      )}

      {/* Footer - Fixed with Caret */}
      <PaneFooter>
        <PaneCaret
          direction="right"
          onClick={onHidePane}
          tooltipText="Hide context"
          shortcut="\\"
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
          // TODO: dispatch createTask action
        }}
      />
      
      <QuickNoteModal
        open={whichModal === "note"}
        onOpenChange={(v) => !v && setWhichModal(null)}
        portalContainer={portalContainer}
        onCreate={(payload) => {
          console.log("Create note:", payload);
          // TODO: dispatch createNote action
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
          // TODO: dispatch createEvent action
        }}
      />
      
      <AddLabelModal
        open={whichModal === "label"}
        onOpenChange={(v) => !v && setWhichModal(null)}
        portalContainer={portalContainer}
        onAdd={(name) => {
          console.log("Add label:", name);
          // TODO: dispatch addLabel action
        }}
      />
    </div>
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