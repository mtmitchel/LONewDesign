import React from 'react';
import { TriPaneHeader, TriPaneContent } from '../../TriPane';
import { MailSearch } from './MailSearch';
import { BulkActionToolbar } from './BulkActionToolbar';
import { EmailListItem } from './EmailListItem';
import { MailListFooter } from './MailListFooter';
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
  onSelectAll: () => void;
  onSelectNone: () => void;
  onSelectRead: () => void;
  onSelectUnread: () => void;
  onSelectStarred: () => void;
  onSelectUnstarred: () => void;
  onRefresh?: () => void;
  onMarkRead?: () => void;
  onMarkUnread?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
  onSnooze?: () => void;
  onStar?: () => void;
  totalCount: number;
  rangeStart: number;
  rangeEnd: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  currentPage: number;
  totalPages: number;
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
  onSelectAll,
  onSelectNone,
  onSelectRead,
  onSelectUnread,
  onSelectStarred,
  onSelectUnstarred,
  onRefresh,
  onMarkRead,
  onMarkUnread,
  onArchive,
  onDelete,
  onMove,
  onSnooze,
  onStar,
  totalCount,
  rangeStart,
  rangeEnd,
  hasPreviousPage,
  hasNextPage,
  onPreviousPage,
  onNextPage,
  currentPage,
  totalPages
}: MailCenterPaneProps) {
  return (
    <div id="mail-viewport" className="relative isolate flex h-full flex-col">
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
      <TriPaneContent padding={false} className="flex-1 bg-[var(--bg-surface)] h-full">
        <div className="flex h-full flex-col">
          <BulkActionToolbar
            selectedCount={selectedEmails.length}
            totalCount={totalCount}
            currentStart={rangeStart}
            currentEnd={rangeEnd}
            onSelectAll={onSelectAll}
            onSelectNone={onSelectNone}
            onSelectRead={onSelectRead}
            onSelectUnread={onSelectUnread}
            onSelectStarred={onSelectStarred}
            onSelectUnstarred={onSelectUnstarred}
            onPrevious={onPreviousPage}
            onNext={onNextPage}
            hasPrevious={hasPreviousPage}
            hasNext={hasNextPage}
            onRefresh={onRefresh}
            onMarkRead={onMarkRead}
            onMarkUnread={onMarkUnread}
            onArchive={onArchive}
            onDelete={onDelete}
            onMove={onMove}
            onSnooze={onSnooze}
            onStar={onStar}
          />

          <div className="flex-1 min-h-0 overflow-y-auto border-t border-[var(--border-default)]">
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

          <MailListFooter
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            onPreviousPage={onPreviousPage}
            onNextPage={onNextPage}
          />
        </div>
      </TriPaneContent>
    </div>
  );
}