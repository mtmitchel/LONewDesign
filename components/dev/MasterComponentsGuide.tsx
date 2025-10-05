import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Code2, Layers, Palette, Zap } from 'lucide-react';

export function MasterComponentsGuide() {
  return (
    <div className="p-6 space-y-8 bg-[var(--bg-canvas)] min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-[var(--text-2xl)] font-[var(--font-weight-bold)] text-[var(--text-primary)]">
          Master Components Guide
        </h1>
        <p className="text-[var(--text-base)] text-[var(--text-secondary)]">
          Design system components with bound variables for consistent scaling
        </p>
      </div>

      {/* Overview */}
      <Card className="bg-[var(--bg-surface)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Component Architecture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[var(--text-base)] text-[var(--text-secondary)]">
            LibreOllama uses a systematic approach to component design with bound variables, 
            master components, and consistent token application across all UI elements.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-[var(--border-default)] rounded-[var(--radius-md)] text-center">
              <Palette className="w-8 h-8 mx-auto mb-2 text-[var(--primary)]" />
              <h3 className="font-[var(--font-weight-medium)] mb-1">Design Tokens</h3>
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">Colors, spacing, typography</p>
            </div>
            <div className="p-4 border border-[var(--border-default)] rounded-[var(--radius-md)] text-center">
              <Layers className="w-8 h-8 mx-auto mb-2 text-[var(--primary)]" />
              <h3 className="font-[var(--font-weight-medium)] mb-1">Master Components</h3>
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">Reusable, token-bound</p>
            </div>
            <div className="p-4 border border-[var(--border-default)] rounded-[var(--radius-md)] text-center">
              <Code2 className="w-8 h-8 mx-auto mb-2 text-[var(--primary)]" />
              <h3 className="font-[var(--font-weight-medium)] mb-1">Component Instances</h3>
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">Consistent overrides</p>
            </div>
            <div className="p-4 border border-[var(--border-default)] rounded-[var(--radius-md)] text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-[var(--primary)]" />
              <h3 className="font-[var(--font-weight-medium)] mb-1">Global Updates</h3>
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">Cascade changes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EmailOverlay Master Component */}
      <Card className="bg-[var(--bg-surface)]">
        <CardHeader>
          <CardTitle>EmailOverlay Master Component</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-[var(--bg-surface-elevated)] rounded-[var(--radius-md)] border border-[var(--border-default)]">
            <h3 className="font-[var(--font-weight-semibold)] mb-3">Specifications</h3>
            <div className="grid grid-cols-2 gap-4 text-[var(--text-sm)]">
              <div>
                <strong>Width:</strong> <code>var(--email-modal-width)</code> (700px)
              </div>
              <div>
                <strong>Max Width:</strong> <code>var(--email-modal-max-width)</code> (90vw)
              </div>
              <div>
                <strong>Header Height:</strong> <code>var(--email-header-height)</code> (56px)
              </div>
              <div>
                <strong>Footer Height:</strong> <code>var(--email-footer-height)</code> (64px)
              </div>
              <div>
                <strong>Padding:</strong> <code>var(--email-modal-padding)</code> (20px)
              </div>
              <div>
                <strong>Border:</strong> <code>var(--border-default)</code>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-[var(--font-weight-medium)]">Key Features:</h4>
            <ul className="list-disc list-inside text-[var(--text-sm)] text-[var(--text-secondary)] space-y-1">
              <li>Fixed positioning from right edge (no horizontal scroll)</li>
              <li>Sticky header with email actions and subject</li>
              <li>Scrollable content area with proper overflow handling</li>
              <li>Sticky footer with reply actions</li>
              <li>Word-break protection for long content</li>
              <li>Token-based sizing for consistent scaling</li>
            </ul>
          </div>

          <Badge variant="secondary">✅ Critical Requirement: No horizontal scrollbar</Badge>
        </CardContent>
      </Card>


      {/* Panel Toggle System */}
      <Card className="bg-[var(--bg-surface)]">
        <CardHeader>
          <CardTitle>Enhanced Panel Toggle System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Left Navigation */}
          <div>
            <h3 className="font-[var(--font-weight-semibold)] mb-3">Left Navigation Sidebar</h3>
            <div className="p-4 bg-[var(--bg-surface-elevated)] rounded-[var(--radius-md)] border border-[var(--border-default)]">
              <div className="space-y-2 text-[var(--text-sm)]">
                <div><strong>Expanded Width:</strong> <code>var(--tripane-left-width)</code> (280px)</div>
                <div><strong>Collapsed Width:</strong> <code>var(--sidebar-collapsed-width)</code> (60px)</div>
                <div><strong>Toggle Position:</strong> Bottom of sidebar</div>
                <div><strong>Icon:</strong> Double chevron (ChevronsLeft/ChevronsRight)</div>
                <div><strong>Enhancement:</strong> Tooltip on hover for better UX</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Mail Sidebar */}
          <div>
            <h3 className="font-[var(--font-weight-semibold)] mb-3">Mail Sidebar Header Toggle</h3>
            <div className="p-4 bg-[var(--bg-surface-elevated)] rounded-[var(--radius-md)] border border-[var(--border-default)]">
              <div className="space-y-2 text-[var(--text-sm)]">
                <div><strong>Implementation:</strong> Header row doubles as toggle button</div>
                <div><strong>Visual Cue:</strong> Chevron appears on hover inline with "Folders"</div>
                <div><strong>Interaction:</strong> Entire header row is clickable</div>
                <div><strong>State:</strong> Hover effects for better discoverability</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Right Context Panel */}
          <div>
            <h3 className="font-[var(--font-weight-semibold)] mb-3">Right Context Panel</h3>
            <div className="p-4 bg-[var(--bg-surface-elevated)] rounded-[var(--radius-md)] border border-[var(--border-default)]">
              <div className="space-y-2 text-[var(--text-sm)]">
                <div><strong>Expanded Width:</strong> <code>var(--quick-panel-width)</code> (320px)</div>
                <div><strong>Collapsed Width:</strong> 24px (slim handle)</div>
                <div><strong>Handle Design:</strong> Vertical grip dots (GripVertical icon)</div>
                <div><strong>Interaction:</strong> Click to expand, hover effects</div>
                <div><strong>Enhancement:</strong> Tooltip indicating "Show context panel"</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Notes */}
      <Card className="bg-[var(--bg-surface)]">
        <CardHeader>
          <CardTitle>Implementation Benefits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-[var(--font-weight-semibold)] mb-3 text-[var(--primary)]">Design System Benefits</h3>
              <ul className="list-disc list-inside text-[var(--text-sm)] space-y-1">
                <li>Global token updates cascade automatically</li>
                <li>Consistent spacing and sizing across components</li>
                <li>Maintainable color system with semantic mapping</li>
                <li>Responsive design built into token definitions</li>
              </ul>
            </div>
            <div>
              <h3 className="font-[var(--font-weight-semibold)] mb-3 text-[var(--accent-coral)]">Component Benefits</h3>
              <ul className="list-disc list-inside text-[var(--text-sm)] space-y-1">
                <li>Reusable master components with bound variables</li>
                <li>Enhanced UX with improved toggle controls</li>
                <li>No horizontal scrollbars in modal components</li>
                <li>Accessibility features with proper tooltips</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-[var(--primary-tint-5)] rounded-[var(--radius-md)] border-l-4 border-[var(--primary)]">
            <h4 className="font-[var(--font-weight-medium)] text-[var(--primary)] mb-2">Critical Requirements Met</h4>
            <ul className="text-[var(--text-sm)] space-y-1">
              <li>✅ Emails NEVER appear in right panel - only in modal overlays</li>
              <li>✅ NO horizontal scrollbar in email modal</li>
              <li>✅ Enhanced panel toggle controls with better UX</li>
              <li>✅ Token-based sizing for consistent scaling</li>
              <li>✅ Asana + Sunsama design system implementation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}