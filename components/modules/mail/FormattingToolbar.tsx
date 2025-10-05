import * as React from "react";
import {
  Undo2, Redo2, Type, Bold, Italic, Underline, Link, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Quote, Strikethrough, Highlighter,
  Image, Paperclip, MoreHorizontal, Palette, Eraser, Subscript, Superscript
} from "lucide-react";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

type Props = {
  onCommand: (cmd: string) => void; // wire this to your editor
};

export function FormattingToolbar({ onCommand }: Props) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-1 px-2
                    h-[var(--toolbar-h)] bg-[var(--bg-surface-elevated)]
                    rounded-[var(--radius-full)]">
      <Button variant="ghost" size="compact" title="Undo" onClick={() => onCommand("undo")}><Undo2 className="h-4 w-4"/></Button>
      <Button variant="ghost" size="compact" title="Redo" onClick={() => onCommand("redo")}><Redo2 className="h-4 w-4"/></Button>

      <div className="w-px h-4 bg-[var(--border-subtle)] mx-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="compact" title="Font family">
            <Type className="h-4 w-4"/>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem onClick={() => onCommand("font-arial")}>Arial</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand("font-helvetica")}>Helvetica</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand("font-times")}>Times New Roman</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand("font-georgia")}>Georgia</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand("font-courier")}>Courier New</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand("font-verdana")}>Verdana</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="compact" title="Font size" className="px-2 text-xs">
            12
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-20">
          <DropdownMenuItem onClick={() => onCommand("font-size-8")}>8</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand("font-size-10")}>10</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand("font-size-12")}>12</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand("font-size-14")}>14</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand("font-size-16")}>16</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand("font-size-18")}>18</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand("font-size-24")}>24</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="ghost" size="compact" title="Bold" onClick={() => onCommand("bold")}><Bold className="h-4 w-4"/></Button>
      <Button variant="ghost" size="compact" title="Italic" onClick={() => onCommand("italic")}><Italic className="h-4 w-4"/></Button>
      <Button variant="ghost" size="compact" title="Underline" onClick={() => onCommand("underline")}><Underline className="h-4 w-4"/></Button>
      <Button variant="ghost" size="compact" title="Strikethrough" onClick={() => onCommand("strike")}><Strikethrough className="h-4 w-4"/></Button>
      <Button variant="ghost" size="compact" title="Text color"><Highlighter className="h-4 w-4"/></Button>

      <div className="w-px h-4 bg-[var(--border-subtle)] mx-1" />

      <Button variant="ghost" size="compact" title="Align left" onClick={() => onCommand("align-left")}><AlignLeft className="h-4 w-4"/></Button>
      <Button variant="ghost" size="compact" title="Align center" onClick={() => onCommand("align-center")}><AlignCenter className="h-4 w-4"/></Button>
      <Button variant="ghost" size="compact" title="Align right" onClick={() => onCommand("align-right")}><AlignRight className="h-4 w-4"/></Button>

      <div className="w-px h-4 bg-[var(--border-subtle)] mx-1" />

      <Button variant="ghost" size="compact" title="Bulleted list" onClick={() => onCommand("ul")}><List className="h-4 w-4"/></Button>
      <Button variant="ghost" size="compact" title="Numbered list" onClick={() => onCommand("ol")}><ListOrdered className="h-4 w-4"/></Button>
      <Button variant="ghost" size="compact" title="Quote" onClick={() => onCommand("quote")}><Quote className="h-4 w-4"/></Button>
      <Button variant="ghost" size="compact" title="Insert link" onClick={() => onCommand("link")}><Link className="h-4 w-4"/></Button>
      <Button variant="ghost" size="compact" title="Attach file"><Paperclip className="h-4 w-4"/></Button>
      <Button variant="ghost" size="compact" title="Insert image"><Image className="h-4 w-4"/></Button>

      <div className="w-px h-4 bg-[var(--border-subtle)] mx-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="compact" title="More formatting options">
            <MoreHorizontal className="h-4 w-4"/>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onCommand("subscript")}>
            <Subscript className="mr-2 h-4 w-4" />
            Subscript
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand("superscript")}>
            <Superscript className="mr-2 h-4 w-4" />
            Superscript
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onCommand("text-color")}>
            <Palette className="mr-2 h-4 w-4" />
            Text Color
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCommand("background-color")}>
            <Highlighter className="mr-2 h-4 w-4" />
            Highlight Color
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onCommand("clear-formatting")}>
            <Eraser className="mr-2 h-4 w-4" />
            Clear Formatting
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
