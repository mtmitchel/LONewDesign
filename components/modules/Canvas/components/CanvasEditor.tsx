import React from 'react';
import FigJamCanvas from '../runtime/features/components/FigJamCanvas';
import '../styles/figjam-theme.css';

export function CanvasEditor() {
  return (
    <div className="relative flex h-full min-h-[480px] flex-1 overflow-hidden bg-[color:var(--canvas-surface)] rounded-none">
      <FigJamCanvas />
    </div>
  );
}

export default CanvasEditor;
