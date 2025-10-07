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
        "bg-[var(--task-header-bg)] border border-[var(--task-header-border)]",
        "rounded-[var(--task-header-radius)] shadow-[var(--elevation-sm)]",
        "px-[var(--task-header-pad-x)] py-[var(--task-header-pad-y)]"
      )}
      role="group"
      aria-roledescription="list header"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="text-[length:var(--text-xl)] font-[var(--font-weight-semibold)] text-[var(--text-primary)]">
            {columnTitle}
          </h3>
          <span className="text-[length:var(--text-sm)] text-[var(--text-secondary)] ml-[var(--space-2)]">
            {taskCount}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                      <ArrowUpDown className="w-4 h-4 text-[var(--text-tertiary)]" />
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
                  <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                      <MoreHorizontal className="w-4 h-4 text-[var(--text-tertiary)]" />
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
