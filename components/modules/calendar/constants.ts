// Chip utility classes for soft priority badges
export const chipBase =
  "inline-flex items-center justify-center " +
  "h-[var(--chip-height)] px-[var(--chip-pad-x)] " +
  "rounded-[var(--chip-radius)] text-[length:var(--text-sm)] " +
  "font-[var(--font-weight-medium)]";

export const ChipHigh = `${chipBase} bg-[var(--chip-high-bg)] text-[color:var(--chip-high-text)]`;
export const ChipMedium = `${chipBase} bg-[var(--chip-medium-bg)] text-[color:var(--chip-medium-text)]`;
export const ChipLow = `${chipBase} bg-[var(--chip-low-bg)] text-[color:var(--chip-low-text)]`;
export const ChipNeutral = `${chipBase} bg-[var(--chip-neutral-bg)] text-[color:var(--chip-neutral-text)]`;

// Base filter options - list-based filters will be added dynamically
export const BASE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All tasks' }
];

export const BUFFER_ROWS = 4;