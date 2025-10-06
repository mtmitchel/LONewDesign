import * as React from 'react';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Checkbox } from '../../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select';
import { Button } from '../../ui/button';
import { cn } from '../../ui/utils';
import { Eye, Settings, Wrench, Key } from 'lucide-react';

type ListType = 'enhanced' | 'compact' | 'minimal';
type ViewMode = 'threaded' | 'flat';

export type MailSettings = {
  viewMode: ViewMode;
  listType: ListType;
  compact: boolean;
  showPreview: boolean;
  markReadOnOpen: boolean;
  autoArchiveAfterReply: boolean;
  loadImages: boolean;
  smartIconFallbacks: boolean;
  enhancedRenderer: boolean;
};

export const DEFAULT_MAIL_SETTINGS: MailSettings = {
  viewMode: 'threaded',
  listType: 'enhanced',
  compact: false,
  showPreview: true,
  markReadOnOpen: true,
  autoArchiveAfterReply: false,
  loadImages: true,
  smartIconFallbacks: true,
  enhancedRenderer: false
};

export const RECOMMENDED_MAIL_SETTINGS: MailSettings = {
  ...DEFAULT_MAIL_SETTINGS,
  showPreview: true,
  compact: false
};

type SettingsEvent = {
  name: string;
  detail: any;
};

type Props = {
  value: MailSettings;
  onChange: (next: MailSettings) => void;
  onResetDefaults?: () => void;
  onRestoreRecommended?: () => void;
  onSettingsEvent?: (event: SettingsEvent) => void;
  className?: string;
};

