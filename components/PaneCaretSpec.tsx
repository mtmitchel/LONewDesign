import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * PaneCaretSpec - Design documentation component showing all caret states
 * Use this as reference for Figma implementation
 */
export function PaneCaretSpec() {
  return (
    <div className="p-8 bg-white max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-[var(--text-primary)]">
        LibreOllama Pane Caret Design Specification
      </h1>
      
      {/* Color Tokens */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Color Tokens</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border border-[var(--border-default)] rounded-lg">
            <div className="w-8 h-8 rounded-lg mb-2" style={{ backgroundColor: '#94A3B8' }}></div>
            <div className="text-sm font-medium">Rest</div>
            <div className="text-xs text-[var(--text-secondary)]">#94A3B8</div>
            <div className="text-xs text-[var(--text-secondary)]">slate-400</div>
          </div>
          <div className="p-4 border border-[var(--border-default)] rounded-lg">
            <div className="w-8 h-8 rounded-lg mb-2" style={{ backgroundColor: '#64748B' }}></div>
            <div className="text-sm font-medium">Hover</div>
            <div className="text-xs text-[var(--text-secondary)]">#64748B</div>
            <div className="text-xs text-[var(--text-secondary)]">slate-500</div>
          </div>
          <div className="p-4 border border-[var(--border-default)] rounded-lg">
            <div className="w-8 h-8 rounded-lg mb-2" style={{ backgroundColor: '#334155' }}></div>
            <div className="text-sm font-medium">Active</div>
            <div className="text-xs text-[var(--text-secondary)]">#334155</div>
            <div className="text-xs text-[var(--text-secondary)]">primary</div>
          </div>
          <div className="p-4 border border-[var(--border-default)] rounded-lg">
            <div className="w-8 h-8 rounded-lg mb-2" style={{ backgroundColor: '#CBD5E1' }}></div>
            <div className="text-sm font-medium">Disabled</div>
            <div className="text-xs text-[var(--text-secondary)]">#CBD5E1</div>
            <div className="text-xs text-[var(--text-secondary)]">slate-300</div>
          </div>
        </div>
      </section>

      {/* Component States */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Component States</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {/* Rest State */}
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center rounded-lg border border-[var(--border-default)]">
              <ChevronLeft size={16} strokeWidth={1.75} style={{ color: '#94A3B8' }} />
            </div>
            <div className="text-sm font-medium">Rest</div>
            <div className="text-xs text-[var(--text-secondary)]">Default state</div>
          </div>

          {/* Hover State */}
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center rounded-lg border border-[var(--border-default)]" style={{ backgroundColor: '#F1F5F9' }}>
              <ChevronLeft size={16} strokeWidth={1.75} style={{ color: '#64748B' }} />
            </div>
            <div className="text-sm font-medium">Hover</div>
            <div className="text-xs text-[var(--text-secondary)]">8px radius bg</div>
          </div>

          {/* Active State */}
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center rounded-lg border border-[var(--border-default)]" style={{ backgroundColor: '#F1F5F9' }}>
              <ChevronLeft size={16} strokeWidth={1.75} style={{ color: '#334155' }} />
            </div>
            <div className="text-sm font-medium">Active</div>
            <div className="text-xs text-[var(--text-secondary)]">Pressed state</div>
          </div>

          {/* Focus State */}
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center rounded-lg border-2" style={{ borderColor: 'rgba(51,65,85,0.4)' }}>
              <ChevronLeft size={16} strokeWidth={1.75} style={{ color: '#94A3B8' }} />
            </div>
            <div className="text-sm font-medium">Focus</div>
            <div className="text-xs text-[var(--text-secondary)]">Keyboard focus</div>
          </div>

          {/* Disabled State */}
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center rounded-lg border border-[var(--border-default)] opacity-50">
              <ChevronLeft size={16} strokeWidth={1.75} style={{ color: '#CBD5E1' }} />
            </div>
            <div className="text-sm font-medium">Disabled</div>
            <div className="text-xs text-[var(--text-secondary)]">Non-interactive</div>
          </div>
        </div>
      </section>

      {/* Direction Logic */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Direction Logic</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 border border-[var(--border-default)] rounded-lg">
            <h3 className="font-semibold mb-2">Left App Nav</h3>
            <div className="flex items-center gap-2 mb-1">
              <ChevronLeft size={16} strokeWidth={1.75} style={{ color: '#94A3B8' }} />
              <span className="text-sm">Expanded → Collapse</span>
            </div>
            <div className="flex items-center gap-2">
              <ChevronRight size={16} strokeWidth={1.75} style={{ color: '#94A3B8' }} />
              <span className="text-sm">Collapsed → Expand</span>
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">Shortcut: ⌘\</div>
          </div>

          <div className="p-4 border border-[var(--border-default)] rounded-lg">
            <h3 className="font-semibold mb-2">Mail Sidebar</h3>
            <div className="flex items-center gap-2 mb-1">
              <ChevronLeft size={16} strokeWidth={1.75} style={{ color: '#94A3B8' }} />
              <span className="text-sm">Expanded → Hide</span>
            </div>
            <div className="flex items-center gap-2">
              <ChevronRight size={16} strokeWidth={1.75} style={{ color: '#94A3B8' }} />
              <span className="text-sm">Hidden → Show</span>
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">Shortcuts: [ ] </div>
          </div>

          <div className="p-4 border border-[var(--border-default)] rounded-lg">
            <h3 className="font-semibold mb-2">Right Context</h3>
            <div className="flex items-center gap-2 mb-1">
              <ChevronRight size={16} strokeWidth={1.75} style={{ color: '#94A3B8' }} />
              <span className="text-sm">Expanded → Hide</span>
            </div>
            <div className="flex items-center gap-2">
              <ChevronLeft size={16} strokeWidth={1.75} style={{ color: '#94A3B8' }} />
              <span className="text-sm">Hidden → Show</span>
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">Shortcut: \</div>
          </div>
        </div>
      </section>

      {/* Placement Specs */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Placement & Sizing</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 border border-[var(--border-default)] rounded-lg">
            <h3 className="font-semibold mb-2">Dimensions</h3>
            <ul className="text-sm space-y-1">
              <li><strong>Icon:</strong> 16px × 16px</li>
              <li><strong>Stroke:</strong> 1.75px weight</li>
              <li><strong>Hit area:</strong> 32px × 32px</li>
              <li><strong>Footer height:</strong> 40px</li>
              <li><strong>Bottom offset:</strong> 8px</li>
              <li><strong>Side padding:</strong> 16px</li>
            </ul>
          </div>

          <div className="p-4 border border-[var(--border-default)] rounded-lg">
            <h3 className="font-semibold mb-2">Positioning</h3>
            <ul className="text-sm space-y-1">
              <li><strong>Vertical:</strong> Pinned to bottom</li>
              <li><strong>Horizontal:</strong> Centered in pane</li>
              <li><strong>Border radius:</strong> 8px (hover bg)</li>
              <li><strong>Focus outline:</strong> 2px, 4px radius</li>
              <li><strong>Transition:</strong> 200ms ease</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer with Implementation Notes */}
      <section className="mt-8 p-4 bg-[var(--bg-surface-elevated)] rounded-lg">
        <h3 className="font-semibold mb-2">Implementation Notes</h3>
        <ul className="text-sm space-y-1 text-[var(--text-secondary)]">
          <li>• Use single PaneCaret component with direction and state props</li>
          <li>• Wrap in 40px PaneFooter with 8px padding and top border</li>
          <li>• Bind colors to CSS custom properties for theme consistency</li>
          <li>• Include keyboard shortcuts in tooltips</li>
          <li>• Ensure 4.5:1 contrast ratio for accessibility</li>
          <li>• Use aria-label for screen readers</li>
        </ul>
      </section>
    </div>
  );
}