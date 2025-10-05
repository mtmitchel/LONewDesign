"use client";

import * as React from "react";
import { Pipette, Check } from "lucide-react";
import { cn } from "../ui/utils";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Input } from "../ui/input";

interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  disabled?: boolean;
  className?: string;
  presets?: string[];
  showInput?: boolean;
  placeholder?: string;
}

const defaultPresets = [
  // LibreOllama palette
  "hsl(267, 60%, 70%)", // Primary
  "hsl(160, 50%, 60%)", // Success
  "hsl(38, 85%, 63%)",  // Warning
  "hsl(0, 65%, 65%)",   // Error
  "hsl(200, 70%, 65%)", // Info
  
  // Common colors
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#a855f7", // Purple
  "#ec4899", // Pink
  
  // Grays
  "#000000",
  "#374151",
  "#6b7280",
  "#9ca3af",
  "#d1d5db",
  "#f3f4f6",
  "#ffffff",
];

export function ColorPicker({
  value = "#000000",
  onChange,
  disabled = false,
  className,
  presets = defaultPresets,
  showInput = true,
  placeholder = "Select color"
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleColorChange = (color: string) => {
    onChange?.(color);
    setInputValue(color);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Validate color format (basic validation)
    if (newValue.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/) || 
        newValue.match(/^hsl\(.*\)$/) || 
        newValue.match(/^rgb\(.*\)$/)) {
      onChange?.(newValue);
    }
  };

  const handleInputBlur = () => {
    // Reset to current value if invalid
    setInputValue(value);
  };

  const parseColor = (color: string): { r: number; g: number; b: number } => {
    // Simple color parsing for preview
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16),
        };
      } else if (hex.length === 6) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
        };
      }
    }
    return { r: 0, g: 0, b: 0 };
  };

  const isLight = (color: string): boolean => {
    const { r, g, b } = parseColor(color);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-10 h-10 p-1 rounded-lg border border-[var(--border-default)]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div
              className="w-full h-full rounded-md border border-[var(--border-subtle)]"
              style={{ backgroundColor: value }}
            />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-64 p-4" align="start">
          <div className="space-y-4">
            {/* Color Preview */}
            <div
              className="w-full h-16 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center"
              style={{ backgroundColor: value }}
            >
              <Pipette 
                size={20} 
                className={isLight(value) ? "text-black" : "text-white"}
              />
            </div>

            {/* Preset Colors */}
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Presets</p>
              <div className="grid grid-cols-6 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleColorChange(preset)}
                    className={cn(
                      "w-8 h-8 rounded-md border border-[var(--border-subtle)] transition-all hover:scale-110",
                      "focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
                    )}
                    style={{ backgroundColor: preset }}
                  >
                    {value === preset && (
                      <Check 
                        size={14} 
                        className={cn(
                          "mx-auto",
                          isLight(preset) ? "text-black" : "text-white"
                        )}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Input */}
            {showInput && (
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Custom</p>
                <Input
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder={placeholder}
                  className="font-mono"
                />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {showInput && (
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 font-mono"
        />
      )}
    </div>
  );
}

export type { ColorPickerProps };