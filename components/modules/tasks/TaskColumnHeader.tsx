import React from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { MoreHorizontal, ArrowUpDown, Check } from 'lucide-react';
import { cn } from '../../ui/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../ui/dropdown-menu';


interface TaskColumnHeaderProps {
  columnTitle: string;
  taskCount: number;
  currentSort?: string;
  onSort: (sortBy: string) => void;
  onHideCompleted: () => void;
  onRenameList: () => void;
  onDeleteList: () => void;
}

export function TaskColumnHeader({ 
    columnTitle, 
    taskCount,
    currentSort = 'date-created',
    onSort, 
    onHideCompleted, 
    onRenameList, 
    onDeleteList 
}: TaskColumnHeaderProps) {

  const handleSortChange = (value: string) => {
      onSort(value);
  }

  return (
    <Card
      className={cn(
        "bg-[var(--bg-surface)] border border-[var(--border-subtle)]",
        "rounded-[var(--list-header-radius)] shadow-[var(--list-header-shadow)]",
        "px-[var(--list-header-pad-x)] py-[var(--list-header-pad-y)]"
      )}
      role="group"
      aria-roledescription="list header"
    >
      <div className="flex items-center justify-between gap-[var(--space-2)]">
        <div className="flex items-center gap-[var(--space-2)] min-w-0">
          <h3 
            className="text-[length:var(--list-header-title)] font-semibold text-[var(--text-primary)] truncate"
          >
            {columnTitle}
          </h3>
          <span className="shrink-0 rounded-[var(--radius-full)] px-[var(--space-2)] py-[calc(var(--space-1)/2)] text-xs bg-[color-mix(in_oklab,var(--text-secondary)_10%,transparent)] text-[var(--text-secondary)]">
            {taskCount}
          </span>
        </div>
        <div className="flex items-center gap-[var(--space-1)]">
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title="Sort" aria-keyshortcuts="Shift+S" className="w-6 h-6 p-0">
                      <ArrowUpDown style={{ width: "var(--list-header-toolbar-icon)", height: "var(--list-header-toolbar-icon)" }} className="text-[var(--text-tertiary)]" />
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                      className="flex items-center gap-2"
                      onClick={(e) => {
                          e.preventDefault();
                          handleSortChange('date-created');
                      }}
                  >
                      {currentSort === 'date-created' && <Check className="w-4 h-4" />}
                      {currentSort !== 'date-created' && <span className="w-4 h-4"></span>}
                      <span>Date created</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                      className="flex items-center gap-2"
                      onClick={(e) => {
                          e.preventDefault();
                          handleSortChange('due-date');
                      }}
                  >
                      {currentSort === 'due-date' && <Check className="w-4 h-4" />}
                      {currentSort !== 'due-date' && <span className="w-4 h-4"></span>}
                      <span>Due date</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                      className="flex items-center gap-2"
                      onClick={(e) => {
                          e.preventDefault();
                          handleSortChange('title');
                      }}
                  >
                      {currentSort === 'title' && <Check className="w-4 h-4" />}
                      {currentSort !== 'title' && <span className="w-4 h-4"></span>}
                      <span>Title</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                      className="flex items-center gap-2"
                      onClick={(e) => {
                          e.preventDefault();
                          handleSortChange('priority');
                      }}
                  >
                      {currentSort === 'priority' && <Check className="w-4 h-4" />}
                      {currentSort !== 'priority' && <span className="w-4 h-4"></span>}
                      <span>Priority</span>
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title="More options" aria-keyshortcuts="Alt+M" className="w-6 h-6 p-0">
                      <MoreHorizontal style={{ width: "var(--list-header-toolbar-icon)", height: "var(--list-header-toolbar-icon)" }} className="text-[var(--text-tertiary)]" />
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onHideCompleted}>
                      Hide completed tasks
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onRenameList}>
                      Rename list
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDeleteList} className="text-[var(--danger)]">
                      Delete list
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
