/**
 * Color picker constants and type definitions
 */

export type ColorPickerMode = 'palette' | 'picker' | 'hybrid' | 'figma-horizontal';

export interface UnifiedColorPickerProps {
  // Core props
  open: boolean;
  mode?: ColorPickerMode;
  color?: string;
  onChange: (color: string) => void;
  onClose: () => void;

  // Positioning - use one or the other
  anchorRect?: DOMRect | null; // For toolbar positioning (bottom/left)
  anchor?: { x: number; y: number }; // For floating positioning (x/y)

  // Customization
  title?: string;
  colors?: string[]; // Custom palette colors
  showColorValue?: boolean; // Show hex value
  autoFocus?: boolean;
  className?: string;

  // Deprecated - for backward compatibility
  selected?: string; // Use 'color' instead
  onSelect?: (color: string) => void; // Use 'onChange' instead
}

// Default FigJam-like sticky note palette
export const DEFAULT_PALETTE: string[] = [
  '#FFEFC8', // Low-ink sun
  '#FFDCCD', // Low-ink tangerine
  '#FFCBF0', // Low-ink berry
  '#EDE1FF', // Soft lavender
  '#D8E0FF', // Powder cornflower
  '#C9EBFF', // Mist sky
  '#C9F4E6', // Mint frost
  '#E0FBEF', // Pastel teal
  '#FFF8F1', // Peach paper
  '#FDFBFF', // Whisper lilac
  '#C6C5FF', // Indigo haze
  '#B6B4C0', // Slate veil
  '#FFFFFF', // White
  '#B1B4B9', // Soft graphite
];

// FigJam-style horizontal palette tailored for sticky note toolbar
export const FIGMA_HORIZONTAL_PALETTE: string[] = [
  '#FFEFC8', // Low-ink sun
  '#FFDCCD', // Low-ink tangerine
  '#FFCBF0', // Low-ink berry
  '#D6D1FC', // Soft iris
  '#C6C5FF', // Indigo haze
  '#C9EBFF', // Mist sky
  '#C9F4E6', // Mint frost
  '#B1B3BE', // Slate mist
];

// Additional extended palette
export const EXTENDED_PALETTE: string[] = [
  ...DEFAULT_PALETTE,
  '#F87171', // Red-500
  '#FB923C', // Orange-500
  '#FACC15', // Yellow-500
  '#4ADE80', // Green-500
  '#22D3EE', // Cyan-500
  '#60A5FA', // Blue-500
  '#A78BFA', // Violet-500
  '#F472B6', // Pink-500
  '#E5E7EB', // Gray-200
  '#9CA3AF', // Gray-400
  '#4B5563', // Gray-600
  '#1F2937', // Gray-800
];