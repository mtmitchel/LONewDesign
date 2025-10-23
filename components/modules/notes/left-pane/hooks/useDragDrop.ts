import { useState } from 'react';

export function useDragDrop() {
  const [draggedFolder, setDraggedFolder] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ folderId: string; position: 'above' | 'below' | 'inside' } | null>(null);
  const [rootNoteDrop, setRootNoteDrop] = useState<{ noteId: string; position: 'above' | 'below' } | null>(null);

  return {
    draggedFolder,
    setDraggedFolder,
    dropTarget,
    setDropTarget,
    rootNoteDrop,
    setRootNoteDrop
  };
}