
import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent } from '../../ui/card';
import { Calendar, Flag } from 'lucide-react';

interface TaskComposerProps {
  onAddTask: (title: string) => void;
  onCancel: () => void;
}

export function TaskComposer({ onAddTask, onCancel }: TaskComposerProps) {
  const [title, setTitle] = useState('');

  const handleAddTask = () => {
    if (title.trim()) {
      onAddTask(title.trim());
      setTitle('');
    }
  };

  return (
    <Card className="mb-2 bg-[var(--bg-surface)] border border-dashed border-[var(--border-subtle)] shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 border-2 border-gray-300 rounded-full mt-1" />
          <Input
            placeholder="Write a task name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 border-none bg-transparent focus:outline-none focus:ring-0 px-0"
            autoFocus
          />
        </div>
        <div className="flex items-center justify-between mt-2 ml-8">
            <div className="flex items-center gap-2">
                <Button onClick={handleAddTask} size="sm">Add task</Button>
                <Button onClick={onCancel} variant="ghost" size="sm">Cancel</Button>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="w-8 h-8">
                    <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8">
                    <Flag className="w-4 h-4 text-[var(--text-tertiary)]" />
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
