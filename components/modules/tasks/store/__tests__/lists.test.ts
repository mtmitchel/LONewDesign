import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { taskStoreApi } from '../index';
import type { TaskList, Task } from '../../types';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const baseList: TaskList = {
  id: 'list-1',
  name: 'Personal',
  color: undefined,
  isVisible: true,
  source: 'google',
};

const baseTask: Task = {
  id: 'task-1',
  title: 'Sample task',
  status: 'needsAction',
  priority: 'none',
  createdAt: new Date('2025-01-01T00:00:00Z').toISOString(),
  labels: [],
  listId: baseList.id,
  isCompleted: false,
  subtasks: [],
};

describe('taskStore list actions', () => {
  beforeEach(() => {
    taskStoreApi.setState({
      tasksById: {},
      taskOrder: [],
      listsById: {},
      listOrder: [],
      listViewPreferences: {},
      syncStatus: 'idle',
      syncError: null,
      lastSyncAt: undefined,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates task lists with optimistic entry and swaps id on success', async () => {
    mockInvoke
      .mockResolvedValueOnce({ id: 'server-list', title: 'Inbox' })
      .mockResolvedValueOnce(undefined); // process_sync_queue_only

    const created = await taskStoreApi.getState().createTaskList('Inbox');

    expect(created).toEqual({
      id: 'server-list',
      name: 'Inbox',
      color: undefined,
      isVisible: true,
      source: 'google',
    });

    const state = taskStoreApi.getState();
    expect(state.listOrder).toEqual(['server-list']);
    expect(state.listsById['server-list']).toEqual(created);
    expect(mockInvoke).toHaveBeenNthCalledWith(1, 'create_task_list', { input: { title: 'Inbox' } });
    expect(mockInvoke).toHaveBeenNthCalledWith(2, 'process_sync_queue_only');
  });

  it('rolls back optimistic list on create failure', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('boom'));

    await expect(taskStoreApi.getState().createTaskList('Errant')).rejects.toThrow('boom');

    const state = taskStoreApi.getState();
    expect(state.listOrder).toHaveLength(0);
    expect(Object.keys(state.listsById)).toHaveLength(0);
  });

  it('deletes list and triggers sync queue processing', async () => {
    taskStoreApi.setState({
      tasksById: { [baseTask.id]: baseTask },
      taskOrder: [baseTask.id],
      listsById: { [baseList.id]: baseList },
      listOrder: [baseList.id],
    });

    mockInvoke
      .mockResolvedValueOnce(undefined) // delete_task_list
      .mockResolvedValueOnce(undefined); // process_sync_queue_only

    await taskStoreApi.getState().deleteTaskList(baseList.id, 'fallback');

    const state = taskStoreApi.getState();
    expect(state.listOrder).toHaveLength(0);
    expect(state.listsById[baseList.id]).toBeUndefined();
    expect(state.tasksById[baseTask.id]?.listId).toBe('fallback');
    expect(mockInvoke).toHaveBeenNthCalledWith(1, 'delete_task_list', {
      input: { id: baseList.id, reassign_to: 'fallback' },
    });
    expect(mockInvoke).toHaveBeenNthCalledWith(2, 'process_sync_queue_only');
  });

  it('restores list when deletion fails', async () => {
    taskStoreApi.setState({
      listsById: { [baseList.id]: baseList },
      listOrder: [baseList.id],
    });

    mockInvoke.mockRejectedValueOnce(new Error('nope'));

    await expect(taskStoreApi.getState().deleteTaskList(baseList.id)).rejects.toThrow('nope');

    const state = taskStoreApi.getState();
    expect(state.listOrder).toEqual([baseList.id]);
    expect(state.listsById[baseList.id]).toEqual(baseList);
  });

  it('toggles list completed visibility flag', () => {
    taskStoreApi.setState({ listViewPreferences: {} });

    const { toggleListCompletedVisibility } = taskStoreApi.getState();
    toggleListCompletedVisibility('a', false);
    expect(taskStoreApi.getState().listViewPreferences['a']).toEqual({ showCompleted: false });
    toggleListCompletedVisibility('a', true);
    expect(taskStoreApi.getState().listViewPreferences['a']).toEqual({ showCompleted: true });
  });
});
