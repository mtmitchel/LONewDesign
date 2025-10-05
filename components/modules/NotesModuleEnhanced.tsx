"use client";

import React, { useState } from 'react';
import { 
  FileText, Plus, Search, MoreHorizontal, Folder, FolderPlus,
  Bold, Italic, Underline, Strikethrough, Code, Palette, Highlighter,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Indent, Outdent,
  Link, Image, Undo, Redo, ChevronDown, Type, Minus, Hash,
  List, ListOrdered, CheckSquare, Quote, ToggleLeft, Table,
  Video, Music, File, Smile, Settings, Download, Move,
  Trash, Edit, X, Star, Archive, Tag, Copy
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '../ui/dropdown-menu';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator
} from '../ui/context-menu';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { EmptyState } from '../extended';

interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
  tags: string[];
  isStarred: boolean;
  lastModified: string;
  wordCount: number;
}

interface NoteFolder {
  id: string;
  name: string;
  parentId?: string;
  noteCount: number;
}

const mockFolders: NoteFolder[] = [
  { id: 'inbox', name: 'Inbox', noteCount: 12 },
  { id: 'work', name: 'Work Projects', noteCount: 8 },
  { id: 'personal', name: 'Personal', noteCount: 5 },
  { id: 'research', name: 'Research', noteCount: 15 },
  { id: 'meeting-notes', name: 'Meeting Notes', parentId: 'work', noteCount: 6 },
  { id: 'project-plans', name: 'Project Plans', parentId: 'work', noteCount: 4 }
];

const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Project Planning Session Notes',
    content: 'Today we discussed the Q4 roadmap and identified key priorities...',
    folderId: 'work',
    tags: ['planning', 'q4', 'roadmap'],
    isStarred: true,
    lastModified: '2 hours ago',
    wordCount: 325
  },
  {
    id: '2',
    title: 'Design System Research',
    content: 'Researching modern design systems and component libraries...',
    folderId: 'research',
    tags: ['design', 'ui', 'components'],
    isStarred: false,
    lastModified: '1 day ago',
    wordCount: 156
  },
  {
    id: '3',
    title: 'Weekly Review Template',
    content: 'A template for conducting effective weekly reviews...',
    folderId: 'personal',
    tags: ['template', 'productivity', 'review'],
    isStarred: true,
    lastModified: '3 days ago',
    wordCount: 89
  }
];

