import React, { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { EmailChip, RecipientField } from './types';
import { parseEmailInput, getInitials, formatChipLabel } from './utils';

interface ComposeChipsProps {
  field: RecipientField;
  chips: EmailChip[];
  placeholder?: string;
  onChange: (chips: EmailChip[]) => void;
  className?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
}

export function ComposeChips({
  field,
  chips,
  placeholder = 'Enter email addresses',
  onChange,
  className = '',
  autoFocus = false,
  onBlur,
}: ComposeChipsProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [autoFocus]);

  const addChips = useCallback((input: string) => {
    if (!input.trim()) return;
    
    const newChips = parseEmailInput(input);
    if (newChips.length > 0) {
      const existingEmails = new Set(chips.map(chip => chip.email.toLowerCase()));
      const uniqueNewChips = newChips.filter(chip => 
        !existingEmails.has(chip.email.toLowerCase())
      );
      
      if (uniqueNewChips.length > 0) {
        onChange([...chips, ...uniqueNewChips]);
      }
    }
    setInputValue('');
  }, [chips, onChange]);

  const removeChip = useCallback((chipId: string) => {
    onChange(chips.filter(chip => chip.id !== chipId));
  }, [chips, onChange]);

  const handleInputKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
      case ',':
      case ';':
        e.preventDefault();
        addChips(inputValue);
        break;
        
      case 'Backspace':
        if (!inputValue && chips.length > 0) {
          removeChip(chips[chips.length - 1].id);
        }
        break;
        
      case 'Tab':
        if (inputValue.trim()) {
          e.preventDefault();
          addChips(inputValue);
        }
        break;
    }
  }, [inputValue, chips, addChips, removeChip]);

  const handleInputPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const currentInput = inputValue + pastedText;
    
    // Check if pasted text contains separators
    if (/[,;\n]/.test(pastedText)) {
      addChips(currentInput);
    } else {
      setInputValue(currentInput);
    }
  }, [inputValue, addChips]);

  const handleInputBlur = useCallback(() => {
    if (inputValue.trim()) {
      addChips(inputValue);
    }
    onBlur?.();
  }, [inputValue, addChips]);

  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div 
      className={`flex flex-wrap items-center gap-1 min-h-[32px] cursor-text min-w-0 overflow-x-hidden ${className}`}
      onClick={handleContainerClick}
    >
      {/* Render chips */}
      {chips.map((chip) => (
        <div
          key={chip.id}
          className={`
            inline-flex items-center gap-1 px-2 py-1 
            rounded-[var(--radius-pill)] text-sm
            ${chip.valid 
              ? 'bg-[var(--bg-surface-elevated)] text-[color:var(--text-primary)] border border-[var(--border-default)]'
              : 'bg-red-50 text-red-700 border border-red-200'
            }
          `}
        >
          {/* Optional avatar */}
          {chip.label !== chip.email && (
            <div className="w-4 h-4 rounded-full bg-[var(--primary-tint-10)] flex items-center justify-center text-xs text-[color:var(--primary)]">
              {getInitials(chip.label)}
            </div>
          )}
          
          <span className="max-w-[200px] truncate">
            {formatChipLabel(chip)}
          </span>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-4 h-4 p-0 hover:bg-red-100"
                onClick={(e) => {
                  e.stopPropagation();
                  removeChip(chip.id);
                }}
                aria-label={`Remove ${chip.email}`}
              >
                <X className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {chip.valid ? `Remove ${chip.email}` : `Invalid email: ${chip.email}`}
            </TooltipContent>
          </Tooltip>
        </div>
      ))}
      
      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleInputKeyDown}
        onPaste={handleInputPaste}
        onBlur={handleInputBlur}
        placeholder={chips.length === 0 ? placeholder : ''}
        className="
          flex-1 min-w-[120px] bg-transparent outline-none
          text-[color:var(--text-primary)] placeholder:text-[color:var(--text-secondary)]
        "
        aria-label={`${field} recipients`}
        aria-describedby={`${field}-chips-help`}
      />
      
      {/* Screen reader help */}
      <div id={`${field}-chips-help`} className="sr-only">
        Press Enter, comma, or semicolon to add email addresses. 
        Press Backspace to remove the last address.
        {chips.some(chip => !chip.valid) && ' Some email addresses are invalid.'}
      </div>
    </div>
  );
}
