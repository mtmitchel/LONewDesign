import * as React from 'react';
import { useTaskDetails } from './details/useTaskDetails';
import { TitleEditor } from './details/header/TitleEditor';
import { MetaBadges } from './details/header/MetaBadges';
import { DatesPanel } from './details/panels/DatesPanel';
import { PriorityPanel } from './details/panels/PriorityPanel';
import { LabelsPanel } from './details/panels/LabelsPanel';
import { ProjectPanel } from './details/panels/ProjectPanel';
import { SubtaskList } from './details/subtasks/SubtaskList';
import { ActivityFeed } from './details/activity/ActivityFeed';
import { ActivityComposer } from './details/activity/ActivityComposer';
import { Button } from '../../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../ui/alert-dialog';
import { cn } from '../../ui/utils';
import type { Task } from './types';

type Props = {
  task: Task | null;
  onClose: () => void;
  onUpdateTask: (task: Task, options?: { showToast?: boolean }) => void;
  onDeleteTask: (taskId: string) => void;
  presentation?: 'overlay' | 'inline';
  className?: string;
};

export function TaskDetailsDrawer({ task, onClose, onUpdateTask, onDeleteTask, presentation = 'overlay', className }: Props) {
  const {
    edited,
    setEdited,
    savedHint,
    dateOpen,
    setDateOpen,
    labelsOpen,
    setLabelsOpen,
    priorityOpen,
    setPriorityOpen,
    labelInput,
    setLabelInput,
    isSubtaskComposerOpen,
    setIsSubtaskComposerOpen,
    newSubtaskTitle,
    setNewSubtaskTitle,
    newSubtaskDueDate,
    setNewSubtaskDueDate,
    newSubtaskDateOpen,
    setNewSubtaskDateOpen,
    activeSubtaskDatePicker,
    setActiveSubtaskDatePicker,
    deleteDialogOpen,
    setDeleteDialogOpen,
    labelInputRef,
    newSubtaskInputRef,
    subtaskInputRefs,
    handleSave,
    availableLabels,
    currentLabels,
    selectedLabels,
    mergedLabelOptions,
    toggleLabel,
    addFreeformLabel,
    handleToggleSubtaskCompletion,
    handleUpdateSubtaskDueDate,
    handleDeleteSubtask,
    handleSubtaskTitleChange,
    handleSubtaskTitleCommit,
    openSubtaskComposer,
    handleAddSubtask,
    handleCancelNewSubtask,
    focusSubtaskInput,
    handleSubtaskDueDateSelection,
    handleClearSubtaskDueDate,
    handleNewSubtaskDateSelection,
    handleDuplicateSubtask,
    handleTitleChange,
    handleTitleCommit,
    canClearFields,
  } = useTaskDetails(task, onUpdateTask, onClose);

  const titleRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (task && titleRef.current) {
      const timer = setTimeout(() => {
        titleRef.current?.focus();
        titleRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [task]);

  if (!task || !edited) return null;

  const headingId = `task-drawer-title-${task.id}`;

  const dueDate = edited.dueDate ? new Date(edited.dueDate) : undefined;
  const isCompleted = Boolean(edited.isCompleted);
  const priority: Task['priority'] = edited.priority ?? 'none';
  const dueState: 'none' | 'scheduled' | 'today' | 'overdue' = (() => {
    if (!dueDate) return 'none';
    const todayKey = new Date().toISOString().slice(0, 10);
    const targetKey = dueDate.toISOString().slice(0, 10);
    if (targetKey === todayKey) return 'today';
    if (!isCompleted && dueDate.getTime() < Date.now()) return 'overdue';
    return 'scheduled';
  })();
  const dueDisplayLabel = dueDate ? dueDate.toLocaleDateString() : undefined;

  const panelBody = (
    <>
      <TitleEditor
        isCompleted={isCompleted}
        onSave={(isCompleted) => handleSave({ isCompleted })}
        onClose={onClose}
        title={edited.title}
        onTitleChange={handleTitleChange}
        onTitleCommit={handleTitleCommit}
        titleRef={titleRef}
        savedHint={savedHint}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-5)]">
          <DatesPanel
            dueDate={dueDate}
            dueState={dueState}
            dueDisplayLabel={dueDisplayLabel}
            dateOpen={dateOpen}
            setDateOpen={setDateOpen}
            handleSave={handleSave}
          />
          <PriorityPanel
            priority={priority}
            priorityOpen={priorityOpen}
            setPriorityOpen={setPriorityOpen}
            handleSave={handleSave}
          />
          <LabelsPanel
            selectedLabels={selectedLabels}
            mergedLabelOptions={mergedLabelOptions}
            labelsOpen={labelsOpen}
            setLabelsOpen={setLabelsOpen}
            labelInput={labelInput}
            setLabelInput={setLabelInput}
            labelInputRef={labelInputRef}
            toggleLabel={toggleLabel}
            addFreeformLabel={addFreeformLabel}
          />
          <ProjectPanel />

          <div className="h-px bg-[color:var(--border-subtle)]" />

          <SubtaskList
            subtasks={edited.subtasks ?? []}
            isSubtaskComposerOpen={isSubtaskComposerOpen}
            newSubtaskTitle={newSubtaskTitle}
            setNewSubtaskTitle={setNewSubtaskTitle}
            newSubtaskDueDate={newSubtaskDueDate}
            setNewSubtaskDueDate={setNewSubtaskDueDate}
            newSubtaskDateOpen={newSubtaskDateOpen}
            setNewSubtaskDateOpen={setNewSubtaskDateOpen}
            newSubtaskInputRef={newSubtaskInputRef}
            subtaskInputRefs={subtaskInputRefs}
            activeSubtaskDatePicker={activeSubtaskDatePicker}
            setActiveSubtaskDatePicker={setActiveSubtaskDatePicker}
            handleToggleSubtaskCompletion={handleToggleSubtaskCompletion}
            handleUpdateSubtaskDueDate={handleUpdateSubtaskDueDate}
            handleDeleteSubtask={handleDeleteSubtask}
            handleSubtaskTitleChange={handleSubtaskTitleChange}
            handleSubtaskTitleCommit={handleSubtaskTitleCommit}
            openSubtaskComposer={openSubtaskComposer}
            handleAddSubtask={handleAddSubtask}
            handleCancelNewSubtask={handleCancelNewSubtask}
            focusSubtaskInput={focusSubtaskInput}
            handleSubtaskDueDateSelection={handleSubtaskDueDateSelection}
            handleClearSubtaskDueDate={handleClearSubtaskDueDate}
            handleNewSubtaskDateSelection={handleNewSubtaskDateSelection}
            handleDuplicateSubtask={handleDuplicateSubtask}
          />

          <div className="h-px bg-[color:var(--border-subtle)]" />

          <ActivityFeed />
          <ActivityComposer />
        </div>
      </div>

      <footer
        className="sticky bottom-0 mt-0 bg-[color:var(--bg-surface)] border-t border-[color:var(--border-divider)] px-[var(--space-4)] py-[var(--space-4)]"
        style={{ paddingBottom: 'calc(var(--space-4) + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center justify-between gap-[var(--space-3)]">
          <Button
            type="button"
            variant="ghost"
            className={cn(
              'm-0 h-[var(--btn-sm-height,36px)] px-3 border border-[color:var(--border-subtle)] text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-surface-elevated)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)]',
              !canClearFields && 'opacity-60',
            )}
            onClick={() => handleSave({ description: undefined, dueDate: undefined, priority: 'none', labels: [], subtasks: [] })}
            disabled={!canClearFields}
            aria-disabled={!canClearFields}
          >
            Clear fields
          </Button>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                className="m-0 h-[var(--btn-sm-height,36px)] px-3 border border-[color:var(--accent-coral-tint-10)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)]"
              >
                Delete task
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm border-[color:var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--elevation-lg)]">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action permanently removes &ldquo;{task.title}&rdquo; and its subtasks. You can’t undo this.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
                  onClick={() => {
                    onDeleteTask(task.id);
                    setDeleteDialogOpen(false);
                  }}
                >
                  Delete task
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </footer>
    </>
  );

  if (presentation === 'inline') {
    return (
      <aside
        className={cn(
          'flex h-full flex-col bg-[var(--bg-panel)] shadow-[var(--elevation-xl)] px-[var(--panel-pad-x)] pb-0',
          className,
        )}
        style={{ width: 'var(--task-drawer-w)', maxWidth: '100%' }}
        role="region"
        aria-labelledby={headingId}
      >
        {panelBody}
      </aside>
    );
  }

  return (
    <>
      <button
        aria-hidden
        className="fixed left-0 right-0 bottom-0 top-[var(--pane-header-h)] z-[69] bg-[var(--overlay-scrim)]"
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed right-0 bottom-0 top-[var(--pane-header-h)] z-[70] flex flex-col bg-[var(--bg-panel)] shadow-[var(--elevation-xl)] motion-safe:transition-transform duration-[var(--duration-sm)] ease-[var(--ease-emphasized)] px-[var(--panel-pad-x)] pb-0',
          className,
        )}
        style={{
          width: 'var(--task-drawer-w)',
          maxWidth: 'calc(100vw - 2 * var(--task-drawer-edge))',
          maxHeight: 'calc(100dvh - var(--pane-header-h))',
        }}
        role="dialog"
        aria-labelledby={headingId}
        aria-modal
      >
        {panelBody}
      </aside>
    </>
  );
}

export default TaskDetailsDrawer;