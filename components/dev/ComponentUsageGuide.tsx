import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Search, 
  Plus, 
  Settings, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Code,
  Palette,
  Layout
} from 'lucide-react';

export function ComponentUsageGuide() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="p-[var(--space-6)] space-y-[var(--space-6)] bg-[var(--bg-canvas)] min-h-screen">
      {/* Header */}
      <div className="space-y-[var(--space-3)]">
        <div className="flex items-center gap-[var(--space-3)]">
          <Code className="w-6 h-6 text-[var(--primary)]" />
          <h1 className="text-[var(--text-primary)]">Component Usage Guide</h1>
          <Badge className="bg-[var(--primary-tint-10)] text-[var(--primary)] border-none">
            Live Examples
          </Badge>
        </div>
        <p className="text-[var(--text-secondary)] max-w-3xl">
          Interactive examples showing how to use LibreOllama's UI components effectively. 
          Each pattern follows our Asana + Sunsama design system principles.
        </p>
      </div>

      <Tabs defaultValue="patterns" className="space-y-[var(--space-6)]">
        <TabsList className="bg-[var(--bg-surface-elevated)]">
          <TabsTrigger value="patterns" className="gap-[var(--space-2)]">
            <Layout className="w-4 h-4" />
            Layout Patterns
          </TabsTrigger>
          <TabsTrigger value="components" className="gap-[var(--space-2)]">
            <Palette className="w-4 h-4" />
            Component Library
          </TabsTrigger>
          <TabsTrigger value="interactions" className="gap-[var(--space-2)]">
            <Settings className="w-4 h-4" />
            Interactions
          </TabsTrigger>
        </TabsList>

        {/* Layout Patterns */}
        <TabsContent value="patterns" className="space-y-[var(--space-6)]">
          
          {/* Card Hierarchy Example */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-[var(--space-2)]">
                <Layout className="w-5 h-5 text-[var(--primary)]" />
                Card Hierarchy & Elevation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-[var(--space-4)]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-4)]">
                
                {/* Canvas Level */}
                <div className="space-y-[var(--space-2)]">
                  <h4 className="text-[var(--text-primary)]">Canvas Level</h4>
                  <div className="bg-[var(--bg-canvas)] p-[var(--space-4)] rounded-[var(--radius-card)] border-2 border-dashed border-[var(--border-subtle)]">
                    <p className="text-[var(--text-secondary)] text-sm">
                      Main app background
                    </p>
                    <code className="text-xs bg-[var(--bg-surface-elevated)] px-2 py-1 rounded">
                      --bg-canvas
                    </code>
                  </div>
                </div>

                {/* Surface Level */}
                <div className="space-y-[var(--space-2)]">
                  <h4 className="text-[var(--text-primary)]">Surface Level</h4>
                  <Card className="bg-[var(--bg-surface)]">
                    <CardContent className="p-[var(--space-4)]">
                      <p className="text-[var(--text-secondary)] text-sm mb-2">
                        Cards, modals, content
                      </p>
                      <code className="text-xs bg-[var(--bg-surface-elevated)] px-2 py-1 rounded">
                        --bg-surface
                      </code>
                    </CardContent>
                  </Card>
                </div>

                {/* Elevated Level */}
                <div className="space-y-[var(--space-2)]">
                  <h4 className="text-[var(--text-primary)]">Elevated Level</h4>
                  <Card className="bg-[var(--bg-surface-elevated)]">
                    <CardContent className="p-[var(--space-4)]">
                      <p className="text-[var(--text-secondary)] text-sm mb-2">
                        Sidebars, dropdowns
                      </p>
                      <code className="text-xs bg-[var(--bg-surface)] px-2 py-1 rounded">
                        --bg-surface-elevated
                      </code>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Spacing System */}
          <Card>
            <CardHeader>
              <CardTitle>8pt Spacing System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-[var(--space-4)]">
                <p className="text-[var(--text-secondary)]">
                  Consistent spacing creates visual rhythm and hierarchy
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--space-4)]">
                  {[
                    { name: 'space-1', value: '4px', use: 'Tight spacing' },
                    { name: 'space-2', value: '8px', use: 'Standard spacing' },
                    { name: 'space-4', value: '16px', use: 'Section spacing' },
                    { name: 'space-6', value: '24px', use: 'Large spacing' }
                  ].map((space) => (
                    <div key={space.name} className="space-y-[var(--space-2)]">
                      <div 
                        className="bg-[var(--primary-tint-10)] border-l-4 border-[var(--primary)]"
                        style={{ height: space.value, minHeight: '20px' }}
                      />
                      <div>
                        <code className="text-xs bg-[var(--bg-surface-elevated)] px-2 py-1 rounded">
                          {space.name}
                        </code>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          {space.value} - {space.use}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Component Library */}
        <TabsContent value="components" className="space-y-[var(--space-6)]">
          
          {/* Button Variants */}
          <Card>
            <CardHeader>
              <CardTitle>Button Patterns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-[var(--space-4)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-6)]">
                
                <div className="space-y-[var(--space-3)]">
                  <h4 className="text-[var(--text-primary)]">Action Hierarchy</h4>
                  <div className="flex flex-wrap gap-[var(--space-2)]">
                    <Button variant="default" size="sm">
                      <Plus className="w-4 h-4" />
                      Primary Action
                    </Button>
                    <Button variant="outline" size="sm">
                      Secondary
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                      Subtle
                    </Button>
                    <Button variant="tonal" size="sm">
                      <Star className="w-4 h-4" />
                      Featured
                    </Button>
                  </div>
                </div>

                <div className="space-y-[var(--space-3)]">
                  <h4 className="text-[var(--text-primary)]">Sizes</h4>
                  <div className="flex flex-wrap items-center gap-[var(--space-2)]">
                    <Button size="sm">Small</Button>
                    <Button>Default</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-[var(--bg-surface-elevated)] p-[var(--space-4)] rounded-[var(--radius-card)]">
                <h5 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  Usage Guidelines
                </h5>
                <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                  <li>• <strong>Default:</strong> Primary actions (Save, Send, Create)</li>
                  <li>• <strong>Outline:</strong> Secondary actions (Cancel, Back)</li>
                  <li>• <strong>Ghost:</strong> Subtle actions (Edit, More options)</li>
                  <li>• <strong>Tonal:</strong> Featured functionality, highlights</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Status & Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Feedback Patterns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-[var(--space-4)]">
              <div className="grid gap-[var(--space-4)]">
                
                <Alert className="border-[var(--success)] bg-[var(--success)]/5">
                  <CheckCircle className="h-4 w-4 text-[var(--success)]" />
                  <AlertDescription className="text-[var(--success)]">
                    <strong>Success:</strong> Your changes have been saved successfully.
                  </AlertDescription>
                </Alert>

                <Alert className="border-[var(--warning)] bg-[var(--warning)]/5">
                  <AlertCircle className="h-4 w-4 text-[var(--warning)]" />
                  <AlertDescription className="text-[var(--warning)]">
                    <strong>Warning:</strong> This action cannot be undone.
                  </AlertDescription>
                </Alert>

                <Alert className="border-[var(--info)] bg-[var(--info)]/5">
                  <Info className="h-4 w-4 text-[var(--info)]" />
                  <AlertDescription className="text-[var(--info)]">
                    <strong>Info:</strong> New features are available in this update.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Badge Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Badge & Status Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-[var(--space-2)]">
                <Badge className="bg-[var(--success)] text-white">Active</Badge>
                <Badge className="bg-[var(--warning)] text-white">Pending</Badge>
                <Badge className="bg-[var(--danger)] text-white">Error</Badge>
                <Badge className="bg-[var(--primary-tint-10)] text-[var(--primary)] border-none">
                  Featured
                </Badge>
                <Badge variant="outline">Draft</Badge>
                <Badge variant="secondary">Archive</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interactions */}
        <TabsContent value="interactions" className="space-y-[var(--space-6)]">
          
          {/* Search Pattern */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Input Patterns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-[var(--space-4)]">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search components, patterns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[var(--bg-surface)] border-[var(--border-default)]"
                />
              </div>
              
              {searchQuery && (
                <div className="bg-[var(--bg-surface-elevated)] p-[var(--space-3)] rounded-[var(--radius-card)] border border-[var(--border-subtle)]">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Searching for: <strong className="text-[var(--text-primary)]">"{searchQuery}"</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal Pattern */}
          <Card>
            <CardHeader>
              <CardTitle>Dialog & Modal Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="w-4 h-4" />
                    Open Settings Dialog
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[var(--bg-surface)]">
                  <DialogHeader>
                    <DialogTitle>Component Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-[var(--space-4)]">
                    <p className="text-[var(--text-secondary)]">
                      Configure how components behave in your application.
                    </p>
                    <div className="space-y-[var(--space-3)]">
                      <div>
                        <label className="text-sm font-medium text-[var(--text-primary)] mb-1 block">
                          Theme Preference
                        </label>
                        <Input placeholder="Auto" className="bg-[var(--bg-surface-elevated)]" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[var(--text-primary)] mb-1 block">
                          Animation Speed
                        </label>
                        <Input placeholder="Normal" className="bg-[var(--bg-surface-elevated)]" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-[var(--space-2)]">
                      <Button variant="outline" size="sm">Cancel</Button>
                      <Button size="sm">Save Changes</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card className="bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)]">
        <CardContent className="p-[var(--space-4)]">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[var(--text-primary)] mb-1">Design System Status</h4>
              <p className="text-sm text-[var(--text-secondary)]">
                All components follow WCAG AA accessibility standards
              </p>
            </div>
            <Badge className="bg-[var(--success)] text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              Validated
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}