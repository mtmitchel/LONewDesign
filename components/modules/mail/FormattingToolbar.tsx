import * as React from "react";
import {
  Undo2, Redo2, Type, Bold, Italic, Underline, Link, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Quote, Strikethrough, Highlighter,
  Image, Paperclip, MoreHorizontal
} from "lucide-react";
import { Button } from "../../ui/button";

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

      <Button variant="ghost" size="compact" title="Font"><Type className="h-4 w-4"/></Button>
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

      <Button variant="ghost" size="compact" title="More"><MoreHorizontal className="h-4 w-4"/></Button>
    </div>
  );
}
