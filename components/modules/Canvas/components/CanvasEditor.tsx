import React from 'react';
import FigJamCanvas from '../runtime/features/components/FigJamCanvas';
import '../styles/figjam-theme.css';

export function CanvasEditor() {
  return (
    <div className="relative flex h-full min-h-[480px] flex-1 overflow-hidden rounded-[var(--canvas-radius-lg)] border border-[color:var(--canvas-toolbar-border)] bg-[color:var(--canvas-surface)] shadow-canvas-md">
      <FigJamCanvas />
    </div>
  );
}

export default CanvasEditor;
