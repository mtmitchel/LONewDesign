import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BoardView } from '../BoardView';
import type { Task } from '../../types';

vi.mock('../TasksViewContext', () => ({
  useTasksView: () => ({
    isAddingList: false,
  }),
}));

const baseTask: Task = {
  id: 'task-1',
  title: 'Sample task',
  status: 'needsAction',
  priority: 'none',
  createdAt: new Date('2025-01-01T00:00:00Z').toISOString(),
  labels: [],
  listId: 'list-1',
  isCompleted: false,
  subtasks: [],
};

describe('BoardView task card context menu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invokes onEditTask when Edit is selected in the context menu', async () => {
    const user = userEvent.setup();
    const onEditTask = vi.fn();

    render(
      <BoardView
        columns={[{ id: 'list-1', title: 'Inbox' }]}
        filteredTasks={[baseTask]}
        availableLabelOptions={[]}
        onAddTask={vi.fn()}
        onToggleTaskCompletion={vi.fn()}
        onDeleteTask={vi.fn()}
        onDuplicateTask={vi.fn()}
        onTaskSelect={vi.fn()}
        onEditTask={onEditTask}
        onDeleteList={vi.fn()}
        onMoveTask={vi.fn()}
        handleAddList={vi.fn()}
        newListName=""
        setNewListName={vi.fn()}
        setIsAddingList={vi.fn()}
      />
    );

    const card = screen.getByText('Sample task');
    fireEvent.contextMenu(card);

    const editOption = await screen.findByText('Edit');
    await user.click(editOption);

    expect(onEditTask).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-1' }));
  });
});
