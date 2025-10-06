import React from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { MoreHorizontal, ArrowUpDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '../../ui/dropdown-menu';


interface TaskColumnHeaderProps {
  columnTitle: string;
  taskCount: number;
  onSort: (sortBy: string) => void;
  onHideCompleted: () => void;
  onRenameList: () => void;
  onDeleteList: () => void;
}

export function TaskColumnHeader({ 
    columnTitle, 
    taskCount, 
    onSort, 
    onHideCompleted, 
    onRenameList, 
    onDeleteList 
}: TaskColumnHeaderProps) {
  const [sortOption, setSortOption] = React.useState('date-created');

  const handleSortChange = (value: string) => {
      setSortOption(value);
      onSort(value);
  }

  return (
    <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm text-[var(--text-secondary)]">
            {columnTitle}
          </h3>
          <span className="text-sm text-[var(--text-tertiary)]">
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
                <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup value={sortOption} onValueChange={handleSortChange}>
                        <DropdownMenuRadioItem value="date-created">Date created</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="due-date">Due date</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="title">Title</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="priority">Priority</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                        <MoreHorizontal className="w-4 h-4 text-[var(--text-tertiary)]" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onHideCompleted}>Hide completed tasks</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onRenameList}>Rename list</DropdownMenuItem>
                    <DropdownMenuItem onClick={onDeleteList} className="text-[var(--danger)]">Delete list</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
  );
}