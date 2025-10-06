import React from 'react';
import { FileText, Calendar, Tag, CheckSquare, FilePenLine, CalendarPlus } from 'lucide-react';
import { Button } from '../../ui/button';
import { TriPaneHeader, TriPaneContent } from '../../TriPane';
import { PaneCaret, PaneFooter } from '../../dev/PaneCaret';
import { QuickTaskModal } from '../../extended/QuickTaskModal';
import { QuickNoteModal } from '../../extended/QuickNoteModal';
import { QuickEventModal } from '../../extended/QuickEventModal';
import { AddLabelModal } from '../../extended/AddLabelModal';

interface MailRightPaneProps {
  onHidePane: () => void;
}

type WhichModal = null | "task" | "note" | "event" | "label";

export function MailRightPane({ onHidePane }: MailRightPaneProps) {
  const [whichModal, setWhichModal] = React.useState<WhichModal>(null);
  
  // Get portal container
  const portalContainer =
    typeof document !== "undefined" ? document.getElementById("mail-viewport") : null;
  
  // Get today's date for defaults
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed */}
      <TriPaneHeader>
        <div className="flex items-center space-x-6">
          <button className="text-sm font-medium text-[var(--primary)] border-b-2 border-[var(--primary)] pb-2">
            Context
          </button>
          <button className="text-sm text-[var(--text-secondary)] pb-2">
            Settings
          </button>
        </div>
      </TriPaneHeader>

      {/* Content - Scrollable */}
      <TriPaneContent className="flex-1 overflow-y-auto">
        <div className="space-y-[var(--space-6)]">
          <div>
            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-[var(--space-4)]">
              Quick actions
            </h4>
            <div className="grid grid-cols-2 gap-[var(--space-3)]">
              <Button 
                variant="outline"
                onClick={() => setWhichModal("task")}
                className="h-[56px] justify-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] hover:shadow-[var(--elevation-sm)]"
                title="Create task (T)"
                aria-keyshortcuts="KeyT"
              >
                <span className="grid size-6 place-items-center rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)]">
                  <CheckSquare className="size-4" aria-hidden="true" />
                </span>
                <span className="text-[var(--text-base)]">Create task</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setWhichModal("note")}
                className="h-[56px] justify-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] hover:shadow-[var(--elevation-sm)]"
                title="Take note (N)"
                aria-keyshortcuts="KeyN"
              >
                <span className="grid size-6 place-items-center rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)]">
                  <FilePenLine className="size-4" aria-hidden="true" />
                </span>
                <span className="text-[var(--text-base)]">Take note</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setWhichModal("event")}
                className="h-[56px] justify-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] hover:shadow-[var(--elevation-sm)]"
                title="Schedule (E)"
                aria-keyshortcuts="KeyE"
              >
                <span className="grid size-6 place-items-center rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)]">
                  <CalendarPlus className="size-4" aria-hidden="true" />
                </span>
                <span className="text-[var(--text-base)]">Schedule</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setWhichModal("label")}
                className="h-[56px] justify-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] hover:shadow-[var(--elevation-sm)]"
                title="Add tag (L)"
                aria-keyshortkeys="KeyL"
              >
                <span className="grid size-6 place-items-center rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)]">
                  <Tag className="size-4" aria-hidden="true" />
                </span>
                <span className="text-[var(--text-base)]">Add tag</span>
              </Button>
            </div>
          </div>
          
          <div className="text-center py-[var(--space-8)]">
            <FileText className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
              No related items
            </h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Select a note to see related tasks, notes, and<br />attachments
            </p>
          </div>
        </div>
      </TriPaneContent>

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