import React, { useState } from 'react';
import { 
  Plus, Search, MoreHorizontal, FileText, PanelRightClose, PanelRightOpen,
  Calendar, User, Tag, Link, Share, Download, Copy
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  tags?: string[];
}

const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Project Meeting Notes',
    content: 'Discussed the upcoming product launch timeline and key milestones. Next steps:\n\n- Finalize design mockups by Friday\n- Set up development environment\n- Schedule client review session\n\nImportant considerations:\n- Budget constraints for Q4\n- Resource allocation for marketing team\n- Risk assessment for delivery timeline',
    lastModified: 'Today, 2:30 PM',
    tags: ['project', 'meeting']
  },
  {
    id: '2',
    title: 'Research Ideas',
    content: 'Collection of research topics for the next quarter:\n\n1. User behavior analysis\n2. Competitor feature comparison\n3. Market trends in productivity tools\n4. Customer feedback synthesis\n\nResources to explore:\n- Industry reports\n- User interview transcripts\n- Analytics data\n- Support ticket patterns',
    lastModified: 'Yesterday, 4:15 PM',
    tags: ['research', 'planning']
  },
  {
    id: '3',
    title: 'Design System Guidelines',
    content: 'Core principles for our design system:\n\n**Typography**\n- Use Inter font family\n- Maintain consistent line heights\n- Follow 8pt spacing grid\n\n**Colors**\n- Primary: Soft lilac for actions\n- Status colors: Green, amber, red, blue\n- Text: High contrast for accessibility\n\n**Components**\n- 8px border radius for cards\n- Subtle shadows for elevation\n- Generous padding for breathing room',
    lastModified: '2 days ago',
    tags: ['design', 'documentation']
  }
];

export function NotesModule() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(mockNotes[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [noteContent, setNoteContent] = useState(selectedNote?.content || '');
  const [contextPanelOpen, setContextPanelOpen] = useState(true);

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    setNoteContent(note.content);
  };

  return (
    <div className="h-full flex">
      {/* Notes List Pane */}
      <div className="w-80 bg-[var(--surface)] border-r border-[var(--border-subtle)] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--elevated)] sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notes</h2>
            <Button size="sm" className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
              <Plus size={16} />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[var(--input-background)] border-[var(--border-default)]"
            />
          </div>
        </div>
        
        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {mockNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => handleNoteSelect(note)}
              className={`p-4 border-b border-[var(--border-subtle)] cursor-pointer transition-colors hover:bg-[var(--primary-tint-10)]/30 ${
                selectedNote?.id === note.id ? 'bg-[var(--primary-tint-10)] border-l-2 border-l-[var(--primary)]' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-[var(--text-primary)] line-clamp-1">
                  {note.title}
                </h4>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                  <MoreHorizontal size={14} />
                </Button>
              </div>
              <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-2">
                {note.content}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">{note.lastModified}</span>
                {note.tags && (
                  <div className="flex gap-1">
                    {note.tags.slice(0, 2).map((tag) => (
                      <span 
                        key={tag}
                        className="text-xs bg-[var(--primary-tint-15)] text-[var(--primary)] px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note Editor Pane */}
      <div className="flex-1 bg-[var(--surface)] flex flex-col">
        {selectedNote ? (
          <>
            {/* Editor Header */}
            <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--elevated)] sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-[var(--text-primary)]">{selectedNote.title}</h1>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Last modified: {selectedNote.lastModified}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setContextPanelOpen(!contextPanelOpen)}>
                    {contextPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal size={16} />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Editor */}
            <div className="flex-1 p-6">
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full h-full min-h-[400px] resize-none border-none bg-transparent text-[var(--text-primary)] leading-relaxed"
                placeholder="Start writing your note..."
              />
            </div>
            
            {/* Editor Footer */}
            <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--elevated)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                  <span>{noteContent.length} characters</span>
                  <span>{noteContent.split('\n').length} lines</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline">
                    Export
                  </Button>
                  <Button className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText size={64} className="mx-auto text-[var(--text-secondary)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Select a note to edit</h3>
              <p className="text-[var(--text-secondary)]">Choose a note from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* Context Panel */}
      {contextPanelOpen && selectedNote && (
        <div className="w-80 bg-[var(--elevated)] border-l border-[var(--border-subtle)] flex flex-col">
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-primary)]">Note Details</h3>
              <Button variant="ghost" size="sm" onClick={() => setContextPanelOpen(false)}>
                <PanelRightClose size={16} />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Note Metadata */}
            <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
              <h4 className="font-medium text-[var(--text-primary)] mb-3">Metadata</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-[var(--text-secondary)]" />
                  <div>
                    <p className="text-[var(--text-primary)]">Created</p>
                    <p className="text-[var(--text-secondary)]">Oct 1, 2024</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-[var(--text-secondary)]" />
                  <div>
                    <p className="text-[var(--text-primary)]">Author</p>
                    <p className="text-[var(--text-secondary)]">You</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText size={14} className="text-[var(--text-secondary)]" />
                  <div>
                    <p className="text-[var(--text-primary)]">Word count</p>
                    <p className="text-[var(--text-secondary)]">{noteContent.split(' ').length} words</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
              <h4 className="font-medium text-[var(--text-primary)] mb-3">Tags</h4>
              {selectedNote.tags && selectedNote.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedNote.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="px-3 py-1 bg-[var(--primary-tint-15)] text-[var(--primary)] rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">No tags added</p>
              )}
              <Button variant="outline" size="sm" className="w-full mt-3">
                <Tag size={14} className="mr-2" />
                Add tag
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
              <h4 className="font-medium text-[var(--text-primary)] mb-3">Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Copy size={14} className="mr-2" />
                  Copy note
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Share size={14} className="mr-2" />
                  Share note
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Download size={14} className="mr-2" />
                  Export as PDF
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Link size={14} className="mr-2" />
                  Create link
                </Button>
              </div>
            </div>

            {/* Related Notes */}
            <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
              <h4 className="font-medium text-[var(--text-primary)] mb-3">Related Notes</h4>
              <div className="space-y-3">
                <div className="p-2 rounded hover:bg-[var(--primary-tint-10)]/30 cursor-pointer">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Research Ideas</p>
                  <p className="text-xs text-[var(--text-secondary)]">Similar tags: research, planning</p>
                </div>
                <div className="p-2 rounded hover:bg-[var(--primary-tint-10)]/30 cursor-pointer">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Design System Guidelines</p>
                  <p className="text-xs text-[var(--text-secondary)]">Related content</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}