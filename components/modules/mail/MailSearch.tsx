import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { SearchFilters } from './types';

interface MailSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showAdvancedSearch: boolean;
  onAdvancedSearchToggle: (show: boolean) => void;
  searchFilters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

export function MailSearch({
  searchQuery,
  onSearchChange,
  showAdvancedSearch,
  onAdvancedSearchToggle,
  searchFilters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters
}: MailSearchProps) {
  const handleSearch = () => {
    onApplyFilters();
    onAdvancedSearchToggle(false);
  };

  return (
    <div className="relative max-w-md w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
      <Input
        placeholder="Search mail"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 pr-10 bg-[var(--bg-surface)] border-[var(--border-default)]"
      />
      <Popover open={showAdvancedSearch} onOpenChange={onAdvancedSearchToggle}>
        <PopoverTrigger asChild>
          <button 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[480px] p-0" align="end">
          <div className="p-[var(--space-6)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-[var(--space-5)]">
              <h3 className="text-[var(--text-lg)] font-[var(--font-weight-semibold)] text-[var(--text-primary)]">
                Advanced search
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0"
                onClick={() => onAdvancedSearchToggle(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Form Fields */}
            <div className="space-y-[var(--space-4)]">
              <div>
                <label className="block text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)] mb-2">
                  From
                </label>
                <Input
                  placeholder="sender@example.com"
                  value={searchFilters.from}
                  onChange={(e) => onFiltersChange({ ...searchFilters, from: e.target.value })}
                  className="h-10 px-[var(--space-3)] text-[var(--text-base)] border-[var(--border-default)] rounded-[var(--radius-sm)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)] mb-2">
                  To
                </label>
                <Input
                  placeholder="recipient@example.com"
                  value={searchFilters.to}
                  onChange={(e) => onFiltersChange({ ...searchFilters, to: e.target.value })}
                  className="h-10 px-[var(--space-3)] text-[var(--text-base)] border-[var(--border-default)] rounded-[var(--radius-sm)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)] mb-2">
                  Subject
                </label>
                <Input
                  placeholder="Enter subject"
                  value={searchFilters.subject}
                  onChange={(e) => onFiltersChange({ ...searchFilters, subject: e.target.value })}
                  className="h-10 px-[var(--space-3)] text-[var(--text-base)] border-[var(--border-default)] rounded-[var(--radius-sm)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)] mb-2">
                  Has the words
                </label>
                <Input
                  placeholder="Enter words to search for"
                  value={searchFilters.hasWords}
                  onChange={(e) => onFiltersChange({ ...searchFilters, hasWords: e.target.value })}
                  className="h-10 px-[var(--space-3)] text-[var(--text-base)] border-[var(--border-default)] rounded-[var(--radius-sm)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)] mb-2">
                  Date within
                </label>
                <Select
                  value={searchFilters.dateRange}
                  onValueChange={(value) => onFiltersChange({ ...searchFilters, dateRange: value })}
                >
                  <SelectTrigger className="h-10 px-[var(--space-3)] text-[var(--text-base)] border-[var(--border-default)] rounded-[var(--radius-sm)]">
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Past week</SelectItem>
                    <SelectItem value="month">Past month</SelectItem>
                    <SelectItem value="year">Past year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)] mb-2">
                  Search in
                </label>
                <Select
                  value={searchFilters.folder}
                  onValueChange={(value) => onFiltersChange({ ...searchFilters, folder: value })}
                >
                  <SelectTrigger className="h-10 px-[var(--space-3)] text-[var(--text-base)] border-[var(--border-default)] rounded-[var(--radius-sm)]">
                    <SelectValue placeholder="All Mail" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Mail</SelectItem>
                    <SelectItem value="inbox">Inbox</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="drafts">Drafts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-[var(--space-2)] pt-1">
                <Checkbox
                  id="hasAttachment"
                  checked={searchFilters.hasAttachment}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ ...searchFilters, hasAttachment: !!checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="hasAttachment" className="text-[var(--text-sm)] text-[var(--text-primary)] cursor-pointer">
                  Has attachment
                </label>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-[var(--space-2)] mt-[var(--space-5)]">
              <Button
                variant="ghost"
                onClick={onClearFilters}
                className="h-9"
              >
                Reset
              </Button>
              <Button
                variant="ghost"
                onClick={() => onAdvancedSearchToggle(false)}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                onClick={handleSearch}
                className="gap-2 h-9"
              >
                <Search className="w-4 h-4" />
                Search
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}