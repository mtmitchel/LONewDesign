import { useMemo } from 'react';
import type { NoteFolder } from '../../types';

export interface OrganizedFolder extends NoteFolder {
  children: OrganizedFolder[];
}

export function useFolderTree(folders: NoteFolder[]): OrganizedFolder[] {
  return useMemo(() => {
    const rootFolders = folders.filter(f => !f.parentId);
    const childFolders = folders.filter(f => f.parentId);
    
    const buildTree = (parentId?: string | null): OrganizedFolder[] => {
      const children = childFolders.filter(f => f.parentId === parentId);
      return children.map(folder => ({
        ...folder,
        children: buildTree(folder.id)
      }));
    };

    return rootFolders.map(folder => ({
      ...folder,
      children: buildTree(folder.id)
    }));
  }, [folders]);
}