export const TASK_META_CHIP_CLASS =
  'inline-flex h-[var(--chip-height)] items-center justify-start gap-[var(--chip-gap)] rounded-[var(--chip-radius)] px-[var(--chip-pad-x)] py-[var(--chip-pad-y)] text-[length:var(--text-sm)] font-medium border border-transparent transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)]';

export const TASK_LABEL_CHIP_BASE_CLASS =
  'bg-[color:var(--chip-label-bg)] text-[color:var(--chip-label-fg)] shadow-[var(--chip-inset-shadow)] hover:bg-[color:color-mix(in_oklab,var(--chip-label-bg)_calc(100%+var(--chip-hover-bg-boost)),transparent)]';

const LABEL_HUES = new Set(['blue', 'purple', 'pink', 'red', 'orange', 'yellow', 'green', 'teal', 'gray']);

export const getLabelHue = (color: string | undefined) => {
  if (!color) return undefined;
  const match = color.match(/--label-([a-z]+)/i);
  if (match) {
    const hue = match[1].toLowerCase();
    return LABEL_HUES.has(hue) ? hue : undefined;
  }
  const normalized = color.trim().toLowerCase();
  return LABEL_HUES.has(normalized) ? normalized : undefined;
};
