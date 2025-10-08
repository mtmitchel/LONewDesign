import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Database, 
  HelpCircle,
  ChevronRight,
  Monitor,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  description: string;
}

const settingsSections: SettingsSection[] = [
  {
    id: 'profile',
    title: 'Profile & Account',
    icon: User,
    description: 'Manage your personal information and account settings'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Configure how you receive alerts and updates'
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Palette,
    description: 'Customize the look and feel of your workspace'
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: Shield,
    description: 'Control your data and security preferences'
  },
  {
    id: 'data',
    title: 'Data & Storage',
    icon: Database,
    description: 'Manage your data, backups, and storage options'
  },
  {
    id: 'help',
    title: 'Help & Support',
    icon: HelpCircle,
    description: 'Get help, view documentation, and contact support'
  }
];

export function SettingsModule() {
  const [activeSection, setActiveSection] = useState('profile');
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    taskReminders: true,
    autoSave: true,
    offlineMode: false,
    analytics: true,
    dataSharing: false
  });

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="Alex" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Johnson" className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="alex.johnson@example.com" className="mt-1" />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4">Account Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-[color:var(--text-secondary)]">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Password</Label>
                    <p className="text-sm text-[color:var(--text-secondary)]">Last changed 3 months ago</p>
                  </div>
                  <Button variant="outline">Change</Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4">Email Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email notifications</Label>
                    <p className="text-sm text-[color:var(--text-secondary)]">Receive email updates about your activity</p>
                  </div>
                  <Switch 
                    checked={settings.emailNotifications} 
                    onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly digest</Label>
                    <p className="text-sm text-[color:var(--text-secondary)]">Get a summary of your week every Monday</p>
                  </div>
                  <Switch 
                    checked={settings.weeklyDigest} 
                    onCheckedChange={(checked) => updateSetting('weeklyDigest', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Task reminders</Label>
                    <p className="text-sm text-[color:var(--text-secondary)]">Get reminded about upcoming deadlines</p>
                  </div>
                  <Switch 
                    checked={settings.taskReminders} 
                    onCheckedChange={(checked) => updateSetting('taskReminders', checked)}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4">Push Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Browser notifications</Label>
                    <p className="text-sm text-[color:var(--text-secondary)]">Show notifications in your browser</p>
                  </div>
                  <Switch 
                    checked={settings.pushNotifications} 
                    onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4">Theme</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-[var(--border-default)] rounded-lg cursor-pointer bg-[var(--primary-tint-10)]">
                  <div className="flex items-center gap-3 mb-2">
                    <Sun size={20} className="text-[color:var(--primary)]" />
                    <span className="font-medium text-[color:var(--text-primary)]">Light</span>
                  </div>
                  <p className="text-sm text-[color:var(--text-secondary)]">Bright and clean interface</p>
                </div>
                <div className="p-4 border border-[var(--border-default)] rounded-lg cursor-pointer opacity-60">
                  <div className="flex items-center gap-3 mb-2">
                    <Moon size={20} />
                    <span className="font-medium">Dark</span>
                  </div>
                  <p className="text-sm text-[color:var(--text-secondary)]">Coming soon</p>
                </div>
                <div className="p-4 border border-[var(--border-default)] rounded-lg cursor-pointer opacity-60">
                  <div className="flex items-center gap-3 mb-2">
                    <Monitor size={20} />
                    <span className="font-medium">System</span>
                  </div>
                  <p className="text-sm text-[color:var(--text-secondary)]">Match device preference</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4">Interface</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compact mode</Label>
                    <p className="text-sm text-[color:var(--text-secondary)]">Reduce spacing and padding for more content</p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show tooltips</Label>
                    <p className="text-sm text-[color:var(--text-secondary)]">Display helpful tooltips when hovering</p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4">Data Collection</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Usage analytics</Label>
                    <p className="text-sm text-[color:var(--text-secondary)]">Help improve LibreOllama by sharing usage data</p>
                  </div>
                  <Switch 
                    checked={settings.analytics} 
                    onCheckedChange={(checked) => updateSetting('analytics', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Data sharing</Label>
                    <p className="text-sm text-[color:var(--text-secondary)]">Share anonymized data with partners</p>
                  </div>
                  <Switch 
                    checked={settings.dataSharing} 
                    onCheckedChange={(checked) => updateSetting('dataSharing', checked)}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4">Account Actions</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Export data</Label>
                    <p className="text-sm text-[color:var(--text-secondary)]">Download all your data in JSON format</p>
                  </div>
                  <Button variant="outline">Export</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-[color:var(--error)]">Delete account</Label>
                    <p className="text-sm text-[color:var(--text-secondary)]">Permanently delete your account and data</p>
                  </div>
                  <Button variant="destructive">Delete</Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4">Storage & Sync</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-save</Label>
                    <p className="text-sm text-[color:var(--text-secondary)]">Automatically save your work every few seconds</p>
                  </div>
                  <Switch 
                    checked={settings.autoSave} 
                    onCheckedChange={(checked) => updateSetting('autoSave', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Offline mode</Label>
                    <p className="text-sm text-[color:var(--text-secondary)]">Enable working without an internet connection</p>
                  </div>
                  <Switch 
                    checked={settings.offlineMode} 
                    onCheckedChange={(checked) => updateSetting('offlineMode', checked)}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4">Storage Usage</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[color:var(--text-secondary)]">Notes</span>
                  <span className="font-medium">2.4 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[color:var(--text-secondary)]">Attachments</span>
                  <span className="font-medium">15.7 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[color:var(--text-secondary)]">Canvas drawings</span>
                  <span className="font-medium">8.2 MB</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total used</span>
                  <span className="font-semibold">26.3 MB</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'help':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4">Resources</h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-default)] hover:bg-[var(--primary-tint-10)]/30 transition-colors">
                  <span className="text-[color:var(--text-primary)]">Documentation</span>
                  <ChevronRight size={16} className="text-[color:var(--text-secondary)]" />
                </a>
                <a href="#" className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-default)] hover:bg-[var(--primary-tint-10)]/30 transition-colors">
                  <span className="text-[color:var(--text-primary)]">Keyboard shortcuts</span>
                  <ChevronRight size={16} className="text-[color:var(--text-secondary)]" />
                </a>
                <a href="#" className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-default)] hover:bg-[var(--primary-tint-10)]/30 transition-colors">
                  <span className="text-[color:var(--text-primary)]">Release notes</span>
                  <ChevronRight size={16} className="text-[color:var(--text-secondary)]" />
                </a>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4">Support</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  Contact Support
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Report a Bug  
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Feature Request
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4">About</h3>
              <div className="space-y-2 text-sm text-[color:var(--text-secondary)]">
                <p>LibreOllama v1.0.0</p>
                <p>Built with React and Tailwind CSS</p>
                <p>© 2024 LibreOllama Team</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full bg-[var(--surface)] flex">
      {/* Settings Navigation */}
      <div className="w-80 bg-[var(--elevated)] border-r border-[var(--border-subtle)] flex flex-col">
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <h1 className="text-2xl font-semibold text-[color:var(--text-primary)]">Settings</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left p-4 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-[var(--primary-tint-10)] text-[color:var(--primary)]'
                      : 'text-[color:var(--text-secondary)] hover:bg-[var(--primary-tint-10)]/30 hover:text-[color:var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon size={20} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium mb-1">{section.title}</h3>
                      <p className="text-xs opacity-75 line-clamp-2">{section.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl">
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
}