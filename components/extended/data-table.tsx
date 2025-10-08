"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, MoreHorizontal, ArrowUpDown } from "lucide-react";
import { cn } from "../ui/utils";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  onRowClick?: (item: T) => void;
  onSelectionChange?: (selectedItems: T[]) => void;
  selectable?: boolean;
  sortable?: boolean;
  className?: string;
  emptyMessage?: string;
  rowActions?: Array<{
    label: string;
    onClick: (item: T) => void;
    variant?: 'default' | 'destructive';
  }>;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  onSelectionChange,
  selectable = false,
  sortable = true,
  className,
  emptyMessage = "No data available",
  rowActions = []
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);
  const [selectedItems, setSelectedItems] = React.useState<Set<number>>(new Set());

  const handleSort = (columnId: string) => {
    if (!sortable) return;
    
    const column = columns.find(col => col.id === columnId);
    if (!column?.sortable) return;

    if (sortColumn === columnId) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    const column = columns.find(col => col.id === sortColumn);
    if (!column?.accessorKey) return data;

    return [...data].sort((a, b) => {
      const aValue = a[column.accessorKey!];
      const bValue = b[column.accessorKey!];

      if (aValue === bValue) return 0;
      
      let comparison = 0;
      if (aValue > bValue) comparison = 1;
      if (aValue < bValue) comparison = -1;

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [data, sortColumn, sortDirection, columns]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(sortedData.map((_, index) => index)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedItems(newSelected);
  };

  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedData = Array.from(selectedItems).map(index => sortedData[index]);
      onSelectionChange(selectedData);
    }
  }, [selectedItems, sortedData, onSelectionChange]);

  const getSortIcon = (columnId: string) => {
    if (sortColumn !== columnId) {
      return <ArrowUpDown size={14} className="opacity-50" />;
    }
    
    if (sortDirection === 'asc') {
      return <ChevronUp size={14} />;
    } else if (sortDirection === 'desc') {
      return <ChevronDown size={14} />;
    }
    
    return <ArrowUpDown size={14} className="opacity-50" />;
  };

  const renderCell = (column: DataTableColumn<T>, item: T) => {
    if (column.cell) {
      return column.cell(item);
    }
    
    if (column.accessorKey) {
      const value = item[column.accessorKey];
      return String(value ?? '');
    }
    
    return null;
  };

  const allSelected = selectedItems.size === sortedData.length && sortedData.length > 0;
  const someSelected = selectedItems.size > 0 && selectedItems.size < sortedData.length;

  return (
    <div className={cn("border border-[var(--border-subtle)] rounded-lg overflow-hidden", className)}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-[var(--elevated)] border-b border-[var(--border-subtle)]">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3 text-left">
                  <Checkbox
                    checked={someSelected ? 'indeterminate' : allSelected}
                    onCheckedChange={(value) => handleSelectAll(value === true || value === 'indeterminate')}
                  />
                </th>
              )}
              
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    "px-4 py-3 text-left text-sm font-medium text-[color:var(--text-primary)]",
                    column.sortable && sortable && "cursor-pointer hover:bg-[var(--primary-tint-10)]/30",
                    column.align === 'center' && "text-center",
                    column.align === 'right' && "text-right"
                  )}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column.id)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable && sortable && getSortIcon(column.id)}
                  </div>
                </th>
              ))}
              
              {rowActions.length > 0 && (
                <th className="w-12 px-4 py-3"></th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)}
                  className="px-4 py-8 text-center text-[color:var(--text-secondary)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr
                  key={index}
                  className={cn(
                    "border-b border-[var(--border-subtle)] hover:bg-[var(--primary-tint-10)]/20 transition-colors",
                    onRowClick && "cursor-pointer",
                    selectedItems.has(index) && "bg-[var(--primary-tint-10)]"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedItems.has(index)}
                        onCheckedChange={(checked) => handleSelectItem(index, !!checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={cn(
                        "px-4 py-3 text-sm text-[color:var(--text-primary)]",
                        column.align === 'center' && "text-center",
                        column.align === 'right' && "text-right"
                      )}
                    >
                      {renderCell(column, item)}
                    </td>
                  ))}
                  
                  {rowActions.length > 0 && (
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {rowActions.map((action) => (
                            <DropdownMenuItem
                              key={action.label}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(item);
                              }}
                              variant={action.variant}
                            >
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
