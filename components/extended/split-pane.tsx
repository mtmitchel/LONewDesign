"use client";

import * as React from "react";
import { cn } from "../ui/utils";

interface SplitPaneProps {
  direction?: 'horizontal' | 'vertical';
  defaultSize?: number; // percentage (0-100)
  minSize?: number; // percentage
  maxSize?: number; // percentage
  disabled?: boolean;
  onSizeChange?: (size: number) => void;
  className?: string;
  children: [React.ReactNode, React.ReactNode];
}

export function SplitPane({
  direction = 'horizontal',
  defaultSize = 50,
  minSize = 10,
  maxSize = 90,
  disabled = false,
  onSizeChange,
  className,
  children
}: SplitPaneProps) {
  const [size, setSize] = React.useState(defaultSize);
  const [isDragging, setIsDragging] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current || disabled) return;

    const rect = containerRef.current.getBoundingClientRect();
    let newSize: number;

    if (direction === 'horizontal') {
      const x = e.clientX - rect.left;
      newSize = (x / rect.width) * 100;
    } else {
      const y = e.clientY - rect.top;
      newSize = (y / rect.height) * 100;
    }

    newSize = Math.max(minSize, Math.min(maxSize, newSize));
    setSize(newSize);
    onSizeChange?.(newSize);
  }, [isDragging, direction, minSize, maxSize, disabled, onSizeChange]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const isHorizontal = direction === 'horizontal';
  const firstPaneStyle = isHorizontal 
    ? { width: `${size}%` }
    : { height: `${size}%` };
  const secondPaneStyle = isHorizontal 
    ? { width: `${100 - size}%` }
    : { height: `${100 - size}%` };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex relative",
        isHorizontal ? "flex-row h-full" : "flex-col w-full",
        className
      )}
    >
      {/* First Pane */}
      <div
        style={firstPaneStyle}
        className="overflow-hidden"
      >
        {children[0]}
      </div>

      {/* Splitter */}
      <div
        className={cn(
          "bg-[var(--border-default)] relative flex-shrink-0 transition-colors",
          isHorizontal ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize",
          !disabled && "hover:bg-[var(--primary)]",
          isDragging && "bg-[var(--primary)]",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onMouseDown={handleMouseDown}
      >
        {/* Splitter Handle */}
        <div
          className={cn(
            "absolute bg-[var(--border-default)] rounded-full transition-all",
            isHorizontal
              ? "w-1 h-8 left-0 top-1/2 -translate-y-1/2 hover:w-2"
              : "h-1 w-8 top-0 left-1/2 -translate-x-1/2 hover:h-2",
            !disabled && "hover:bg-[var(--primary)]",
            isDragging && "bg-[var(--primary)]"
          )}
        />
      </div>

      {/* Second Pane */}
      <div
        style={secondPaneStyle}
        className="overflow-hidden"
      >
        {children[1]}
      </div>
    </div>
  );
}

export type { SplitPaneProps };