import React, { useState } from 'react';
import {
  Send,
  ChevronDown,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  Smile,
  Paperclip,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Trash,
  MoreHorizontal,
  Type,
  Palette
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { ComposeEditorCommands } from './types';

interface ComposeToolbarProps {
  canSend: boolean;
  onSend: () => void;
  onDiscard: () => void;
  editorCommands: ComposeEditorCommands;
}

const FONT_FAMILIES = [
  { label: 'Sans Serif', value: 'Arial, sans-serif' },
  { label: 'Serif', value: 'Times New Roman, serif' },
  { label: 'Monospace', value: 'Courier New, monospace' }
];

const FONT_SIZES = [
  { label: 'Small', value: 'Small' },
  { label: 'Normal', value: 'Normal' },
  { label: 'Large', value: 'Large' },
  { label: 'Huge', value: 'Huge' }
];

const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#cccccc', '#ffffff',
  '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff',
  '#9900ff', '#ff00ff', '#ff9999', '#ffcc99', '#ffff99', '#99ff99',
  '#99ffff', '#9999ff', '#cc99ff', '#ff99ff'
];

export function ComposeToolbar({ canSend, onSend, onDiscard, editorCommands }: ComposeToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleSendClick = () => {
    if (canSend) onSend();
  };

  const handleColorSelect = (color: string) => {
    editorCommands.applyColor(color);
    setShowColorPicker(false);
  };

  const handleInsertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const text = prompt('Enter link text (optional):') || url;
      editorCommands.insertLink(url, text);
    }
  };

  const handleInsertImage = () => {
    const src = prompt('Enter image URL:');
    if (src) {
      const alt = prompt('Enter alt text (optional):') || '';
      editorCommands.insertImage(src, alt);
    }
  };

  const handleAttachFile = () => {
    // TODO: wire up file picker
    console.log('Attach file');
  };

  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-[var(--space-3)] py-[var(--space-3)] space-y-[var(--space-3)] overflow-x-hidden" role="contentinfo">
      <div className="flex flex-col gap-2">
        {/* A) Formatting Bar (rounded pill) */}
        <div className="h-9 rounded-[var(--radius-full)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-[var(--space-2)] flex items-center gap-[var(--space-1)] shadow-[var(--elevation-sm)] overflow-x-auto hide-scrollbar">
          {/* Undo/Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Undo (Ctrl+Z)" onClick={editorCommands.undo}>
                <Undo className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Redo (Ctrl+Shift+Z)" onClick={editorCommands.redo}>
                <Redo className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          {/* Font controls */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2">
                <Type className="w-4 h-4 mr-1" />
                Sans Serif
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {FONT_FAMILIES.map((font) => (
                <DropdownMenuItem key={font.value} onClick={() => editorCommands.setFontFamily(font.value)} style={{ fontFamily: font.value }}>
                  {font.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2">
                Normal
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {FONT_SIZES.map((size) => (
                <DropdownMenuItem key={size.value} onClick={() => editorCommands.setFontSize(size.value)}>
                  {size.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6" />

          {/* B/I/U + Color */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Bold (Ctrl+B)" onClick={editorCommands.toggleBold}>
                <Bold className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold (Ctrl+B)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Italic (Ctrl+I)" onClick={editorCommands.toggleItalic}>
                <Italic className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic (Ctrl+I)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Underline (Ctrl+U)" onClick={editorCommands.toggleUnderline}>
                <Underline className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Underline (Ctrl+U)</TooltipContent>
          </Tooltip>

          <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
            <PopoverTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Text color">
                    <Palette className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Text color</TooltipContent>
              </Tooltip>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-6 gap-1">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignments/Lists/Quote */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Align left" onClick={editorCommands.alignLeft}>
                <AlignLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align left</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Align center" onClick={editorCommands.alignCenter}>
                <AlignCenter className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align center</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Align right" onClick={editorCommands.alignRight}>
                <AlignRight className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align right</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Numbered list" onClick={editorCommands.insertOrderedList}>
                <ListOrdered className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Numbered list</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Bulleted list" onClick={editorCommands.insertUnorderedList}>
                <List className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bulleted list</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Quote" onClick={editorCommands.insertQuote}>
                <Quote className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Quote</TooltipContent>
          </Tooltip>

          <div className="ml-auto" />
        </div>

        {/* B) Utility Row (Send + quick actions) */}
        <div className="h-10 flex items-center justify-between">
          {/* Send + attachment icons group */}
          <div className="flex items-center gap-[var(--space-2)]">
            <Button data-compose-send onClick={handleSendClick} disabled={!canSend} className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4" aria-label="Send email (Ctrl+Enter)">
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="px-1 h-9" disabled={!canSend} aria-label="Send options">
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={handleSendClick}>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Schedule send')}>
                  Schedule send
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Attach file" onClick={handleAttachFile}>
                  <Paperclip className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Insert link" onClick={handleInsertLink}>
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert link</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Insert emoji" onClick={() => console.log('Insert emoji')}>
                  <Smile className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert emoji</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Insert image" onClick={handleInsertImage}>
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert image</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-[var(--space-2)]">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-[var(--text-secondary)] hover:text-[var(--danger)]" onClick={onDiscard} aria-label="Discard">
                  <Trash className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Discard</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="More options">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>More options</TooltipContent>
                </Tooltip>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => console.log('Save draft')}>Save draft</DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Print')}>Print</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => console.log('Settings')}>Settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </footer>
  );
}