export default function RightContextSettings({
  value,
  onChange,
  onResetDefaults,
  onRestoreRecommended,
  onSettingsEvent,
  className
}: Props) {
  const emit = React.useCallback(
    (event: SettingsEvent) => {
      onSettingsEvent?.(event);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(event.name, { detail: event.detail }));
      }
    },
    [onSettingsEvent]
  );

  const set = React.useCallback(
    <K extends keyof MailSettings>(key: K, next: MailSettings[K], event?: SettingsEvent) => {
      const nextSettings = { ...value, [key]: next } as MailSettings;
      onChange(nextSettings);
      if (event) emit(event);
    },
    [emit, onChange, value]
  );

  const handleResetDefaults = React.useCallback(() => {
    onResetDefaults ? onResetDefaults() : onChange({ ...DEFAULT_MAIL_SETTINGS });
    emit({ name: 'settings_reset', detail: { variant: 'defaults' } });
  }, [emit, onChange, onResetDefaults]);

  const toggleClass =
    'border border-[var(--primary-tint-20)] data-[state=unchecked]:bg-[var(--primary-tint-15)] data-[state=checked]:bg-[var(--primary)]';

  return (
    <div
      role="region"
      aria-label="Mail settings"
      className={cn(
        'px-6 py-6 overflow-x-hidden',
        className
      )}
    >
      {/* View settings */}
      <div className="pb-8 mb-8 border-b border-[var(--border-divider)]">
        <div className="flex items-center gap-2 mb-6">
          <Eye size={16} className="text-[var(--primary)] opacity-60" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">View settings</h3>
        </div>
        
        <div className="space-y-6">
          {/* Message view - special layout for radios */}
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)] mb-1">Message view</div>
            <div className="text-sm text-[var(--text-secondary)] mb-3">
              Choose how messages are grouped.
            </div>
            <RadioGroup
              value={value.viewMode}
              onValueChange={(v) =>
                set('viewMode', v as ViewMode, {
                  name: 'settings_view_changed',
                  detail: { mode: v as ViewMode }
                })
              }
              className="flex items-center gap-6"
            >
              <Label
                htmlFor="mv-threaded"
                className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--text-secondary)]"
              >
                <RadioGroupItem
                  id="mv-threaded"
                  value="threaded"
                  className="peer relative size-5 border-2 border-[var(--primary-tint-20)] bg-transparent transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-transparent after:hidden after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:size-2 after:rounded-full after:bg-[var(--primary)] data-[state=checked]:after:block"
                />
                <span className="transition-colors peer-data-[state=checked]:text-[var(--text-primary)]">Threaded</span>
              </Label>
              <Label
                htmlFor="mv-flat"
                className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--text-secondary)]"
              >
                <RadioGroupItem
                  id="mv-flat"
                  value="flat"
                  className="peer relative size-5 border-2 border-[var(--primary-tint-20)] bg-transparent transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-transparent after:hidden after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:size-2 after:rounded-full after:bg-[var(--primary)] data-[state=checked]:after:block"
                />
                <span className="transition-colors peer-data-[state=checked]:text-[var(--text-primary)]">Flat</span>
              </Label>
            </RadioGroup>
          </div>

          {/* List type */}
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)] mb-1">List type</div>
            <div className="text-sm text-[var(--text-secondary)] mb-3">
              Select layout for the message list.
            </div>
            <Select
              value={value.listType}
              onValueChange={(v) =>
                set('listType', v as ListType, {
                  name: 'settings_list_type_changed',
                  detail: { value: v as ListType }
                })
              }
            >
            <SelectTrigger className="w-full border border-[var(--primary-tint-20)] bg-[var(--primary-tint-5)] text-[var(--text-primary)] transition-colors hover:border-[var(--primary-tint-15)] hover:bg-[var(--primary-tint-10)] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] [&_svg]:text-[var(--text-secondary)] hover:[&_svg]:text-[var(--primary)]">
                <SelectValue placeholder="Choose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enhanced">Enhanced</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Compact view */}
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="text-sm font-medium text-[var(--text-primary)] mb-1">Compact view</div>
              <div className="text-sm text-[var(--text-secondary)]">
                Show more messages in less space.
              </div>
            </div>
            <Switch
              checked={value.compact}
              onCheckedChange={(v) =>
                set('compact', v, {
                  name: 'settings_switch_toggled',
                  detail: { key: 'compact', value: v }
                })
              }
              aria-label="Compact view"
              className={toggleClass}
            />
          </div>

          {/* Show message preview */}
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="text-sm font-medium text-[var(--text-primary)] mb-1">Show message preview</div>
              <div className="text-sm text-[var(--text-secondary)]">
                Display snippet of message content.
              </div>
            </div>
            <Switch
              checked={value.showPreview}
              onCheckedChange={(v) =>
                set('showPreview', v, {
                  name: 'settings_switch_toggled',
                  detail: { key: 'showPreview', value: v }
                })
              }
              aria-label="Show message preview"
              className={toggleClass}
            />
          </div>
        </div>
      </div>

      {/* Behavior */}
      <div className="pb-8 mb-8 border-b border-[var(--border-divider)]">
        <div className="flex items-center gap-2 mb-6">
          <Settings size={16} className="text-[var(--primary)] opacity-60" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Behavior</h3>
        </div>
        
        <div className="space-y-6">
          {/* Auto-mark as read */}
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="text-sm font-medium text-[var(--text-primary)] mb-1">Auto-mark as read</div>
              <div className="text-sm text-[var(--text-secondary)]">
                Automatically mark messages as read when opened.
              </div>
            </div>
            <Checkbox 
              checked={value.markReadOnOpen} 
              onCheckedChange={(v) => set("markReadOnOpen", !!v, {
                name: 'settings_checkbox_toggled',
                detail: { key: 'markReadOnOpen', value: !!v }
              })} 
              aria-label="Auto-mark as read" 
              className="data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)] data-[state=checked]:text-white"
            />
          </div>

          {/* Auto-archive after reply */}
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="text-sm font-medium text-[var(--text-primary)] mb-1">Auto-archive after reply</div>
              <div className="text-sm text-[var(--text-secondary)]">
                Automatically archive conversations after replying.
              </div>
            </div>
            <Checkbox 
              checked={value.autoArchiveAfterReply} 
              onCheckedChange={(v) => set("autoArchiveAfterReply", !!v, {
                name: 'settings_checkbox_toggled',
                detail: { key: 'autoArchiveAfterReply', value: !!v }
              })} 
              aria-label="Auto-archive after reply" 
              className="data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)] data-[state=checked]:text-white"
            />
          </div>

          {/* Always show images */}
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="text-sm font-medium text-[var(--text-primary)] mb-1">Always show images</div>
              <div className="text-sm text-[var(--text-secondary)]">
                Automatically load images in messages.
              </div>
            </div>
            <Switch
              checked={value.loadImages}
              onCheckedChange={(v) =>
                set('loadImages', v, {
                  name: 'settings_switch_toggled',
                  detail: { key: 'loadImages', value: v }
                })
              }
              aria-label="Always show images"
              className={toggleClass}
            />
          </div>
        </div>
      </div>

      {/* Advanced */}
      <div className="pb-8 mb-8 border-b border-[var(--border-divider)]">
        <div className="flex items-center gap-2 mb-6">
          <Wrench size={16} className="text-[var(--primary)] opacity-60" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Advanced</h3>
        </div>
        
        <div className="space-y-6">
          {/* Smart icon fallbacks */}
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="text-sm font-medium text-[var(--text-primary)] mb-1">Smart icon fallbacks</div>
              <div className="text-sm text-[var(--text-secondary)]">
                Replace broken footer icons with design-system icons.
              </div>
            </div>
            <Switch
              checked={value.smartIconFallbacks}
              onCheckedChange={(v) =>
                set('smartIconFallbacks', v, {
                  name: 'settings_switch_toggled',
                  detail: { key: 'smartIconFallbacks', value: v }
                })
              }
              aria-label="Smart icon fallbacks"
              className={toggleClass}
            />
          </div>

          {/* Enhanced email renderer */}
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="text-sm font-medium text-[var(--text-primary)] mb-1">Enhanced email renderer (Beta)</div>
              <div className="text-sm text-[var(--text-secondary)]">
                Use advanced rendering for complex emails.
              </div>
            </div>
            <Switch
              checked={value.enhancedRenderer}
              onCheckedChange={(v) =>
                set('enhancedRenderer', v, {
                  name: 'settings_switch_toggled',
                  detail: { key: 'enhancedRenderer', value: v }
                })
              }
              aria-label="Enhanced email renderer"
              className={toggleClass}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Key size={16} className="text-[var(--primary)] opacity-60" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Actions</h3>
        </div>
        
        <Button 
          variant="outline"
          onClick={handleResetDefaults}
          className="w-full"
        >
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
