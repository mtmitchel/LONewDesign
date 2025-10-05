import React, { useState, useRef, useEffect } from 'react';
import { 
  Brush, 
  Square, 
  Circle, 
  Type, 
  Download, 
  Upload, 
  RotateCcw,
  Palette,
  Minus
} from 'lucide-react';
import { Button } from '../ui/button';

type Tool = 'brush' | 'rectangle' | 'circle' | 'text' | 'line';

const colors = [
  'var(--primary)',
  'var(--success)', 
  'var(--warning)',
  'var(--error)',
  'var(--info)',
  'var(--text-primary)',
  'var(--text-secondary)'
];

export function CanvasModule() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool>('brush');
  const [currentColor, setCurrentColor] = useState(colors[0]);
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set default styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = currentColor;
    ctx.fillStyle = currentColor;
    ctx.lineWidth = brushSize;

    if (currentTool === 'brush') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (currentTool === 'brush') {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle shape tools
    if (currentTool === 'rectangle') {
      const startX = x - 50; // Simple implementation
      const startY = y - 50;
      ctx.strokeRect(startX, startY, 100, 100);
    } else if (currentTool === 'circle') {
      ctx.beginPath();
      ctx.arc(x, y, 50, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (currentTool === 'line') {
      ctx.beginPath();
      ctx.moveTo(x - 50, y);
      ctx.lineTo(x + 50, y);
      ctx.stroke();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'canvas-drawing.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const tools = [
    { id: 'brush' as Tool, icon: Brush, label: 'Brush' },
    { id: 'rectangle' as Tool, icon: Square, label: 'Rectangle' },
    { id: 'circle' as Tool, icon: Circle, label: 'Circle' },
    { id: 'line' as Tool, icon: Minus, label: 'Line' },
    { id: 'text' as Tool, icon: Type, label: 'Text' }
  ];

  return (
    <div className="h-full relative bg-[var(--canvas-bg)] overflow-hidden">
      {/* Canvas Background with Dots */}
      <div 
        className="w-full h-full relative"
        style={{
          backgroundImage: `radial-gradient(circle, #e2e8f0 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0'
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      {/* Floating Toolbar */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="bg-white rounded-2xl shadow-lg border border-[var(--border-default)] p-2">
          <div className="flex items-center gap-1">
            {/* Selection Tool */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-10 p-0 rounded-lg transition-colors ${
                currentTool === 'brush' ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]' : 'hover:bg-[var(--primary-tint-10)]'
              }`}
              onClick={() => setCurrentTool('brush')}
              title="Selection Tool"
            >
              <Download size={18} />
            </Button>
            
            {/* Hand Tool */}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-lg hover:bg-[var(--primary-tint-10)]"
              title="Hand Tool"
            >
              <Upload size={18} />
            </Button>

            <div className="w-px h-6 bg-[var(--border-default)] mx-1" />

            {/* Frame/Shape Tool */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-10 p-0 rounded-lg transition-colors ${
                currentTool === 'rectangle' ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]' : 'hover:bg-[var(--primary-tint-10)]'
              }`}
              onClick={() => setCurrentTool('rectangle')}
              title="Frame/Shape"
            >
              <Square size={18} />
            </Button>

            {/* Text Tool */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-10 p-0 rounded-lg transition-colors ${
                currentTool === 'text' ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]' : 'hover:bg-[var(--primary-tint-10)]'
              }`}
              onClick={() => setCurrentTool('text')}
              title="Text"
            >
              <Type size={18} />
            </Button>

            {/* Color Picker */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 rounded-lg hover:bg-[var(--primary-tint-10)] relative"
                title="Color Picker"
              >
                <div 
                  className="w-5 h-5 rounded border border-gray-300"
                  style={{ backgroundColor: currentColor }}
                />
              </Button>
            </div>

            <div className="w-px h-6 bg-[var(--border-default)] mx-1" />

            {/* Table */}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-lg hover:bg-[var(--primary-tint-10)]"
              title="Table"
            >
              <Brush size={18} />
            </Button>

            {/* Image */}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-lg hover:bg-[var(--primary-tint-10)]"
              title="Insert Image"
            >
              <Palette size={18} />
            </Button>

            {/* Triangle/Shapes */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-10 p-0 rounded-lg transition-colors ${
                currentTool === 'circle' ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]' : 'hover:bg-[var(--primary-tint-10)]'
              }`}
              onClick={() => setCurrentTool('circle')}
              title="Shapes"
            >
              <Circle size={18} />
            </Button>

            {/* Connector */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-10 p-0 rounded-lg transition-colors ${
                currentTool === 'line' ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]' : 'hover:bg-[var(--primary-tint-10)]'
              }`}
              onClick={() => setCurrentTool('line')}
              title="Connector"
            >
              <Minus size={18} />
            </Button>

            <div className="w-px h-6 bg-[var(--border-default)] mx-1" />

            {/* Pen */}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-lg hover:bg-[var(--primary-tint-10)]"
              title="Pen"
            >
              <Type size={18} />
            </Button>

            {/* Brush */}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-lg hover:bg-[var(--primary-tint-10)]"
              title="Brush"
            >
              <Brush size={18} />
            </Button>

            {/* Eraser */}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-lg hover:bg-[var(--primary-tint-10)]"
              onClick={clearCanvas}
              title="Eraser"
            >
              <RotateCcw size={18} />
            </Button>

            <div className="w-px h-6 bg-[var(--border-default)] mx-1" />

            {/* Undo */}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-lg hover:bg-[var(--primary-tint-10)]"
              title="Undo"
            >
              <Upload size={18} />
            </Button>

            {/* Redo */}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-lg hover:bg-[var(--primary-tint-10)]"
              title="Redo"
            >
              <Download size={18} />
            </Button>

            {/* Delete */}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-lg hover:bg-[var(--primary-tint-10)]"
              title="Delete"
            >
              <Square size={18} />
            </Button>

            <div className="w-px h-6 bg-[var(--border-default)] mx-1" />

            {/* Zoom Controls */}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-lg hover:bg-[var(--primary-tint-10)]"
              onClick={() => setBrushSize(Math.max(1, brushSize - 2))}
              title="Zoom Out"
            >
              <Minus size={18} />
            </Button>
            <div className="px-3 py-1 text-sm font-medium text-[var(--text-primary)] min-w-16 text-center">
              100%
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-lg hover:bg-[var(--primary-tint-10)]"
              onClick={() => setBrushSize(Math.min(20, brushSize + 2))}
              title="Zoom In"
            >
              <Type size={18} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-lg hover:bg-[var(--primary-tint-10)]"
              title="Search"
            >
              <Circle size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}