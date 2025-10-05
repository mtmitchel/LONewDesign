import React from 'react';
import { TriPaneHeader, TriPaneContent } from '../../TriPane';
import { MailSearch } from './MailSearch';
import { BulkActionsBar } from './BulkActionsBar';
import { EmailListItem } from './EmailListItem';
import { Email, Label, SearchFilters } from './types';

interface MailCenterPaneProps {
  // Search props
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showAdvancedSearch: boolean;
  onAdvancedSearchToggle: (show: boolean) => void;
  searchFilters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  
  // Email list props
  emails: Email[];
  labels: Label[];
  selectedEmail: number | null;
  selectedEmails: number[];
  onEmailSelect: (emailId: number, event: React.MouseEvent) => void;
  onEmailDoubleClick: (emailId: number, event: React.MouseEvent) => void;
  onCheckboxToggle: (emailId: number, event: React.MouseEvent) => void;
  onBulkArchive: () => void;
  onBulkDelete: () => void;
  onBulkLabel: () => void;
  onBulkClear: () => void;
}

export function MailCenterPane({
  searchQuery,
  onSearchChange,
  showAdvancedSearch,
  onAdvancedSearchToggle,
  searchFilters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  emails,
  labels,
  selectedEmail,
  selectedEmails,
  onEmailSelect,
  onEmailDoubleClick,
  onCheckboxToggle,
  onBulkArchive,
  onBulkDelete,
  onBulkLabel,
  onBulkClear
}: MailCenterPaneProps) {
  return (
    <div id="mail-viewport-root" className="relative isolate h-full"  >
      <TriPaneHeader>
        <div className="flex items-center gap-[var(--space-3)] flex-1">        
          {/* Centered search field */}
          <div className="flex-1 flex justify-center">
            <MailSearch
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              showAdvancedSearch={showAdvancedSearch}
              onAdvancedSearchToggle={onAdvancedSearchToggle}
              searchFilters={searchFilters}
              onFiltersChange={onFiltersChange}
              onApplyFilters={onApplyFilters}
              onClearFilters={onClearFilters}
            />
          </div>
        </div>
      </TriPaneHeader>

      {/* Email List View - Full height white background */}
      <TriPaneContent padding={false} className="bg-[var(--bg-surface)] h-full">
        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={selectedEmails.length}
          onArchive={onBulkArchive}
          onDelete={onBulkDelete}
          onLabel={onBulkLabel}
          onClear={onBulkClear}
        />

        {/* Email List with White Surface and Light Dividers */}
        <div className="bg-[var(--bg-surface)] divide-y divide-[var(--border-divider)]">
          {emails.map((email) => (
            <EmailListItem
              key={email.id}
              email={email}
              labels={labels}
              isSelected={selectedEmail === email.id}
              isChecked={selectedEmails.includes(email.id)}
              onClick={(e) => onEmailSelect(email.id, e)}
              onDoubleClick={(e) => onEmailDoubleClick(email.id, e)}
              onCheckboxToggle={(e) => onCheckboxToggle(email.id, e)}
              onOpenEmail={() => onEmailSelect(email.id, {} as React.MouseEvent)}
            />
          ))}

          {emails.length === 0 && (
            <div className="p-[var(--space-8)] text-center text-[var(--text-secondary)]">
              {searchQuery ? 'No emails found matching your search.' : 'No emails in this folder.'}
            </div>
          )}
        </div>
      </TriPaneContent>
    </div>
  );
}