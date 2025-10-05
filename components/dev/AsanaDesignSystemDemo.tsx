import React from 'react';
import { 
  Star, Heart, Settings, User, Calendar, Mail, 
  CheckCircle, AlertCircle, Info, Zap, Plus
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';

export function AsanaDesignSystemDemo() {
  return (
    <div className="p-[var(--space-8)] space-y-[var(--space-8)] bg-[var(--bg-canvas)] min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-[var(--space-8)]">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-[var(--space-2)]">
            LibreOllama Design System
          </h1>
          <p className="text-[var(--text-secondary)]">
            Asana + Sunsama inspired design with soft lilac accents and comfortable spacing
          </p>
        </div>

        {/* Color Palette */}
        <Card className="mb-[var(--space-8)]">
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--space-4)]">
              <div className="space-y-[var(--space-2)]">
                <div className="w-full h-16 rounded-[var(--radius-sm)] bg-[var(--primary)]"></div>
                <div className="text-sm">
                  <div className="font-medium">Primary</div>
                  <div className="text-[var(--text-secondary)]">hsl(267 60% 70%)</div>
                </div>
              </div>
              <div className="space-y-[var(--space-2)]">
                <div className="w-full h-16 rounded-[var(--radius-sm)] bg-[var(--success)]"></div>
                <div className="text-sm">
                  <div className="font-medium">Success</div>
                  <div className="text-[var(--text-secondary)]">hsl(160 50% 60%)</div>
                </div>
              </div>
              <div className="space-y-[var(--space-2)]">
                <div className="w-full h-16 rounded-[var(--radius-sm)] bg-[var(--warning)]"></div>
                <div className="text-sm">
                  <div className="font-medium">Warning</div>
                  <div className="text-[var(--text-secondary)]">hsl(38 85% 63%)</div>
                </div>
              </div>
              <div className="space-y-[var(--space-2)]">
                <div className="w-full h-16 rounded-[var(--radius-sm)] bg-[var(--danger)]"></div>
                <div className="text-sm">
                  <div className="font-medium">Danger</div>
                  <div className="text-[var(--text-secondary)]">hsl(0 65% 65%)</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Button Variants */}
        <Card className="mb-[var(--space-8)]">
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-[var(--space-4)]">
              <Button variant="solid">
                <Star className="w-4 h-4" />
                Solid Primary
              </Button>
              <Button variant="tonal">
                <Heart className="w-4 h-4" />
                Tonal
              </Button>
              <Button variant="ghost">
                <Settings className="w-4 h-4" />
                Ghost
              </Button>
              <Button variant="outline">
                <User className="w-4 h-4" />
                Outline
              </Button>
              <Button variant="danger">
                <AlertCircle className="w-4 h-4" />
                Danger
              </Button>
            </div>
            
            <div className="mt-[var(--space-4)] flex flex-wrap gap-[var(--space-4)]">
              <Button variant="solid" size="sm">Small</Button>
              <Button variant="solid" size="default">Default</Button>
              <Button variant="solid" size="lg">Large</Button>
              <Button variant="solid" size="compact">Compact</Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Pills and Tags */}
        <Card className="mb-[var(--space-8)]">
          <CardHeader>
            <CardTitle>Status Pills & Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-[var(--space-3)]">
              <Badge 
                className="bg-[var(--primary-tint-15)] text-[var(--primary)] border-none"
              >
                In Progress
              </Badge>
              <Badge 
                className="text-[var(--success)]" 
                style={{ backgroundColor: 'hsl(160 50% 60% / 0.15)' }}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed
              </Badge>
              <Badge 
                className="text-[var(--warning)]" 
                style={{ backgroundColor: 'hsl(38 85% 63% / 0.15)' }}
              >
                High Priority
              </Badge>
              <Badge 
                className="text-[var(--danger)]" 
                style={{ backgroundColor: 'hsl(0 65% 65% / 0.15)' }}
              >
                Urgent
              </Badge>
              <Badge 
                className="text-[var(--info)]" 
                style={{ backgroundColor: 'hsl(200 70% 65% / 0.15)' }}
              >
                <Info className="w-3 h-3 mr-1" />
                Review
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Cards & Surfaces */}
        <div className="grid md:grid-cols-2 gap-[var(--space-6)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-[var(--space-2)]">
                <Mail className="w-5 h-5 text-[var(--primary)]" />
                Email Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-[var(--space-4)]">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Unread</span>
                  <Badge className="bg-[var(--primary-tint-15)] text-[var(--primary)]">12</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Drafts</span>
                  <Badge variant="secondary">3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Sent Today</span>
                  <span className="text-[var(--text-primary)]">8</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-[var(--space-2)]">
                <Calendar className="w-5 h-5 text-[var(--success)]" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-[var(--space-3)]">
                <div className="flex items-start gap-[var(--space-3)]">
                  <div className="w-2 h-2 rounded-full bg-[var(--primary)] mt-2"></div>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">Team Standup</div>
                    <div className="text-sm text-[var(--text-secondary)]">9:00 AM - 9:30 AM</div>
                  </div>
                </div>
                <div className="flex items-start gap-[var(--space-3)]">
                  <div className="w-2 h-2 rounded-full bg-[var(--success)] mt-2"></div>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">Design Review</div>
                    <div className="text-sm text-[var(--text-secondary)]">2:00 PM - 3:00 PM</div>
                  </div>
                </div>
                <div className="flex items-start gap-[var(--space-3)]">
                  <div className="w-2 h-2 rounded-full bg-[var(--warning)] mt-2"></div>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">Client Call</div>
                    <div className="text-sm text-[var(--text-secondary)]">4:00 PM - 5:00 PM</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Elements */}
        <Card className="mt-[var(--space-8)]">
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-[var(--space-6)]">
              <div className="space-y-[var(--space-4)]">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-[var(--space-2)]">
                    Email Address
                  </label>
                  <Input 
                    type="email" 
                    placeholder="Enter your email"
                    className="bg-[var(--bg-surface)] border-[var(--border-default)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-[var(--space-2)]">
                    Search
                  </label>
                  <Input 
                    type="search" 
                    placeholder="Search..."
                    className="bg-[var(--input-background)] border-[var(--border-subtle)]"
                  />
                </div>
              </div>
              
              <div className="space-y-[var(--space-4)]">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-[var(--space-3)]">
                    Team Members
                  </label>
                  <div className="flex items-center gap-[var(--space-3)]">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-[var(--primary-tint-15)] text-[var(--primary)]">
                        SC
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-[var(--success)] text-white text-xs">
                        AR
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-[var(--warning)] text-white text-xs">
                        MJ
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography Scale */}
        <Card>
          <CardHeader>
            <CardTitle>Typography Scale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-[var(--space-4)]">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Heading 1 - 24px Bold</h1>
              <p className="text-[var(--text-secondary)] text-sm">Used for page titles and major sections</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Heading 2 - 20px Semibold</h2>
              <p className="text-[var(--text-secondary)] text-sm">Used for section headers and card titles</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-[var(--text-primary)]">Heading 3 - 18px Medium</h3>
              <p className="text-[var(--text-secondary)] text-sm">Used for subsections and widget headers</p>
            </div>
            <div>
              <p className="text-base text-[var(--text-primary)]">Body Text - 16px Regular</p>
              <p className="text-[var(--text-secondary)] text-sm">Primary text for content and descriptions</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Small Text - 14px Regular</p>
              <p className="text-[var(--text-secondary)] text-xs">Used for metadata and secondary information</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}