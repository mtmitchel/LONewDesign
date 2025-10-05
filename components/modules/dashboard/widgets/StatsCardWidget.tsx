"use client";

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../../ui/utils';
import type { WidgetProps } from '../types';

export function StatsCardWidget({ widget }: WidgetProps) {
  const stats = widget.config.stats || [];

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {stats.map((stat: any, index: number) => (
        <div
          key={index}
          className="p-4 bg-[var(--elevated)] rounded-lg border border-[var(--border-subtle)] flex flex-col justify-between"
        >
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-1">{stat.label}</p>
            <p className="text-2xl font-semibold text-[var(--text-primary)]">{stat.value}</p>
          </div>
          
          {stat.change && (
            <div className="flex items-center gap-1 mt-2">
              {stat.change.startsWith('+') ? (
                <TrendingUp size={14} className="text-[var(--success)]" />
              ) : (
                <TrendingDown size={14} className="text-[var(--error)]" />
              )}
              <span 
                className={cn(
                  "text-xs font-medium",
                  stat.change.startsWith('+') ? "text-[var(--success)]" : "text-[var(--error)]"
                )}
              >
                {stat.change}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}