import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '../../types';
import { useTaskDetails } from '../useTaskDetails';

let mockStoreState: { tasksById: Record<string, Task> } = { tasksById: {} };

vi.mock('../../taskStore', () => ({
  useTaskStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}));

const baseTask: Task = {
  id: 'task-1',
  title: 'Initial task',
  status: 'needsAction',
  priority: 'none',
  createdAt: new Date('2025-01-01T00:00:00Z').toISOString(),
  labels: [],
  listId: 'list-1',
  isCompleted: false,
  subtasks: [],
};

describe('useTaskDetails', () => {
  const onClose = vi.fn();
  const onUpdateTask = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockStoreState = {
      tasksById: {
        [baseTask.id]: baseTask,
      },
    };
    onClose.mockReset();
    onUpdateTask.mockReset();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
  });

  it('initialises and resets edited state when task changes', () => {
    type HookProps = { task: Task | null };
    const { result, rerender } = renderHook<ReturnType<typeof useTaskDetails>, HookProps>(
      ({ task }) => useTaskDetails(task, onUpdateTask, onClose),
      { initialProps: { task: baseTask } },
    );

    expect(result.current.edited).toEqual(baseTask);

    rerender({ task: null });
    expect(result.current.edited).toBeNull();
  });

  it('persists updates via handleSave and clears hint after timeout', () => {
    const { result } = renderHook(() => useTaskDetails(baseTask, onUpdateTask, onClose));

    act(() => {
      result.current.handleSave({ title: 'Updated title' });
    });

    expect(onUpdateTask).toHaveBeenCalledTimes(1);
    expect(onUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({ id: baseTask.id, title: 'Updated title' }),
      { showToast: false },
    );
    expect(result.current.savedHint).toBe('Saved');

    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(result.current.savedHint).toBeNull();
  });

  it('toggles labels optimistically through toggleLabel', () => {
    const { result } = renderHook(() => useTaskDetails(baseTask, onUpdateTask, onClose));

    act(() => {
      result.current.toggleLabel({ name: 'Design', color: '#fff' });
    });

    expect(onUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        labels: expect.arrayContaining([
          expect.objectContaining({ name: 'Design', color: '#fff' }),
        ]),
      }),
      { showToast: false },
    );
  });

  it('adds a subtask from composer and forwards update payload', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.123456);
    const { result } = renderHook(() => useTaskDetails(baseTask, onUpdateTask, onClose));

    act(() => {
      result.current.setNewSubtaskTitle('New subtask');
    });

    act(() => {
      result.current.handleAddSubtask();
    });

    expect(onUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        subtasks: expect.arrayContaining([
          expect.objectContaining({ title: 'New subtask', isCompleted: false }),
        ]),
      }),
      { showToast: false },
    );

    randomSpy.mockRestore();
  });
});
