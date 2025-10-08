import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Mail, 
  Settings, 
  ChevronsLeft, 
  ChevronsRight, 
  GripVertical,
  ChevronLeft,
  Star,
  Archive,
  Trash,
  Reply,
  Plus
} from 'lucide-react';

export function DesignSystemDemo() {
  const [leftPaneVisible, setLeftPaneVisible] = useState(true);
  const [rightPaneVisible, setRightPaneVisible] = useState(true);

  return (
    <div className="p-6 space-y-8 bg-[var(--bg-canvas)] min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2">
  <h1 className="text-[length:var(--text-2xl)] font-[var(--font-weight-bold)] text-[color:var(--text-primary)]">
          LibreOllama Design System
        </h1>
  <p className="text-[length:var(--text-base)] text-[color:var(--text-secondary)]">
          Asana + Sunsama Design System with Blue-Gray Primary & Coral Accent
        </p>
      </div>

      {/* Color Palette */}
      <Card className="bg-[var(--bg-surface)]">
        <CardHeader>
          <CardTitle>Color System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Canvas & Surfaces */}
          <div>
            <h3 className="text-[length:var(--text-lg)] font-[var(--font-weight-semibold)] mb-3">Canvas & Surfaces</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-full h-20 bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded-[var(--radius-md)] mb-2"></div>
                <p className="text-[length:var(--text-sm)]">Canvas</p>
                <p className="text-[length:var(--text-xs)] text-[color:var(--text-secondary)]">#FAFAF7</p>
              </div>
              <div className="text-center">
                <div className="w-full h-20 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] mb-2"></div>
                <p className="text-[length:var(--text-sm)]">Surface</p>
                <p className="text-[length:var(--text-xs)] text-[color:var(--text-secondary)]">#FFFFFF</p>
              </div>
              <div className="text-center">
                <div className="w-full h-20 bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] mb-2"></div>
                <p className="text-[length:var(--text-sm)]">Elevated</p>
                <p className="text-[length:var(--text-xs)] text-[color:var(--text-secondary)]">#F1F5F9</p>
              </div>
            </div>
          </div>

          {/* Primary & Accent */}
          <div>
            <h3 className="text-[length:var(--text-lg)] font-[var(--font-weight-semibold)] mb-3">Primary & Accent</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="w-full h-20 bg-[var(--primary)] rounded-[var(--radius-md)] mb-2"></div>
                <p className="text-[length:var(--text-sm)]">Blue-Gray Primary</p>
                <p className="text-[length:var(--text-xs)] text-[color:var(--text-secondary)]">#334155</p>
              </div>
              <div className="text-center">
                <div className="w-full h-20 bg-[var(--accent-coral)] rounded-[var(--radius-md)] mb-2"></div>
                <p className="text-[length:var(--text-sm)]">Coral Accent</p>
                <p className="text-[length:var(--text-xs)] text-[color:var(--text-secondary)]">#F87171</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spacing Scale */}
      <Card className="bg-[var(--bg-surface)]">
        <CardHeader>
          <CardTitle>Spacing Scale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 text-[length:var(--text-sm)]">XS (4px)</div>
              <div className="w-[var(--space-1)] h-4 bg-[var(--primary)]"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 text-[length:var(--text-sm)]">S (8px)</div>
              <div className="w-[var(--space-2)] h-4 bg-[var(--primary)]"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 text-[length:var(--text-sm)]">M (12px)</div>
              <div className="w-[var(--space-3)] h-4 bg-[var(--primary)]"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 text-[length:var(--text-sm)]">L (16px)</div>
              <div className="w-[var(--space-4)] h-4 bg-[var(--primary)]"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 text-[length:var(--text-sm)]">XL (20px)</div>
              <div className="w-[var(--space-5)] h-4 bg-[var(--primary)]"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 text-[length:var(--text-sm)]">XXL (24px)</div>
              <div className="w-[var(--space-6)] h-4 bg-[var(--primary)]"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button System */}
      <Card className="bg-[var(--bg-surface)]">
        <CardHeader>
          <CardTitle>Button System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button className="bg-[var(--primary)] hover:bg-[var(--primary-hover)]">
              <Plus className="w-4 h-4 mr-2" />
              Primary Action
            </Button>
            <Button className="bg-[var(--accent-coral)] hover:bg-[var(--accent-coral-hover)]">
              <Mail className="w-4 h-4 mr-2" />
              Secondary Action
            </Button>
            <Button variant="ghost">
              <Settings className="w-4 h-4 mr-2" />
              Ghost Button
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Panel Toggle Controls */}
      <Card className="bg-[var(--bg-surface)]">
        <CardHeader>
          <CardTitle>Enhanced Panel Toggle Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Left Navigation Toggle */}
          <div>
            <h3 className="text-[length:var(--text-lg)] font-[var(--font-weight-semibold)] mb-3">Left Navigation</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLeftPaneVisible(!leftPaneVisible)}
                  className="text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                >
                  {leftPaneVisible ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
                </Button>
                <span className="text-[length:var(--text-sm)]">
                  {leftPaneVisible ? 'Collapse Sidebar' : 'Expand Sidebar'} (with tooltip)
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Mail Sidebar Toggle */}
          <div>
            <h3 className="text-[length:var(--text-lg)] font-[var(--font-weight-semibold)] mb-3">Mail Sidebar Header</h3>
            <button className="flex items-center justify-between w-full max-w-xs group hover:bg-[var(--primary-tint-5)] rounded-[var(--radius-sm)] px-2 py-1 transition-all">
              <span className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)] group-hover:text-[color:var(--text-primary)]">
                Folders
              </span>
              <ChevronLeft className="w-3 h-3 text-[color:var(--text-secondary)] group-hover:text-[color:var(--text-primary)] opacity-0 group-hover:opacity-100 transition-all" />
            </button>
            <p className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)] mt-2">
              Header row doubles as toggle with inline chevron
            </p>
          </div>

          <Separator />

          {/* Right Context Panel Toggle */}
          <div>
            <h3 className="text-[length:var(--text-lg)] font-[var(--font-weight-semibold)] mb-3">Right Context Panel</h3>
            <div className="flex items-center gap-4">
              <div 
                className="w-6 h-16 border border-[var(--border-default)] bg-[var(--bg-surface)] flex items-center justify-center hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer group rounded-[var(--radius-sm)]"
                onClick={() => setRightPaneVisible(!rightPaneVisible)}
              >
                <GripVertical className="w-3 h-3 text-[color:var(--text-secondary)] group-hover:text-[color:var(--text-primary)] transition-colors" />
              </div>
              <span className="text-[length:var(--text-sm)]">
                Slim 24px handle with grip dots (with tooltip)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Tokens */}
      <Card className="bg-[var(--bg-surface)]">
        <CardHeader>
          <CardTitle>Component-Specific Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Email Modal */}
            <div className="p-4 border border-[var(--border-default)] rounded-[var(--radius-md)]">
              <h4 className="font-[var(--font-weight-medium)] mb-2">Email Modal</h4>
              <div className="text-[length:var(--text-sm)] space-y-1">
                <div>Width: 700px</div>
                <div>Max Width: 90vw</div>
                <div>Header: 56px</div>
                <div>Footer: 64px</div>
              </div>
            </div>

            {/* Compose Modal */}
            <div className="p-4 border border-[var(--border-default)] rounded-[var(--radius-md)]">
              <h4 className="font-[var(--font-weight-medium)] mb-2">Compose Modal</h4>
              <div className="text-[length:var(--text-sm)] space-y-1">
                <div>Width: 600px</div>
                <div>Height: 500px</div>
                <div>Toolbar: 48px</div>
                <div>Editor Min: 200px</div>
              </div>
            </div>

            {/* TriPane Layout */}
            <div className="p-4 border border-[var(--border-default)] rounded-[var(--radius-md)]">
              <h4 className="font-[var(--font-weight-medium)] mb-2">TriPane Layout</h4>
              <div className="text-[length:var(--text-sm)] space-y-1">
                <div>Left: 280px</div>
                <div>Right: 320px</div>
                <div>Center Min: 400px</div>
                <div>Gap: 0px</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mail Component Examples */}
      <Card className="bg-[var(--bg-surface)]">
        <CardHeader>
          <CardTitle>Mail Component Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email List Item */}
          <div className="border border-[var(--border-default)] rounded-[var(--radius-md)] overflow-hidden">
            <div className="h-[var(--mail-row-height)] px-[var(--mail-row-padding-x)] py-[var(--mail-row-padding-y)] flex items-center gap-[var(--mail-row-gap)] hover:bg-[var(--mail-row-hover-bg)] transition-colors">
              <div className="w-[var(--mail-avatar-size)] h-[var(--mail-avatar-size)] bg-[var(--primary-tint-10)] rounded-full flex items-center justify-center">
                <span className="text-[length:var(--text-sm)] text-[color:var(--primary)]">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-[var(--font-weight-medium)] text-[color:var(--text-primary)]">John Doe</span>
                  <Badge variant="secondary" className="text-xs">Work</Badge>
                </div>
                <p className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)] truncate">
                  Sample email preview text that demonstrates...
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                  <Star className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                  <Archive className="w-3 h-3" />
                </Button>
                <span className="text-[length:var(--text-xs)] text-[color:var(--text-secondary)]">2:30 PM</span>
              </div>
            </div>
          </div>

          {/* Email Actions */}
          <div className="flex items-center gap-2 p-4 border border-[var(--border-default)] rounded-[var(--radius-md)]">
            <Button className="bg-[var(--primary)] hover:bg-[var(--primary-hover)]">
              <Reply className="w-4 h-4 mr-2" />
              Reply
            </Button>
            <Button variant="ghost">
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
            <Button variant="ghost" className="text-[color:var(--accent-coral)] hover:text-[color:var(--accent-coral-hover)]">
              <Trash className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}