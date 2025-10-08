import React, { useState } from 'react';
import { Plus, ChevronRight, ChevronDown, Tag, Search } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';
import { ScrollArea } from '../../ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '../../ui/dialog';
import { PaneCaret, PaneFooter } from '../../dev/PaneCaret';
import { PaneColumn } from '../../layout/PaneColumn';
import { PaneHeader } from '../../layout/PaneHeader';
import { Folder, Label } from './types';

interface MailLeftPaneProps {
  folders: Folder[];
  labels: Label[];
  selectedFolder: string;
  onFolderSelect: (folderId: string) => void;
  onComposeClick: () => void;
  onHidePane: () => void;
  className?: string;
}

export function MailLeftPane({
  folders,
  labels,
  selectedFolder,
  onFolderSelect,
  onComposeClick,
  onHidePane,
  className
}: MailLeftPaneProps) {
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [labelsExpanded, setLabelsExpanded] = useState(true);
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);
  const [labelSearch, setLabelSearch] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [labelList, setLabelList] = useState<Label[]>(labels);

  React.useEffect(() => {
    setLabelList(prev => {
      const incoming = new Map(labels.map(label => [label.id, label]));
      const custom = prev.filter(label => !incoming.has(label.id));
      return [...labels, ...custom];
    });
  }, [labels]);

  const handleLabelToggle = (labelId: string, checked?: boolean) => {
    setSelectedLabelIds(prev => {
      const isChecked = prev.includes(labelId);
      const nextState = checked ?? !isChecked;
      if (nextState) {
        if (isChecked) return prev;
        return [...prev, labelId];
      }
      return prev.filter(id => id !== labelId);
    });
  };

  const normalizedQuery = labelSearch.trim().toLowerCase();
  const filteredLabels = normalizedQuery
    ? labelList.filter(label => label.name.toLowerCase().includes(normalizedQuery))
    : labelList;

  const createLabelCandidate = labelSearch.trim();
  const hasExistingLabel = labelList.some(label => label.name.toLowerCase() === normalizedQuery);
  const canCreateLabel = Boolean(normalizedQuery && !hasExistingLabel);

  const handleCreateLabel = () => {
    if (!canCreateLabel) return;
    const baseId = createLabelCandidate.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `label-${Date.now()}`;
    let candidateId = baseId;
    let suffix = 1;
    while (labelList.some(label => label.id === candidateId)) {
      candidateId = `${baseId}-${suffix++}`;
    }

    const newLabel: Label = {
      id: candidateId,
      name: createLabelCandidate,
      color: 'var(--primary)'
    };

    setLabelList(prev => [...prev, newLabel]);
    handleLabelToggle(candidateId, true);
    setLabelsExpanded(true);
    setLabelSearch('');
  };

  const closeLabelManager = () => {
    setLabelManagerOpen(false);
    setLabelSearch('');
  };
  
  return (
    <PaneColumn className={`h-full ${className || ''}`} showRightDivider>
      <PaneHeader role="presentation">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Mail</h2>
      </PaneHeader>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="flex flex-col items-center space-y-[var(--space-6)]">
          {/* Compose Button */}
          <Button
            variant="solid"
            className="justify-start gap-[var(--space-2)] px-[var(--space-3)]"
            onClick={onComposeClick}
          >
            <Plus className="w-4 h-4" />
            Compose
          </Button>

          {/* Folders - Subtle Header with Inline Chevron */}
          <div className="w-full">
            <button 
              onClick={() => setFoldersExpanded(!foldersExpanded)}
              className="w-full flex items-center justify-between group hover:bg-[var(--primary-tint-5)] rounded-[var(--radius-sm)] px-2 py-1 transition-all mb-[var(--space-3)]"
            >
              <h3 className="text-xs uppercase tracking-wide text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                Folders
              </h3>
              {foldersExpanded ? (
                <ChevronDown className="w-3 h-3 text-[#9CA3AF] group-hover:text-[var(--text-secondary)] transition-all" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[#9CA3AF] group-hover:text-[var(--text-secondary)] transition-all" />
              )}
            </button>
            {foldersExpanded && (
              <div className="space-y-1 transition-all duration-200">
                {folders.map((folder) => {
                  const Icon = folder.icon;
                  const isActive = selectedFolder === folder.id;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => onFolderSelect(folder.id)}
                      className={`w-full flex items-center justify-between px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-sm transition-all ${
                        isActive 
                          ? 'bg-[var(--primary-tint-10)] text-[var(--primary)]' 
                          : 'text-[var(--text-primary)] hover:bg-[var(--primary-tint-5)]'
                      }`}
                    >
                      <div className="flex items-center gap-[var(--space-3)]">
                        <Icon className="w-4 h-4" style={{ color: folder.color }} />
                        <span>{folder.name}</span>
                      </div>
                      {folder.count > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs px-2 py-0 bg-[var(--primary-tint-15)] text-[var(--primary)]"
                        >
                          {folder.count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Labels - Subtle Header with Inline Chevron */}
          <div className="w-full">
            <div className="w-full flex items-center justify-between rounded-[var(--radius-sm)] px-2 py-1 mb-[var(--space-3)]">
              <button
                type="button"
                onClick={() => setLabelsExpanded(!labelsExpanded)}
                className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <span>Labels</span>
                <span className="inline-flex items-center justify-center text-[var(--text-tertiary)]">
                  {labelsExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-[var(--text-secondary)] hover:text-[var(--primary)]"
                onClick={(event) => {
                  event.stopPropagation();
                  setLabelManagerOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                <span className="sr-only">Manage labels</span>
              </Button>
            </div>
            {labelsExpanded && (
              <div className="space-y-1 transition-all duration-200">
                {labelList.map((label) => (
                  <button
                    key={label.id}
                    className="w-full flex items-center gap-[var(--space-3)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-sm text-[var(--text-primary)] hover:bg-[var(--primary-tint-5)] transition-all"
                  >
                    <div 
                      className="rounded-full" 
                      style={{ backgroundColor: label.color, width: 'var(--space-3)', height: 'var(--space-3)' }}
                    />
                    <span>{label.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <PaneFooter>
        <PaneCaret
          side="right"
          label="Hide mail sidebar"
          ariaKeyshortcuts="["
          onClick={onHidePane}
          variant="button"
        />
      </PaneFooter>

      <Dialog
        open={labelManagerOpen}
        onOpenChange={(open) => {
          setLabelManagerOpen(open);
          if (!open) {
            setLabelSearch('');
          }
        }}
      >
        <DialogContent className="max-w-lg p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-[var(--space-3)] text-[var(--text-primary)]">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-tint-10)] text-[var(--primary)]">
                  <Tag className="w-5 h-5" />
                </span>
                <DialogTitle className="text-base font-semibold text-[var(--text-primary)]">
                  Labels
                </DialogTitle>
              </div>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-[var(--space-4)]">
            <div className="flex items-center gap-[var(--space-3)]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <Input
                  autoFocus
                  value={labelSearch}
                  onChange={(event) => setLabelSearch(event.target.value)}
                  placeholder="Search or create label..."
                  className="pl-9 border-[var(--border-subtle)] focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/25"
                />
              </div>
              <span
                aria-live="polite"
                className="text-xs text-[var(--text-tertiary)] whitespace-nowrap"
              >
                ({selectedLabelIds.length})
              </span>
            </div>

            {canCreateLabel && (
              <button
                type="button"
                onClick={handleCreateLabel}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--primary-tint-20)] bg-[var(--primary-tint-5)] px-[var(--space-3)] py-[var(--space-2)] text-left text-sm text-[var(--primary)] hover:bg-[var(--primary-tint-10)] transition-colors"
              >
                <div className="flex items-center gap-[var(--space-2)]">
                  <Plus className="w-4 h-4" />
                  <span>Create “{createLabelCandidate}”</span>
                </div>
              </button>
            )}

            <ScrollArea className="max-h-64 border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
              <div className="py-[var(--space-2)]">
                {filteredLabels.length ? (
                  filteredLabels.map((label) => {
                    const isSelected = selectedLabelIds.includes(label.id);
                    return (
                      <label
                        key={label.id}
                        className="flex items-center justify-between px-[var(--space-3)] py-[var(--space-2)] text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                      >
                        <div className="flex items-center gap-[var(--space-3)]">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleLabelToggle(label.id, checked === true)}
                          />
                          <div>
                            <div className="font-medium">{label.name}</div>
                            <div className="text-xs text-[var(--text-tertiary)]">0 messages</div>
                          </div>
                        </div>
                        <span
                          className="rounded-full"
                          style={{ backgroundColor: label.color, width: 'var(--space-3)', height: 'var(--space-3)' }}
                        />
                      </label>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-6)] text-center">
                    <Tag className="w-5 h-5 text-[var(--text-tertiary)]" />
                    <span className="text-sm text-[var(--text-tertiary)]">No labels found</span>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-[var(--space-4)] pt-[var(--space-2)]">
              <Button
                type="button"
                variant="ghost"
                onClick={closeLabelManager}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="solid"
                onClick={closeLabelManager}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PaneColumn>
  );
}