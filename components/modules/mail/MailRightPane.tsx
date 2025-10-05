import React from 'react';
import { FileText, Calendar, Tag, CheckSquare } from 'lucide-react';
import { Button } from '../../ui/button';
import { TriPaneHeader, TriPaneContent } from '../../TriPane';
import { PaneCaret, PaneFooter } from '../../PaneCaret';

interface MailRightPaneProps {
  onHidePane: () => void;
}

export function MailRightPane({ onHidePane }: MailRightPaneProps) {
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
                variant="ghost" 
                className="h-20 flex flex-col items-center justify-center gap-2 bg-[var(--bg-surface)] hover:bg-[var(--primary-tint-5)] border border-[var(--border-default)]"
              >
                <CheckSquare className="w-5 h-5 text-[var(--primary)]" />
                <span className="text-xs">Create task</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="h-20 flex flex-col items-center justify-center gap-2 bg-[var(--bg-surface)] hover:bg-[var(--primary-tint-5)] border border-[var(--border-default)]"
              >
                <FileText className="w-5 h-5 text-[var(--primary)]" />
                <span className="text-xs">Take note</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="h-20 flex flex-col items-center justify-center gap-2 bg-[var(--bg-surface)] hover:bg-[var(--primary-tint-5)] border border-[var(--border-default)]"
              >
                <Calendar className="w-5 h-5 text-[var(--primary)]" />
                <span className="text-xs">Schedule</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="h-20 flex flex-col items-center justify-center gap-2 bg-[var(--bg-surface)] hover:bg-[var(--primary-tint-5)] border border-[var(--border-default)]"
              >
                <Tag className="w-5 h-5 text-[var(--primary)]" />
                <span className="text-xs">Add tag</span>
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
    </div>
  );
}