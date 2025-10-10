import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';

type DroppableColumnProps = {
  id: string;
  children: React.ReactNode;
  className?: string;
};

export function DroppableColumn({ id, children, className }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={{
        backgroundColor: isOver ? 'rgba(59, 130, 246, 0.1)' : undefined,
        transition: 'background-color 200ms',
      }}
    >
      {children}
    </div>
  );
}
