import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '../../ui/popover';
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

  const fieldClass = 'h-10 px-[var(--space-3)] text-[length:var(--text-base)] border-[var(--border-default)] rounded-[var(--radius-sm)] focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary-tint-10)] focus-visible:ring-offset-0 focus-visible:outline-none transition-colors duration-[var(--duration-fast)]';
  const selectTriggerClass = `${fieldClass} [&_svg]:text-[color:var(--text-secondary)] hover:[&_svg]:text-[color:var(--primary)] motion-safe:transition-colors duration-[var(--duration-fast)]`;

  return (
    <Popover open={showAdvancedSearch} onOpenChange={onAdvancedSearchToggle}>
      <PopoverAnchor asChild>
        <div className="relative w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search mail"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full pl-9 pr-10 bg-white border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] motion-safe:transition-colors duration-[var(--duration-fast)]"
          />
          <PopoverTrigger asChild>
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--text-primary)] hover:text-[color:var(--primary)] transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        className="p-0 border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--elevation-lg)]"
        style={{ width: 'min(var(--radix-popover-trigger-width), 560px)' }}
      >
          <div className="p-[var(--space-6)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-[var(--space-5)]">
              <h3 className="text-[length:var(--text-lg)] font-[var(--font-weight-semibold)] text-[color:var(--text-primary)]">
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
            <div className="space-y-[var(--space-3)]">
              <div className="flex flex-col gap-[var(--space-2)]">
                <label className="text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)]">
                  From
                </label>
                <Input
                  placeholder="sender@example.com"
                  value={searchFilters.from}
                  onChange={(e) => onFiltersChange({ ...searchFilters, from: e.target.value })}
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-[var(--space-2)]">
                <label className="text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)]">
                  To
                </label>
                <Input
                  placeholder="recipient@example.com"
                  value={searchFilters.to}
                  onChange={(e) => onFiltersChange({ ...searchFilters, to: e.target.value })}
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-[var(--space-2)]">
                <label className="text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)]">
                  Subject
                </label>
                <Input
                  placeholder="Search subject line"
                  value={searchFilters.subject}
                  onChange={(e) => onFiltersChange({ ...searchFilters, subject: e.target.value })}
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-[var(--space-2)]">
                <label className="text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)]">
                  Has the words
                </label>
                <Input
                  placeholder="Search message content"
                  value={searchFilters.hasWords}
                  onChange={(e) => onFiltersChange({ ...searchFilters, hasWords: e.target.value })}
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-[var(--space-2)]">
                <label className="text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)]">
                  Date within
                </label>
                <Select
                  value={searchFilters.dateRange}
                  onValueChange={(value) => onFiltersChange({ ...searchFilters, dateRange: value })}
                >
                  <SelectTrigger className={selectTriggerClass}>
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

              <div className="flex flex-col gap-[var(--space-2)]">
                <label className="text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)]">
                  Search in
                </label>
                <Select
                  value={searchFilters.folder}
                  onValueChange={(value) => onFiltersChange({ ...searchFilters, folder: value })}
                >
                  <SelectTrigger className={selectTriggerClass}>
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

              <div className="flex items-start gap-[var(--space-2)] pt-1">
                <Checkbox
                  id="hasAttachment"
                  checked={searchFilters.hasAttachment}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ ...searchFilters, hasAttachment: !!checked })
                  }
                  className="w-4 h-4"
                />
                <label
                  htmlFor="hasAttachment"
                  className="text-[length:var(--text-sm)] text-[color:var(--text-primary)] cursor-pointer leading-tight pt-[3px]"
                >
                  Has attachment
                </label>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-[var(--space-2)] mt-[var(--space-5)]">
              <Button
                variant="ghost"
                onClick={onClearFilters}
                className="h-9 px-[var(--space-3)] bg-transparent text-[color:var(--btn-ghost-text)] hover:bg-[var(--btn-ghost-hover)] hover:text-[color:var(--text-primary)] border border-[var(--btn-ghost-border)]"
              >
                Reset
              </Button>
              <Button
                variant="ghost"
                onClick={() => onAdvancedSearchToggle(false)}
                className="h-9 px-[var(--space-3)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                onClick={handleSearch}
                className="gap-2 px-6 py-3 font-[var(--font-weight-medium)]"
              >
                <Search className="w-4 h-4" />
                Search
              </Button>
            </div>
          </div>
        </PopoverContent>
    </Popover>
  );
}