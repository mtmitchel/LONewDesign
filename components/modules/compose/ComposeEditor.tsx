import React, { useRef, useCallback, useEffect } from 'react';
import DOMPurify, { type Config as DOMPurifyConfig } from 'dompurify';
import { ComposeEditorCommands } from './types';

type ExtendedDOMPurifyConfig = DOMPurifyConfig & {
  ALLOWED_STYLES?: Record<string, string[]>;
};

const BASE_ALLOWED_STYLES: Record<string, string[]> = {
  '*': [
    'color',
    'background-color',
    'font-weight',
    'font-style',
    'text-decoration',
    'text-align',
    'font-family',
    'font-size'
  ]
};

const INPUT_SANITIZE_CONFIG: ExtendedDOMPurifyConfig = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'div',
    'span',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'img'
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'data-*', 'class'],
  ALLOWED_STYLES: BASE_ALLOWED_STYLES
};

const PASTE_SANITIZE_CONFIG: ExtendedDOMPurifyConfig = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'div',
    'span',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a'
  ],
  ALLOWED_ATTR: ['href', 'style'],
  ALLOWED_STYLES: BASE_ALLOWED_STYLES
};

interface ComposeEditorProps {
  html: string;
  onUpdateHtml: (html: string) => void;
  placeholder?: string;
  commands?: ComposeEditorCommands;
}

export function ComposeEditor({
  html,
  onUpdateHtml,
  placeholder = '',
  commands
}: ComposeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html;
    }
  }, [html]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      // Sanitize content on input
      const sanitized = DOMPurify.sanitize(newHtml, INPUT_SANITIZE_CONFIG);
      onUpdateHtml(sanitized);
    }
  }, [onUpdateHtml]);

  // Handle paste events
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // Get pasted content
    const pastedData = e.clipboardData.getData('text/html') || 
                      e.clipboardData.getData('text/plain');
    
    if (pastedData) {
      // Sanitize pasted content
      const sanitized = DOMPurify.sanitize(pastedData, PASTE_SANITIZE_CONFIG);
      
      // Insert at cursor position
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sanitized;
        
        while (tempDiv.firstChild) {
          range.insertNode(tempDiv.firstChild);
        }
        
        // Update content
        handleInput();
      }
    }
  }, [handleInput]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
    
    if (ctrlOrCmd && commands) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          commands.toggleBold();
          break;
        case 'i':
          e.preventDefault();
          commands.toggleItalic();
          break;
        case 'u':
          e.preventDefault();
          commands.toggleUnderline();
          break;
        case 'k':
          e.preventDefault();
          const url = prompt('Enter URL:');
          if (url) {
            commands.insertLink(url);
          }
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            commands.redo();
          } else {
            commands.undo();
          }
          break;
        case 'enter':
          // Ctrl/Cmd + Enter to send
          e.preventDefault();
          // This will be handled by the parent component's send action
          const sendButton = document.querySelector('[data-compose-send]') as HTMLButtonElement;
          sendButton?.click();
          break;
      }
    }
  }, [commands]);

  // Expose commands to parent component
  useEffect(() => {
    if (commands && editorRef.current) {
      const editor = editorRef.current;
      
      // Basic formatting commands
      commands.toggleBold = () => {
        document.execCommand('bold', false);
        handleInput();
      };
      
      commands.toggleItalic = () => {
        document.execCommand('italic', false);
        handleInput();
      };
      
      commands.toggleUnderline = () => {
        document.execCommand('underline', false);
        handleInput();
      };
      
      commands.applyColor = (color: string) => {
        document.execCommand('foreColor', false, color);
        handleInput();
      };
      
      commands.insertLink = (url: string, text?: string) => {
        if (text) {
          document.execCommand('insertHTML', false, `<a href="${url}">${text}</a>`);
        } else {
          document.execCommand('createLink', false, url);
        }
        handleInput();
      };
      
      commands.undo = () => {
        document.execCommand('undo', false);
        handleInput();
      };
      
      commands.redo = () => {
        document.execCommand('redo', false);
        handleInput();
      };
      
      commands.setFontFamily = (family: string) => {
        document.execCommand('fontName', false, family);
        handleInput();
      };
      
      commands.setFontSize = (size: string) => {
        const sizeMap: Record<string, string> = {
          'Small': '1',
          'Normal': '3',
          'Large': '5',
          'Huge': '7'
        };
        document.execCommand('fontSize', false, sizeMap[size] || '3');
        handleInput();
      };
      
      commands.alignLeft = () => {
        document.execCommand('justifyLeft', false);
        handleInput();
      };
      
      commands.alignCenter = () => {
        document.execCommand('justifyCenter', false);
        handleInput();
      };
      
      commands.alignRight = () => {
        document.execCommand('justifyRight', false);
        handleInput();
      };
      
      commands.insertOrderedList = () => {
        document.execCommand('insertOrderedList', false);
        handleInput();
      };
      
      commands.insertUnorderedList = () => {
        document.execCommand('insertUnorderedList', false);
        handleInput();
      };
      
      commands.insertQuote = () => {
        document.execCommand('formatBlock', false, 'blockquote');
        handleInput();
      };
    }
  }, [commands, handleInput]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div 
        ref={editorRef}
        data-compose-editor
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        className="
          flex-1 overflow-auto overflow-x-hidden outline-none min-w-0
          px-[var(--space-4)] py-[var(--space-3)]
          text-[color:var(--text-primary)] text-base leading-relaxed break-words
          prose prose-sm max-w-none focus:outline-none
        "
        style={{
          minHeight: 'var(--compose-editor-min-height)'
        }}
        role="textbox"
        aria-label="Email message content"
        aria-multiline="true"
        data-placeholder={placeholder}
      />
    </div>
  );
}