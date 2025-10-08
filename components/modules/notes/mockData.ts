import { Note, NoteFolder } from './types';

export const mockFolders: NoteFolder[] = [
  { id: 'inbox', name: 'Inbox', noteCount: 12, order: 0 },
  { id: 'work', name: 'Work Projects', noteCount: 8, order: 1 },
  { id: 'personal', name: 'Personal', noteCount: 5, order: 2 },
  { id: 'research', name: 'Research', noteCount: 15, order: 3 },
  { id: 'meeting-notes', name: 'Meeting Notes', parentId: 'work', noteCount: 6, order: 0 },
  { id: 'project-plans', name: 'Project Plans', parentId: 'work', noteCount: 4, order: 1 }
];

export const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Quick Ideas',
    content: '',
    folderId: null,
    order: 0,
    tags: [],
    isStarred: false,
    lastModified: '2 hours ago',
    wordCount: 0,
    createdAt: '2025-01-15T10:30:00.000Z',
    updatedAt: '2025-01-15T10:30:00.000Z'
  },
  {
    id: '2',
    title: 'Meeting Notes',
    content: '',
    folderId: null,
    tags: ['meeting'],
    isStarred: true,
    lastModified: '1 day ago',
    wordCount: 0,
    createdAt: '2025-01-14T15:45:00.000Z',
    updatedAt: '2025-01-14T15:45:00.000Z'
  },
  {
    id: '3',
    title: 'To Do',
    content: '',
    folderId: null,
    tags: ['tasks'],
    isStarred: false,
    lastModified: '3 days ago',
    wordCount: 0,
    createdAt: '2025-01-12T08:15:00.000Z',
    updatedAt: '2025-01-12T08:15:00.000Z'
  }
];
