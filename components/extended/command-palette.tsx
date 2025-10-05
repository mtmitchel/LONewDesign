"use client";

import * as React from "react";
import { Command } from "cmdk";
import { Search, Hash, File, Settings, Calendar, Mail } from "lucide-react";
import { cn } from "../ui/utils";
import { Dialog, DialogContent } from "../ui/dialog";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  keywords?: string[];
  onSelect?: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  emptyMessage?: string;
}

export function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = "Type a command or search...",
  emptyMessage = "No results found."
}: CommandPaletteProps) {
  const [search, setSearch] = React.useState("");

  const categoryIcons: Record<string, React.ComponentType<any>> = {
    navigation: Hash,
    files: File,
    settings: Settings,
    calendar: Calendar,
    mail: Mail,
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-lg border border-[var(--border-default)]">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[var(--text-secondary)] [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <div className="flex items-center border-b border-[var(--border-subtle)] px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
            <Command.Input
              placeholder={placeholder}
              value={search}
              onValueChange={setSearch}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <Command.Empty className="py-6 text-center text-sm text-[var(--text-secondary)]">
              {emptyMessage}
            </Command.Empty>
            
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <Command.Group 
                key={category} 
                heading={category.charAt(0).toUpperCase() + category.slice(1)}
              >
                {categoryItems.map((item) => {
                  const Icon = item.icon || categoryIcons[category];
                  return (
                    <Command.Item
                      key={item.id}
                      value={`${item.title} ${item.subtitle} ${(item.keywords || []).join(" ")}`}
                      onSelect={() => {
                        item.onSelect?.();
                        onOpenChange(false);
                        setSearch("");
                      }}
                      className={cn(
                        "relative flex cursor-default items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none",
                        "aria-selected:bg-[var(--primary-tint-10)] aria-selected:text-[var(--primary)]",
                        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      )}
                    >
                      {Icon && <Icon size={16} />}
                      <div className="flex-1">
                        <div className="font-medium">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-xs text-[var(--text-secondary)]">{item.subtitle}</div>
                        )}
                      </div>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export type { CommandItem, CommandPaletteProps };