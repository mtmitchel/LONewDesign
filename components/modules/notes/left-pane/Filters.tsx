"use client";

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../../ui/input';

interface FiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Filters({ searchQuery, onSearchChange }: FiltersProps) {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-tertiary)]" />
      <Input
        type="text"
        placeholder="Search notes"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-9 w-full pl-9 pr-3 bg-[var(--bg-surface)] border border-[var(--border-default)] focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary-tint-10)]"
      />
    </div>
  );
}