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

type Density = "comfortable" | "compact";

type Props = {
  onCommand: (cmd: string) => void; // wire this to your editor
  density?: Density;
  className?: string;
};

export function FormattingToolbar({ onCommand, density = "comfortable", className }: Props) {
  const isCompact = density === "compact";
  const iconSize = isCompact ? 16 : 18;
  const buttonSize = isCompact ? "compact" : "compact";
  
  return (
    <div className={[
      "flex items-center overflow-x-auto bg-[var(--bg-surface-elevated)]",
      isCompact
        ? "h-[var(--toolbar-h)] px-[var(--toolbar-pad-x)] py-[var(--toolbar-pad-y)] gap-[var(--toolbar-gap)]"
        : "h-[40px] px-[var(--space-3)] py-[var(--space-2)] gap-[var(--space-3)] rounded-[var(--radius-full)]",
      className,
    ].filter(Boolean).join(" ")}
    role="toolbar"
    >
      <Button variant="ghost" size={buttonSize} title="Undo" onClick={() => onCommand("undo")}>
        <Undo2 style={{ width: iconSize, height: iconSize }} />
      </Button>
      <Button variant="ghost" size={buttonSize} title="Redo" onClick={() => onCommand("redo")}>
        <Redo2 style={{ width: iconSize, height: iconSize }} />
      </Button>

      <div className="w-px h-4 bg-[var(--border-subtle)] mx-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size={buttonSize} title="Font family">
            <Type style={{ width: iconSize, height: iconSize }} />
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
      <Button variant="ghost" size={buttonSize} title="Bold" onClick={() => onCommand("bold")}>
        <Bold style={{ width: iconSize, height: iconSize }} />
      </Button>
      <Button variant="ghost" size={buttonSize} title="Italic" onClick={() => onCommand("italic")}>
        <Italic style={{ width: iconSize, height: iconSize }} />
      </Button>
      <Button variant="ghost" size={buttonSize} title="Underline" onClick={() => onCommand("underline")}>
        <Underline style={{ width: iconSize, height: iconSize }} />
      </Button>
      <Button variant="ghost" size={buttonSize} title="Strikethrough" onClick={() => onCommand("strike")}>
        <Strikethrough style={{ width: iconSize, height: iconSize }} />
      </Button>
      <Button variant="ghost" size={buttonSize} title="Text color">
        <Highlighter style={{ width: iconSize, height: iconSize }} />
      </Button>

      <div className="w-px h-4 bg-[var(--border-subtle)] mx-1" />

      <Button variant="ghost" size={buttonSize} title="Align left" onClick={() => onCommand("align-left")}>
        <AlignLeft style={{ width: iconSize, height: iconSize }} />
      </Button>
      <Button variant="ghost" size={buttonSize} title="Align center" onClick={() => onCommand("align-center")}>
        <AlignCenter style={{ width: iconSize, height: iconSize }} />
      </Button>
      <Button variant="ghost" size={buttonSize} title="Align right" onClick={() => onCommand("align-right")}>
        <AlignRight style={{ width: iconSize, height: iconSize }} />
      </Button>

      <div className="w-px h-4 bg-[var(--border-subtle)] mx-1" />

      <Button variant="ghost" size={buttonSize} title="Bulleted list" onClick={() => onCommand("ul")}>
        <List style={{ width: iconSize, height: iconSize }} />
      </Button>
      <Button variant="ghost" size={buttonSize} title="Numbered list" onClick={() => onCommand("ol")}>
        <ListOrdered style={{ width: iconSize, height: iconSize }} />
      </Button>
      <Button variant="ghost" size={buttonSize} title="Quote" onClick={() => onCommand("quote")}>
        <Quote style={{ width: iconSize, height: iconSize }} />
      </Button>
      <Button variant="ghost" size={buttonSize} title="Insert link" onClick={() => onCommand("link")}>
        <Link style={{ width: iconSize, height: iconSize }} />
      </Button>
      <Button variant="ghost" size={buttonSize} title="Attach file">
        <Paperclip style={{ width: iconSize, height: iconSize }} />
      </Button>
      <Button variant="ghost" size={buttonSize} title="Insert image">
        <Image style={{ width: iconSize, height: iconSize }} />
      </Button>

      <div className="w-px h-4 bg-[var(--border-subtle)] mx-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size={buttonSize} title="More formatting options">
            <MoreHorizontal style={{ width: iconSize, height: iconSize }} />
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
