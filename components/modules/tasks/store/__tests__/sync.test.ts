import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { taskStoreApi, selectSyncStatus } from '../index';
import { invoke } from '@tauri-apps/api/core';

// Mock @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe('taskStore - Sync Operations', () => {
  let backendTasks: any[];

  beforeEach(() => {
    backendTasks = [];

    // Reset store state before each test
    taskStoreApi.setState({
      tasksById: {},
      taskOrder: [],
      listsById: {},
      listOrder: [],
      syncStatus: 'idle',
      syncError: null,
      lastSyncAt: undefined,
    });

    // Clear all mocks
    vi.clearAllMocks();

    mockInvoke.mockImplementation(async (command: string, payload: any) => {
      switch (command) {
        case 'process_sync_queue_only': {
          const now = Math.floor(Date.now() / 1000);
          backendTasks = backendTasks.map((task) => ({
            ...task,
            sync_state: 'synced',
            last_synced_at: now,
          }));
          return 'ok';
        }
        case 'sync_tasks_now': {
          const now = Math.floor(Date.now() / 1000);
          backendTasks = backendTasks.map((task) => ({
            ...task,
            sync_state: 'synced',
            last_synced_at: now,
          }));
          return 'ok';
        }
        default:
          return undefined;
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('selectSyncStatus', () => {
    it('should return sync state', () => {
      act(() => {
        taskStoreApi.getState().setSyncStatus('syncing', null);
      });

      const syncStatus = selectSyncStatus(taskStoreApi.getState());

      expect(syncStatus.status).toBe('syncing');
      expect(syncStatus.error).toBeNull();
    });
  });
});
