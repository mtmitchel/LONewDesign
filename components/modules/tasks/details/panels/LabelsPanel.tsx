
import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../ui/popover';
import { Button } from '../../../../ui/button';
import { Tag, Check } from 'lucide-react';
import { cn } from '../../../../ui/utils';
import { Badge } from '../../../../ui/badge';
import { TASK_META_CHIP_CLASS, TASK_LABEL_CHIP_BASE_CLASS, getLabelHue } from '../../taskChipStyles';
import type { TaskLabel } from '../../types';

const EMPTY_TILE_BUTTON_CLASS =
  'h-8 w-8 rounded-[var(--radius-md)] flex items-center justify-center bg-[color:var(--bg-surface-elevated)] text-[color:var(--text-tertiary)] transition-colors hover:bg-[color:color-mix(in_oklab,var(--bg-surface-elevated)_92%,transparent)] hover:text-[color:var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[color:var(--bg-panel)]';

const DEFAULT_LABEL_COLOR = 'var(--label-blue)';

interface LabelsPanelProps {
  selectedLabels: { name: string; color: string }[];
  mergedLabelOptions: { name: string; color: string }[];
  labelsOpen: boolean;
  setLabelsOpen: (open: boolean) => void;
  labelInput: string;
  setLabelInput: (input: string) => void;
  labelInputRef: React.RefObject<HTMLInputElement>;
  toggleLabel: (label: { name: string; color: string }) => void;
  addFreeformLabel: (name: string) => void;
}

export function LabelsPanel({ selectedLabels, mergedLabelOptions, labelsOpen, setLabelsOpen, labelInput, setLabelInput, labelInputRef, toggleLabel, addFreeformLabel }: LabelsPanelProps) {
  return (
    <div className="grid grid-cols-[var(--task-drawer-label-col)_1fr] gap-x-[var(--space-8)] gap-y-[var(--space-3)]">
      <span className='text-[length:var(--text-sm)] font-medium text-[color:var(--text-secondary)] leading-[var(--line-tight)] flex items-center'>Labels</span>
      <div className='flex items-center min-h-[var(--row-min-h)] w-full text-[color:var(--text-primary)] gap-[var(--chip-gap)]'>
        <Popover
          open={labelsOpen}
          onOpenChange={(open: boolean) => {
            setLabelsOpen(open);
            if (!open) {
              setLabelInput('');
            }
          }}
        >
          <PopoverTrigger asChild>
            {selectedLabels.length > 0 ? (
              <button
                type="button"
                aria-label={`Edit labels (${selectedLabels.map((label) => label.name).join(', ')})`}
                className="group flex min-h-[34px] max-w-full flex-wrap items-center gap-[var(--chip-gap)] rounded-full bg-transparent px-[var(--space-1)] py-[var(--space-1)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-panel)]"
              >
                {selectedLabels.map((label) => {
                  const labelHue = getLabelHue(label.color ?? DEFAULT_LABEL_COLOR);
                  return (
                    <Badge
                      key={`trigger-${label.name}`}
                      variant="soft"
                      size="sm"
                      data-label-color={labelHue}
                      className={cn(
                        TASK_META_CHIP_CLASS,
                        TASK_LABEL_CHIP_BASE_CLASS,
                        'group-hover:border-[color:var(--border-strong)] group-focus-visible:border-[color:var(--border-strong)]',
                        labelsOpen && 'border-[color:var(--border-strong)]',
                      )}
                    >
                      <span className="max-w-[100px] truncate" title={label.name}>
                        {label.name}
                      </span>
                    </Badge>
                  );
                })}
              </button>
            ) : (
              <button
                type="button"
                className={EMPTY_TILE_BUTTON_CLASS}
                aria-label="Choose labels"
              >
                <Tag className="h-[var(--icon-md)] w-[var(--icon-md)]" strokeWidth={1.25} aria-hidden />
              </button>
            )}
          </PopoverTrigger>
          <PopoverContent
            className="w-[240px] p-3"
            side="bottom"
            sideOffset={8}
            align="start"
            alignOffset={140}
            onOpenAutoFocus={(event: Event) => {
              event.preventDefault();
            }}
            onCloseAutoFocus={(event: Event) => {
              event.preventDefault();
            }}
          >
            <div className="flex flex-col gap-[var(--space-2)]">
              <div className="flex flex-wrap gap-[var(--chip-gap)]">
                {mergedLabelOptions.map((label) => {
                  const isSelected = selectedLabels.some((item) => item.name === label.name);
                  const labelHue = getLabelHue(label.color ?? DEFAULT_LABEL_COLOR);
                  return (
                    <button
                      key={label.name}
                      type="button"
                      onClick={() => toggleLabel(label)}
                      className={cn(
                        'rounded-[var(--chip-radius)] border border-transparent transition-shadow hover:border-[color:var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)] focus-visible:border-[color:var(--border-strong)]',
                        isSelected && 'border-[color:var(--border-strong)]',
                      )}
                    >
                      <Badge
                        variant="soft"
                        size="sm"
                        className={cn(
                          TASK_META_CHIP_CLASS,
                          TASK_LABEL_CHIP_BASE_CLASS,
                        )}
                        data-label-color={labelHue}
                      >
                        <span>{label.name}</span>
                        {isSelected ? <Check className="size-3" aria-hidden /> : null}
                      </Badge>
                    </button>
                  );
                })}
              </div>
              <div className="relative">
                <input
                  ref={labelInputRef}
                  type="text"
                  value={labelInput}
                  onChange={(event) => setLabelInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addFreeformLabel(labelInput);
                    }
                  }}
                  placeholder="Add label"
                  autoComplete="off"
                  spellCheck={false}
                  inputMode="text"
                  className="flex h-8 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-2)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] caret-[var(--primary)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
