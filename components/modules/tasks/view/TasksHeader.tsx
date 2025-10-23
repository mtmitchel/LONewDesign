"use client";
import { 
  KanbanSquare, List, Search, Plus, Filter, RefreshCw, ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../../ui/dropdown-menu';
import { SegmentedToggle } from '../../../controls/SegmentedToggle';
import { useTaskStore, selectSyncStatus } from '../taskStore';
import { useTasksView } from './TasksViewContext';

interface TasksHeaderProps {
  columns: Array<{ id: string; title: string }>;
  taskLists: Array<{ id: string; name: string }>;
}

export function TasksHeader({ columns, taskLists }: TasksHeaderProps) {
  const {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    selectedList,
    setSelectedList,
    globalSort,
    setGlobalSort,
    selectedLabels,
    allLabels,
    availableLabelOptions,
    toggleLabelFilter,
    setSelectedLabels,
    projectFilter,
    setProjectFilter,
    activeProject,
    handleOpenAssistant,
  } = useTasksView();

  const { status } = useTaskStore(selectSyncStatus);
  const syncNow = useTaskStore((s) => s.syncNow);
  const isSyncing = status === 'syncing';

  return (
    <header className="h-[var(--pane-header-h)] px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between flex-shrink-0 motion-safe:transition-colors duration-[var(--duration-fast)]">
      <div className="flex items-center gap-4 min-w-0">
        <SegmentedToggle
          id="tasks-view-toggle"
          ariaLabel="Switch task view"
          surface="tasks"
          value={viewMode}
          onChange={(next) => setViewMode(next as 'board' | 'list')}
          options={[
            {
              value: 'board',
              label: 'Board',
              icon: KanbanSquare,
              title: 'Switch to board view',
              ariaKeyShortcuts: 'Alt+B',
            },
            {
              value: 'list',
              label: 'List',
              icon: List,
              title: 'Switch to list view',
              ariaKeyShortcuts: 'Alt+L',
            },
          ]}
          dense
        />
        <h1 className="text-lg font-semibold truncate">Tasks</h1>
        {projectFilter ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 whitespace-nowrap text-[color:var(--text-secondary)] min-w-0"
            onClick={() => setProjectFilter(null)}
          >
            <span className="truncate">
              {activeProject?.name ?? "Filtered"}
            </span>
            <span aria-hidden className="ml-2 text-[color:var(--text-tertiary)] flex-shrink-0">×</span>
            <span className="sr-only">Clear project filter</span>
          </Button>
        ) : null}
      </div>

      <div className="flex-1 flex justify-center px-8 min-w-0">
        <div className="relative w-[320px] max-w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-tertiary)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full pl-9 pr-3 bg-white border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] motion-safe:transition-colors duration-[var(--duration-fast)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {viewMode === 'list' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 text-[color:var(--text-secondary)] min-w-[120px] justify-between">
                <span className="truncate">
                  {selectedList ? columns.find(c => c.id === selectedList)?.title : 'All lists'}
                </span>
                <ChevronDown size={14} className="ml-2 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--elevation-lg)] p-1.5">
              <DropdownMenuItem 
                className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                onClick={() => setSelectedList(null)}
              >
                {selectedList === null && <span className="w-4 h-4 flex items-center justify-center text-primary">✓</span>}
                {selectedList !== null && <span className="w-4 h-4"></span>}
                <span className={selectedList === null ? 'font-semibold' : ''}>All lists</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              {columns.map(column => (
                <DropdownMenuItem 
                  key={column.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                  onClick={() => setSelectedList(column.id)}
                >
                  {selectedList === column.id && <span className="w-4 h-4 flex items-center justify-center text-primary">✓</span>}
                  {selectedList !== column.id && <span className="w-4 h-4"></span>}
                  <span className={selectedList === column.id ? 'font-semibold' : ''}>{column.title}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {viewMode === 'list' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 text-[color:var(--text-secondary)]">
                <ArrowUpDown size={14} className="mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--elevation-lg)] p-1.5">
              <DropdownMenuItem 
                className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                onClick={() => setGlobalSort('due-date')}
              >
                {globalSort === 'due-date' && <span className="w-4 h-4 flex items-center justify-center text-primary">✓</span>}
                {globalSort !== 'due-date' && <span className="w-4 h-4"></span>}
                <span className={globalSort === 'due-date' ? 'font-semibold' : ''}>Due date</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                onClick={() => setGlobalSort('date-created')}
              >
                {globalSort === 'date-created' && <span className="w-4 h-4 flex items-center justify-center text-primary">✓</span>}
                {globalSort !== 'date-created' && <span className="w-4 h-4"></span>}
                <span className={globalSort === 'date-created' ? 'font-semibold' : ''}>Date created</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                onClick={() => setGlobalSort('priority')}
              >
                {globalSort === 'priority' && <span className="w-4 h-4 flex items-center justify-center text-primary">✓</span>}
                {globalSort !== 'priority' && <span className="w-4 h-4"></span>}
                <span className={globalSort === 'priority' ? 'font-semibold' : ''}>Priority</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 text-[color:var(--text-secondary)] min-w-[80px] justify-between">
              <span className="flex items-center">
                <Filter size={14} className="mr-2 flex-shrink-0" />
                <span>Filter</span>
                {selectedLabels.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold rounded-full bg-primary text-primary-foreground flex-shrink-0">
                    {selectedLabels.length}
                  </span>
                )}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--elevation-lg)] p-1.5">
            {allLabels.length === 0 ? (
              <div className="px-3 py-2 text-[length:var(--text-sm)] text-[color:var(--text-tertiary)] text-center">
                No labels found
              </div>
            ) : (
              <>
                <div className="px-3 py-1.5 text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[color:var(--text-tertiary)] uppercase">
                  Filter by label
                </div>
                {allLabels.map(label => {
                  const labelColor = availableLabelOptions.find(opt => opt.name === label)?.color || 'var(--label-gray)';
                  const isSelected = selectedLabels.includes(label);
                  return (
                    <DropdownMenuItem
                      key={label}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        toggleLabelFilter(label);
                      }}
                    >
                      <Badge
                        variant="soft"
                        size="sm"
                        className={`relative ${isSelected ? 'ring-2 ring-[var(--primary)] ring-offset-1' : ''}`}
                        style={{ 
                          backgroundColor: `color-mix(in oklab, ${labelColor} ${isSelected ? '25' : '18'}%, transparent)`,
                          color: `color-mix(in oklab, ${labelColor} 85%, var(--text-primary))`,
                          boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${labelColor} ${isSelected ? '45' : '35'}%, transparent)`,
                          minWidth: 'fit-content'
                        }}
                      >
                        {label}
                      </Badge>
                    </DropdownMenuItem>
                  );
                })}
                {selectedLabels.length > 0 && (
                  <>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem
                      className="px-2 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                      onClick={() => setSelectedLabels([])}
                    >
                      Clear all filters
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 text-[color:var(--text-secondary)] ${isSyncing ? 'animate-pulse' : ''}`}
          title="Sync lists and tasks"
          onClick={() => { void syncNow(); }}
          disabled={isSyncing}
        >
          <RefreshCw size={14} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing…' : 'Sync'}
        </Button>
        
        <Button
          onClick={handleOpenAssistant}
          className="h-9 bg-[var(--primary)] text-[var(--primary-foreground)] md:hidden"
          aria-keyshortcuts="Meta+K,Control+K"
        >
          <Plus size={16} className="mr-2" />
          Add task
        </Button>
      </div>
    </header>
  );
}