export function NotesModuleEnhanced() {
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedNote, setSelectedNote] = useState<Note | null>(mockNotes[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [editorContent, setEditorContent] = useState(selectedNote?.content || '');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);

  const toolbarButtons = [
    { group: 'history', items: [
      { icon: Undo, label: 'Undo', action: 'undo' },
      { icon: Redo, label: 'Redo', action: 'redo' }
    ]},
    { group: 'style', items: [
      { icon: Type, label: 'Text Style', action: 'style', isDropdown: true },
      { icon: Minus, label: 'Decrease Font Size', action: 'font-decrease' },
      { icon: Plus, label: 'Increase Font Size', action: 'font-increase' }
    ]},
    { group: 'format', items: [
      { icon: Bold, label: 'Bold', action: 'bold' },
      { icon: Italic, label: 'Italic', action: 'italic' },
      { icon: Underline, label: 'Underline', action: 'underline' },
      { icon: Strikethrough, label: 'Strikethrough', action: 'strikethrough' },
      { icon: Code, label: 'Inline Code', action: 'code' }
    ]},
    { group: 'color', items: [
      { icon: Palette, label: 'Text Color', action: 'text-color', isDropdown: true },
      { icon: Highlighter, label: 'Highlight', action: 'highlight', isDropdown: true }
    ]},
    { group: 'align', items: [
      { icon: AlignLeft, label: 'Align Left', action: 'align-left' },
      { icon: AlignCenter, label: 'Align Center', action: 'align-center' },
      { icon: AlignRight, label: 'Align Right', action: 'align-right' },
      { icon: AlignJustify, label: 'Justify', action: 'align-justify' }
    ]},
    { group: 'indent', items: [
      { icon: Outdent, label: 'Decrease Indent', action: 'outdent' },
      { icon: Indent, label: 'Increase Indent', action: 'indent' }
    ]},
    { group: 'insert', items: [
      { icon: Link, label: 'Insert Link', action: 'link' },
      { icon: Image, label: 'Insert Image', action: 'image' }
    ]}
  ];

  const slashMenuItems = [
    {
      category: 'Headings',
      items: [
        { icon: Hash, label: 'Heading 1', action: 'h1' },
        { icon: Hash, label: 'Heading 2', action: 'h2' },
        { icon: Hash, label: 'Heading 3', action: 'h3' }
      ]
    },
    {
      category: 'Basic Blocks',
      items: [
        { icon: Quote, label: 'Quote', action: 'quote' },
        { icon: ToggleLeft, label: 'Toggle List', action: 'toggle' },
        { icon: ListOrdered, label: 'Numbered List', action: 'ol' },
        { icon: List, label: 'Bullet List', action: 'ul' },
        { icon: CheckSquare, label: 'Check List', action: 'checklist' },
        { icon: FileText, label: 'Paragraph', action: 'paragraph' },
        { icon: Code, label: 'Code Block', action: 'code-block' }
      ]
    },
    {
      category: 'Advanced',
      items: [
        { icon: Table, label: 'Table', action: 'table' }
      ]
    },
    {
      category: 'Media',
      items: [
        { icon: Image, label: 'Image', action: 'image' },
        { icon: Video, label: 'Video', action: 'video' },
        { icon: Music, label: 'Audio', action: 'audio' },
        { icon: File, label: 'File', action: 'file' }
      ]
    },
    {
      category: 'Subheadings',
      items: [
        { icon: ToggleLeft, label: 'Toggle Heading 1', action: 'toggle-h1' },
        { icon: ToggleLeft, label: 'Toggle Heading 2', action: 'toggle-h2' },
        { icon: ToggleLeft, label: 'Toggle Heading 3', action: 'toggle-h3' }
      ]
    },
    {
      category: 'Other',
      items: [
        { icon: Smile, label: 'Emoji', action: 'emoji' }
      ]
    }
  ];

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setEditorContent(content);
    
    // Check for slash command
    const cursorPos = e.target.selectionStart;
    const textBefore = content.slice(0, cursorPos);
    const lastSlash = textBefore.lastIndexOf('/');
    
    if (lastSlash !== -1 && cursorPos - lastSlash < 20) {
      const rect = e.target.getBoundingClientRect();
      setCursorPosition({ x: rect.left, y: rect.top + 100 });
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }
  };

  const filteredNotes = mockNotes.filter(note => 
    note.folderId === selectedFolder &&
    (note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
     note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="h-full flex">
      {/* Folders Pane */}
      <div className="w-64 bg-[var(--surface)] border-r border-[var(--border-subtle)] flex flex-col">
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Notes</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                  <Plus size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <FileText className="w-4 h-4 mr-2" />
                  New Note
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowNewFolderDialog(true)}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {mockFolders.map((folder) => (
              <ContextMenu key={folder.id}>
                <ContextMenuTrigger>
                  <div
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-[var(--primary-tint-10)]/30 ${
                      selectedFolder === folder.id ? 'bg-[var(--primary-tint-10)] text-[var(--primary)]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder size={16} />
                      <span className="text-sm">{folder.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {folder.noteCount}
                    </Badge>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>
                    <Edit className="w-4 h-4 mr-2" />
                    Rename
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => setShowMoveDialog(true)}>
                    <Move className="w-4 h-4 mr-2" />
                    Move To
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Export as PDF
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Export as Word
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <Copy className="w-4 h-4 mr-2" />
                    Export as Text
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem className="text-[var(--error)]">
                    <Trash className="w-4 h-4 mr-2" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </div>
      </div>

      {/* Notes List Pane */}
      <div className="w-80 bg-[var(--surface)] border-r border-[var(--border-subtle)] flex flex-col">
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {mockFolders.find(f => f.id === selectedFolder)?.name || 'Notes'}
            </h3>
            <Button size="sm" className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
              <Plus size={14} className="mr-1" />
              New Note
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.map((note) => (
            <ContextMenu key={note.id}>
              <ContextMenuTrigger>
                <div
                  onClick={() => setSelectedNote(note)}
                  className={`p-4 border-b border-[var(--border-subtle)] cursor-pointer transition-colors hover:bg-[var(--primary-tint-10)]/30 ${
                    selectedNote?.id === note.id ? 'bg-[var(--primary-tint-10)] border-l-2 border-l-[var(--primary)]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium line-clamp-1">{note.title}</h4>
                      {note.isStarred && (
                        <Star size={12} className="text-yellow-500 fill-current" />
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal size={12} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Move className="w-4 h-4 mr-2" />
                          Move To
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Export as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Export as Word
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          Export as Text
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-[var(--error)]">
                          <Trash className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-2">
                    {note.content}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 flex-wrap">
                      {note.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {note.tags.length > 2 && (
                        <span className="text-xs text-[var(--text-secondary)]">
                          +{note.tags.length - 2}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {note.wordCount} words • {note.lastModified}
                    </div>
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem>
                  <Edit className="w-4 h-4 mr-2" />
                  Rename
                </ContextMenuItem>
                <ContextMenuItem>
                  <Move className="w-4 h-4 mr-2" />
                  Move To
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export as PDF
                </ContextMenuItem>
                <ContextMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export as Word
                </ContextMenuItem>
                <ContextMenuItem>
                  <Copy className="w-4 h-4 mr-2" />
                  Export as Text
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem className="text-[var(--error)]">
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      </div>

      {/* Editor Pane */}
      <div className="flex-1 bg-[var(--surface)] flex flex-col">
        {selectedNote ? (
          <>
            {/* Editor Header */}
            <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--elevated)]">
              <Input
                value={selectedNote.title}
                onChange={(e) => {
                  // Update the selected note title
                  setSelectedNote(prev => prev ? {...prev, title: e.target.value} : null);
                }}
                className="text-lg font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0"
                placeholder="Untitled Note"
              />
            </div>

            {/* Toolbar */}
            <div className="p-2 border-b border-[var(--border-subtle)] bg-[var(--elevated)]">
              <div className="flex items-center gap-1 flex-wrap">
                {toolbarButtons.map((group, groupIndex) => (
                  <React.Fragment key={group.group}>
                    {groupIndex > 0 && <Separator orientation="vertical" className="h-6 mx-1" />}
                    {group.items.map((item) => (
                      <div key={item.action} className="relative">
                        {item.isDropdown ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <item.icon size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {item.action === 'style' && (
                                <>
                                  <DropdownMenuItem>Normal Text</DropdownMenuItem>
                                  <DropdownMenuItem>Heading 1</DropdownMenuItem>
                                  <DropdownMenuItem>Heading 2</DropdownMenuItem>
                                  <DropdownMenuItem>Heading 3</DropdownMenuItem>
                                </>
                              )}
                              {(item.action === 'text-color' || item.action === 'highlight') && (
                                <>
                                  <DropdownMenuItem>Black</DropdownMenuItem>
                                  <DropdownMenuItem>Red</DropdownMenuItem>
                                  <DropdownMenuItem>Blue</DropdownMenuItem>
                                  <DropdownMenuItem>Green</DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            title={item.label}
                          >
                            <item.icon size={14} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 relative">
              <Textarea
                value={editorContent}
                onChange={handleEditorChange}
                placeholder="Start writing..."
                className="w-full h-full resize-none border-none bg-transparent p-6 text-base leading-relaxed focus-visible:ring-0"
              />
              
              {/* Slash Menu */}
              {showSlashMenu && (
                <Card 
                  className="absolute z-50 w-80 max-h-96 overflow-y-auto shadow-lg"
                  style={{ 
                    left: cursorPosition.x, 
                    top: cursorPosition.y 
                  }}
                >
                  <div className="p-2">
                    {slashMenuItems.map((category) => (
                      <div key={category.category} className="mb-4">
                        <div className="text-xs font-medium text-[var(--text-secondary)] mb-2 px-2">
                          {category.category}
                        </div>
                        <div className="space-y-1">
                          {category.items.map((item) => (
                            <button
                              key={item.action}
                              onClick={() => {
                                setShowSlashMenu(false);
                                // Handle slash command insertion
                              }}
                              className="w-full flex items-center gap-3 p-2 text-sm hover:bg-[var(--primary-tint-10)] rounded transition-colors"
                            >
                              <item.icon size={16} className="text-[var(--text-secondary)]" />
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText size={48} className="text-[var(--text-secondary)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">Select a note to start editing</p>
            </div>
          </div>
        )}
      </div>

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input id="folder-name" placeholder="Enter folder name..." />
              </div>
              <div>
                <Label htmlFor="parent-folder">Parent Folder</Label>
                <select id="parent-folder" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Root</option>
                  {mockFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                  Cancel
                </Button>
                <Button className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
                  Create Folder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}