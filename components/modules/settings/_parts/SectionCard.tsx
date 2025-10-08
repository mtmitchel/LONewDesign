import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../ui/utils';

interface SectionCardProps {
  id?: string;
  title: string;
  help?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SectionCard({ id, title, help, children, defaultOpen = false }: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card
      id={id}
      className="border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-[var(--elevation-sm)] bg-[var(--bg-surface-elevated)]"
    >
      <button
        type="button"
        className="w-full text-left"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <CardHeader className="flex flex-row items-center justify-between p-5">
          <div>
            <CardTitle className="text-base font-semibold text-[var(--text-primary)]">{title}</CardTitle>
            {help && <p className="text-sm text-[var(--text-secondary)]">{help}</p>}
          </div>
          <ChevronDown
            aria-hidden
            className={cn(
              'size-4 shrink-0 text-[var(--text-secondary)] transition-transform motion-safe:duration-200',
              open && 'rotate-180',
            )}
          />
        </CardHeader>
      </button>
      {open && <CardContent className="p-5 pt-0">{children}</CardContent>}
    </Card>
  );
}

interface SummaryRowProps {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
}

export function SummaryRow({ label, value, muted = false }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border-subtle)] py-2 last:border-b-0">
      <span className={cn('text-sm font-medium text-[var(--text-primary)]', muted && 'text-[var(--text-secondary)]')}>{label}</span>
      <span className="text-sm text-[var(--text-secondary)]">{value}</span>
    </div>
  );
}
