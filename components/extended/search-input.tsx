"use client";

import * as React from "react";
import { Search, X, Filter } from "lucide-react";
import { cn } from "../ui/utils";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface SearchFilter {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'select' | 'date' | 'boolean';
  options?: Array<{ label: string; value: string }>;
}

interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onFiltersChange?: (filters: Record<string, any>) => void;
  placeholder?: string;
  filters?: SearchFilter[];
  showFilterButton?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SearchInput({
  value = "",
  onChange,
  onFiltersChange,
  placeholder = "Search...",
  filters = [],
  showFilterButton = false,
  disabled = false,
  className
}: SearchInputProps) {
  const [searchValue, setSearchValue] = React.useState(value);
  const [showFilters, setShowFilters] = React.useState(false);
  const [activeFilters, setActiveFilters] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    onChange?.(newValue);
  };

  const clearSearch = () => {
    setSearchValue("");
    onChange?.("");
  };

  const handleFilterChange = (filterId: string, filterValue: any) => {
    const newFilters = { ...activeFilters };
    
    if (filterValue === "" || filterValue === null || filterValue === undefined) {
      delete newFilters[filterId];
    } else {
      newFilters[filterId] = filterValue;
    }
    
    setActiveFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const clearFilter = (filterId: string) => {
    handleFilterChange(filterId, null);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    onFiltersChange?.({});
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search Input */}
      <div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--text-secondary)]" size={16} />
        <Input
          value={searchValue}
          onChange={handleSearchChange}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-20"
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 w-6 p-0 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
            >
              <X size={14} />
            </Button>
          )}
          
          {showFilterButton && filters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "h-6 px-2 text-[color:var(--text-secondary)]",
                (showFilters || activeFilterCount > 0) && "text-[color:var(--primary)]"
              )}
            >
              <Filter size={14} />
              {activeFilterCount > 0 && (
                <span className="ml-1 text-xs">{activeFilterCount}</span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[color:var(--text-secondary)]">Filters:</span>
          {Object.entries(activeFilters).map(([filterId, filterValue]) => {
            const filter = filters.find(f => f.id === filterId);
            if (!filter) return null;

            return (
              <Badge
                key={filterId}
                variant="secondary"
                className="text-xs bg-[var(--primary-tint-15)] text-[color:var(--primary)] hover:bg-[var(--primary-tint-20)]"
              >
                {filter.label}: {String(filterValue)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter(filterId)}
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                >
                  <X size={10} />
                </Button>
              </Badge>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 px-2 text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--error)]"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Filter Controls */}
      {showFilters && filters.length > 0 && (
        <div className="p-4 bg-[var(--elevated)] border border-[var(--border-subtle)] rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-[color:var(--text-primary)]">Filters</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
              className="h-6 w-6 p-0 text-[color:var(--text-secondary)]"
            >
              <X size={14} />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filters.map((filter) => (
              <div key={filter.id} className="space-y-1">
                <label className="text-xs font-medium text-[color:var(--text-secondary)]">
                  {filter.label}
                </label>
                
                {filter.type === 'text' && (
                  <Input
                    value={activeFilters[filter.id] || ''}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    placeholder={`Filter by ${filter.label.toLowerCase()}`}
                  />
                )}
                
                {filter.type === 'select' && filter.options && (
                  <select
                    value={activeFilters[filter.id] || ''}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    className="w-full px-3 py-1 text-sm border border-[var(--border-default)] rounded-md bg-[var(--surface)] text-[color:var(--text-primary)]"
                  >
                    <option value="">All</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                
                {filter.type === 'boolean' && (
                  <select
                    value={activeFilters[filter.id] || ''}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value === 'true')}
                    className="w-full px-3 py-1 text-sm border border-[var(--border-default)] rounded-md bg-[var(--surface)] text-[color:var(--text-primary)]"
                  >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export type { SearchInputProps, SearchFilter };