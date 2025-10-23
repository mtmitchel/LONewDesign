
import * as React from 'react';
import type { Subtask } from '../../types';
import { SubtaskItem } from './SubtaskItem';
import { SubtaskComposer } from './SubtaskComposer';

interface SubtaskListProps {
  subtasks: Subtask[];
  isSubtaskComposerOpen: boolean;
  newSubtaskTitle: string;
  setNewSubtaskTitle: (title: string) => void;
  newSubtaskDueDate: string | undefined;
  setNewSubtaskDueDate: (date: string | undefined) => void;
  newSubtaskDateOpen: boolean;
  setNewSubtaskDateOpen: (open: boolean) => void;
  newSubtaskInputRef: React.RefObject<HTMLInputElement>;
  subtaskInputRefs: React.RefObject<Map<string, HTMLInputElement>>;
  activeSubtaskDatePicker: string | null;
  setActiveSubtaskDatePicker: (id: string | null) => void;
  handleToggleSubtaskCompletion: (subtaskId: string, isCompleted: boolean) => void;
  handleUpdateSubtaskDueDate: (subtaskId: string, dueDate: string | undefined) => void;
  handleDeleteSubtask: (subtaskId: string) => void;
  handleSubtaskTitleChange: (subtaskId: string, title: string) => void;
  handleSubtaskTitleCommit: () => void;
  openSubtaskComposer: () => void;
  handleAddSubtask: () => void;
  handleCancelNewSubtask: () => void;
  focusSubtaskInput: (subtaskId: string) => void;
  handleSubtaskDueDateSelection: (subtaskId: string, date: Date | undefined) => void;
  handleClearSubtaskDueDate: (subtaskId: string) => void;
  handleNewSubtaskDateSelection: (date: Date | undefined) => void;
  handleDuplicateSubtask: (subtaskId: string) => void;
}

export function SubtaskList(props: SubtaskListProps) {
  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[length:var(--text-sm)] font-semibold text-[color:var(--text-secondary)]">Subtasks</h2>
        {props.subtasks.length > 0 ? (
          <span className="text-[length:var(--text-xs)] font-normal text-[color:var(--text-tertiary)]">
            {props.subtasks.length} {props.subtasks.length === 1 ? 'item' : 'items'}
          </span>
        ) : null}
      </div>
      <div className="density-compact overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="divide-y divide-[var(--border-divider)]">
          {props.subtasks.map((subtask) => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              subtaskInputRefs={props.subtaskInputRefs}
              activeSubtaskDatePicker={props.activeSubtaskDatePicker}
              setActiveSubtaskDatePicker={props.setActiveSubtaskDatePicker}
              handleToggleSubtaskCompletion={props.handleToggleSubtaskCompletion}
              handleUpdateSubtaskDueDate={props.handleUpdateSubtaskDueDate}
              handleDeleteSubtask={props.handleDeleteSubtask}
              handleSubtaskTitleChange={props.handleSubtaskTitleChange}
              handleSubtaskTitleCommit={props.handleSubtaskTitleCommit}
              openSubtaskComposer={props.openSubtaskComposer}
              focusSubtaskInput={props.focusSubtaskInput}
              handleSubtaskDueDateSelection={props.handleSubtaskDueDateSelection}
              handleClearSubtaskDueDate={props.handleClearSubtaskDueDate}
              handleDuplicateSubtask={props.handleDuplicateSubtask}
            />
          ))}
        </div>
        <SubtaskComposer
          isSubtaskComposerOpen={props.isSubtaskComposerOpen}
          newSubtaskTitle={props.newSubtaskTitle}
          setNewSubtaskTitle={props.setNewSubtaskTitle}
          newSubtaskDueDate={props.newSubtaskDueDate}
          setNewSubtaskDueDate={props.setNewSubtaskDueDate}
          newSubtaskDateOpen={props.newSubtaskDateOpen}
          setNewSubtaskDateOpen={props.setNewSubtaskDateOpen}
          newSubtaskInputRef={props.newSubtaskInputRef}
          handleAddSubtask={props.handleAddSubtask}
          handleCancelNewSubtask={props.handleCancelNewSubtask}
          handleNewSubtaskDateSelection={props.handleNewSubtaskDateSelection}
          openSubtaskComposer={props.openSubtaskComposer}
        />
      </div>
    </div>
  );
}
