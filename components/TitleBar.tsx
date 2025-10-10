import React from 'react';

interface TitleBarProps {
  title?: string;
}

export function TitleBar({ title = '∴' }: TitleBarProps) {
  return (
    <div
      data-tauri-drag-region
      className="h-[32px] flex items-center justify-center bg-[#f5f5f5] dark:bg-[#2a2a2a] border-b border-[#e0e0e0] dark:border-[#3a3a3a] select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <span className="text-[13px] font-medium text-[#5a5a5a] dark:text-[#b0b0b0]">
        {title}
      </span>
    </div>
  );
}
