import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
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
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <h4 className="font-medium text-[var(--text-primary)]">Advanced Search</h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)]">From</label>
                <Input 
                  placeholder="sender@email.com"
                  value={searchFilters.from}
                  onChange={(e) => onFiltersChange({ ...searchFilters, from: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)]">Subject</label>
                <Input 
                  placeholder="Email subject..."
                  value={searchFilters.subject}
                  onChange={(e) => onFiltersChange({ ...searchFilters, subject: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)]">Date Range</label>
                <Select 
                  value={searchFilters.dateRange} 
                  onValueChange={(value) => onFiltersChange({ ...searchFilters, dateRange: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="hasAttachment"
                  checked={searchFilters.hasAttachment}
                  onCheckedChange={(checked) => 
                    onFiltersChange({ ...searchFilters, hasAttachment: !!checked })
                  }
                />
                <label htmlFor="hasAttachment" className="text-sm">Has attachments</label>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                variant="tonal"
                onClick={onApplyFilters}
              >
                Apply Filters
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={onClearFilters}
              >
                Clear
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}