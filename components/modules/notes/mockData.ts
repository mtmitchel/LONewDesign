import { Note, NoteFolder } from './types';

export const mockFolders: NoteFolder[] = [
  { id: 'inbox', name: 'Inbox', noteCount: 12 },
  { id: 'work', name: 'Work Projects', noteCount: 8 },
  { id: 'personal', name: 'Personal', noteCount: 5 },
  { id: 'research', name: 'Research', noteCount: 15 },
  { id: 'meeting-notes', name: 'Meeting Notes', parentId: 'work', noteCount: 6 },
  { id: 'project-plans', name: 'Project Plans', parentId: 'work', noteCount: 4 }
];

export const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Project Planning Session Notes',
    content: 'Today we discussed the Q4 roadmap and identified key priorities for the upcoming quarter. The team agreed on focusing on three main initiatives: improving user onboarding, enhancing the mobile experience, and implementing advanced analytics.',
    folderId: 'work',
    tags: ['planning', 'q4', 'roadmap'],
    isStarred: true,
    lastModified: '2 hours ago',
    wordCount: 325,
    createdAt: '2025-09-30T10:30:00.000Z',
    updatedAt: '2025-10-07T20:15:00.000Z'
  },
  {
    id: '2',
    title: 'Design System Research',
    content: 'Researching modern design systems and component libraries for the upcoming redesign. Key findings suggest that a token-based approach with CSS custom properties provides the best balance of flexibility and maintainability.',
    folderId: 'research',
    tags: ['design', 'ui', 'components'],
    isStarred: false,
    lastModified: '1 day ago',
    wordCount: 156,
    createdAt: '2025-09-27T15:45:00.000Z',
    updatedAt: '2025-10-06T18:20:00.000Z'
  },
  {
    id: '3',
    title: 'Weekly Review Template',
    content: 'A template for conducting effective weekly reviews:\n\n1. Review last week\'s accomplishments\n2. Identify blockers and challenges\n3. Plan priorities for next week\n4. Schedule focused work sessions',
    folderId: 'personal',
    tags: ['template', 'productivity', 'review'],
    isStarred: true,
    lastModified: '3 days ago',
    wordCount: 89,
    createdAt: '2025-09-25T08:15:00.000Z',
    updatedAt: '2025-10-04T14:00:00.000Z'
  },
  {
    id: '4',
    title: 'Meeting Notes - Client Call',
    content: 'Client expressed satisfaction with current progress but requested additional features for the next release. Timeline discussion postponed to next week after technical feasibility review.',
    folderId: 'meeting-notes',
    tags: ['meeting', 'client', 'feedback'],
    isStarred: false,
    lastModified: '5 days ago',
    wordCount: 234,
    createdAt: '2025-09-22T16:45:00.000Z',
    updatedAt: '2025-09-30T11:30:00.000Z'
  },
  {
    id: '5',
    title: 'API Documentation Requirements',
    content: 'Comprehensive API documentation needs to include:\n- Authentication flows\n- Rate limiting information\n- Error response formats\n- SDK integration examples\n- Sandbox environment access',
    folderId: 'project-plans',
    tags: ['api', 'documentation', 'technical'],
    isStarred: true,
    lastModified: '1 week ago',
    wordCount: 178,
    createdAt: '2025-09-18T09:10:00.000Z',
    updatedAt: '2025-09-28T13:55:00.000Z'
  }
];
