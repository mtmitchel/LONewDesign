"use client";

import React from 'react';
import { Plus } from 'lucide-react';
import { TriPane } from '../TriPane';
import { PaneHeader } from '../layout/PaneHeader';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

import {
  NotesLeftPane,
  NotesCenterPane,
  NotesEditor,
  NotesContextPanel,
  type Note,
  type NoteFolder,
  type NotesSettings,
  DEFAULT_NOTES_SETTINGS,
  mockFolders,
  mockNotes,
} from './notes';

export function NotesModule() {
  // State management for folders, notes, selections, search, and settings
  const [folders] = React.useState<NoteFolder[]>(() => mockFolders);
  const [notes, setNotes] = React.useState<Note[]>(() => mockNotes);
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(mockFolders[0]?.id ?? null);
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(mockNotes[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [settings, setSettings] = React.useState<NotesSettings>(DEFAULT_NOTES_SETTINGS);
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSavedLabel, setLastSavedLabel] = React.useState<string | undefined>(undefined);

  const selectedNote = React.useMemo(() => notes.find(n => n.id === selectedNoteId) ?? null, [notes, selectedNoteId]);

  const applySort = React.useCallback((arr: Note[]): Note[] => {
    const sorted = [...arr];
    const { sortBy, sortOrder } = settings;
    const dir = sortOrder === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      if (sortBy === 'modified') {
        const ad = a.updatedAt || a.createdAt || '';
        const bd = b.updatedAt || b.createdAt || '';
        return (new Date(ad).getTime() - new Date(bd).getTime()) * dir;
      }
      if (sortBy === 'created') {
        const ad = a.createdAt || '';
        const bd = b.createdAt || '';
        return (new Date(ad).getTime() - new Date(bd).getTime()) * dir;
      }
      // title or alphabetical
      return a.title.localeCompare(b.title) * dir;
    });
    return sorted;
  }, [settings]);

  const filteredNotes = React.useMemo(() => {
    const base = notes.filter(n =>
      (selectedFolderId ? n.folderId === selectedFolderId : true) &&
      (
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    );
    return applySort(base);
  }, [notes, selectedFolderId, searchQuery, applySort]);

  const currentFolderName = React.useMemo(
    () => folders.find(f => f.id === selectedFolderId)?.name ?? 'Notes',
    [folders, selectedFolderId]
  );

  // Handlers
  const handleSelectNote = (noteId: string) => setSelectedNoteId(noteId);
  const handleToggleStar = (noteId: string) => {
    setNotes(prev => prev.map(n => (n.id === noteId ? { ...n, isStarred: !n.isStarred } : n)));
  };
  const withSavingTick = () => {
    setIsSaving(true);
    window.setTimeout(() => {
      setIsSaving(false);
      setLastSavedLabel('just now');
    }, 400);
  };
  const handleTitleChange = (value: string) => {
    if (!selectedNoteId) return;
    setNotes(prev => prev.map(n => (n.id === selectedNoteId ? { ...n, title: value, updatedAt: new Date().toISOString() } : n)));
    withSavingTick();
  };
  const handleContentChange = (value: string) => {
    if (!selectedNoteId) return;
    setNotes(prev => prev.map(n => (n.id === selectedNoteId ? { ...n, content: value, updatedAt: new Date().toISOString() } : n)));
    withSavingTick();
  };
  const handleCreateNote = () => {
    const id = String(Date.now());
    const now = new Date().toISOString();
    const folder = selectedFolderId ?? folders[0]?.id ?? 'inbox';
    const newNote: Note = {
      id,
      title: 'Untitled note',
      content: '',
      folderId: folder,
      tags: [],
      isStarred: false,
      lastModified: 'just now',
      wordCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedNoteId(id);
  };
  const handleDuplicate = () => {
    if (!selectedNote) return;
    const id = String(Date.now());
    const now = new Date().toISOString();
    const copy: Note = { ...selectedNote, id, createdAt: now, updatedAt: now, title: `${selectedNote.title} (Copy)` };
    setNotes(prev => [copy, ...prev]);
    setSelectedNoteId(id);
  };
  const handleDelete = () => {
    if (!selectedNote) return;
    setNotes(prev => prev.filter(n => n.id !== selectedNote.id));
    setSelectedNoteId(null);
  };
  const handleTagAdd = (tag: string) => {
    if (!selectedNoteId) return;
    setNotes(prev => prev.map(n => (n.id === selectedNoteId ? { ...n, tags: n.tags.includes(tag) ? n.tags : [...n.tags, tag] } : n)));
  };
  const handleTagRemove = (tag: string) => {
    if (!selectedNoteId) return;
    setNotes(prev => prev.map(n => (n.id === selectedNoteId ? { ...n, tags: n.tags.filter(t => t !== tag) } : n)));
  };

  return (
    <TriPane
      leftWidth="var(--tripane-left-width)"
      rightWidth="var(--tripane-right-width)"
      left={
        <NotesLeftPane
          folders={folders}
          selectedFolderId={selectedFolderId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectFolder={setSelectedFolderId}
        />
      }
      leftHeader={
        <PaneHeader className="px-[var(--space-4)]">
          <div className="flex w-full items-center justify-between">
            <h2 className="text-[var(--text-lg)] font-semibold">Notes</h2>
            <Button size="sm" onClick={handleCreateNote} aria-label="Create new note">
              <Plus size={14} />
            </Button>
          </div>
        </PaneHeader>
      }
      center={
        selectedNote ? (
          <NotesEditor
            title={selectedNote.title}
            content={selectedNote.content}
            onTitleChange={handleTitleChange}
            onContentChange={handleContentChange}
            onToolbarAction={() => {}}
            isSaving={isSaving}
            lastSavedLabel={lastSavedLabel}
            autoSaveEnabled={settings.autoSave}
          />
        ) : (
          <NotesCenterPane
            notes={filteredNotes}
            selectedNoteId={selectedNoteId}
            settings={{
              showPreview: settings.showPreview,
              showWordCount: settings.showWordCount,
              compactView: settings.compactView,
            }}
            onSelectNote={handleSelectNote}
            onToggleStar={handleToggleStar}
            onCreateNote={handleCreateNote}
          />
        )
      }
      centerHeader={
        <PaneHeader className="px-[var(--space-4)]">
          <div className="flex w-full items-center justify-between">
            <h3 className="font-semibold">{currentFolderName}</h3>
            <Button className="bg-[var(--primary)]" onClick={handleCreateNote}>
              <Plus size={14} className="mr-[var(--space-2)]" />
              New Note
            </Button>
          </div>
        </PaneHeader>
      }
      right={
        // Tabbed right panel like Mail RightContextSettings
        <Tabs defaultValue="context" className="flex-1 flex flex-col">
          <div className="px-[var(--space-4)] py-[var(--space-3)] border-b border-[var(--border-subtle)]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="context">Context</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="context" className="flex-1 mt-0">
            <NotesContextPanel
              note={selectedNote}
              folderName={currentFolderName}
              settings={settings}
              isSaving={isSaving}
              lastSavedLabel={lastSavedLabel}
              onSettingsChange={updates => setSettings(prev => ({ ...prev, ...updates }))}
              onTagAdd={handleTagAdd}
              onTagRemove={handleTagRemove}
              onToggleStar={() => selectedNoteId && handleToggleStar(selectedNoteId)}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              showSections={{ details: true, tags: true, view: false, sort: false, actions: true, footer: true }}
            />
          </TabsContent>
          <TabsContent value="settings" className="flex-1 mt-0">
            <NotesContextPanel
              note={selectedNote}
              folderName={currentFolderName}
              settings={settings}
              isSaving={isSaving}
              lastSavedLabel={lastSavedLabel}
              onSettingsChange={updates => setSettings(prev => ({ ...prev, ...updates }))}
              onTagAdd={handleTagAdd}
              onTagRemove={handleTagRemove}
              onToggleStar={() => selectedNoteId && handleToggleStar(selectedNoteId)}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              showSections={{ details: false, tags: false, view: true, sort: true, actions: false, footer: true }}
            />
          </TabsContent>
        </Tabs>
        />
      }
      rightHeader={
        <PaneHeader className="px-[var(--space-4)]">
          <h3 className="font-semibold">Details</h3>
        </PaneHeader>
      }
    />
  );
}
