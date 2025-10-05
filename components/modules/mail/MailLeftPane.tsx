import React, { useState } from 'react';
import { Plus, Settings, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { TriPaneHeader, TriPaneContent } from '../../TriPane';
import { PaneCaret, PaneFooter } from '../../PaneCaret';
import { Folder, Label } from './types';

interface MailLeftPaneProps {
  folders: Folder[];
  labels: Label[];
  selectedFolder: string;
  onFolderSelect: (folderId: string) => void;
  onComposeClick: () => void;
  onHidePane: () => void;
}

export function MailLeftPane({
  folders,
  labels,
  selectedFolder,
  onFolderSelect,
  onComposeClick,
  onHidePane
}: MailLeftPaneProps) {
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [labelsExpanded, setLabelsExpanded] = useState(true);
  
  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed */}
      <TriPaneHeader>
        <h2 className="font-semibold text-[var(--text-primary)]">Mail</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </TriPaneHeader>

      {/* Content - Scrollable */}
      <TriPaneContent className="flex-1 overflow-y-auto">
        <div className="space-y-[var(--space-6)]">
          {/* Compose Button */}
          <Button 
            variant="solid" 
            className="w-full justify-start"
            onClick={onComposeClick}
          >
            <Plus className="w-4 h-4" />
            Compose
          </Button>

          {/* Folders - Subtle Header with Inline Chevron */}
          <div>
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
          <div>
            <button 
              onClick={() => setLabelsExpanded(!labelsExpanded)}
              className="w-full flex items-center justify-between group hover:bg-[var(--primary-tint-5)] rounded-[var(--radius-sm)] px-2 py-1 transition-all mb-[var(--space-3)]"
            >
              <h3 className="text-xs uppercase tracking-wide text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                Labels
              </h3>
              {labelsExpanded ? (
                <ChevronDown className="w-3 h-3 text-[#9CA3AF] group-hover:text-[var(--text-secondary)] transition-all" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[#9CA3AF] group-hover:text-[var(--text-secondary)] transition-all" />
              )}
            </button>
            {labelsExpanded && (
              <div className="space-y-1 transition-all duration-200">
                {labels.map((label) => (
                  <button
                    key={label.id}
                    className="w-full flex items-center gap-[var(--space-3)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-sm text-[var(--text-primary)] hover:bg-[var(--primary-tint-5)] transition-all"
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: label.color }}
                    />
                    <span>{label.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </TriPaneContent>

      {/* Footer - Fixed with Caret */}
      <PaneFooter>
        <PaneCaret
          direction="left"
          onClick={onHidePane}
          tooltipText="Hide mail sidebar"
          shortcut="["
        />
      </PaneFooter>
    </div>
  );
}