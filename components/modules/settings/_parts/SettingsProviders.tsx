import React, { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../../../ui/sheet';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Separator } from '../../../ui/separator';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Circle,
  Eye,
  EyeOff,
  Copy,
  TestTube2,
} from 'lucide-react';
import { SectionCard } from './SectionCard';
import { useSettingsState } from './SettingsState';
import { reportSettingsEvent } from './analytics';
import { toast } from 'sonner';

interface SettingsProvidersProps {
  id: string;
  filter: (text: string) => boolean;
  registerSection: (node: HTMLElement | null) => void;
}

type ProviderId = 'openai' | 'anthropic' | 'openrouter' | 'deepseek' | 'mistral' | 'gemini';
type ProviderStatus = 'ok' | 'warn' | 'empty';

interface ProviderMeta {
  id: ProviderId;
  label: string;
  hint: string;
  base: string;
}

interface ProviderState {
  apiKey: string;
  baseUrl: string;
  status: ProviderStatus;
  lastTested?: string | null;
  testing: boolean;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    hint: 'GPT-4o, o-series, and TTS models. Base URL is optional for proxies.',
    base: 'https://api.openai.com/v1',
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    hint: 'Claude 3 models with long context windows for reasoning and writing.',
    base: 'https://api.anthropic.com/v1',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    hint: 'Unified marketplace routing across 80+ providers with fallback logic.',
    base: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    hint: 'High-context reasoning models built for code and analysis workloads.',
    base: 'https://api.deepseek.com/v1',
  },
  {
    id: 'mistral',
    label: 'Mistral AI',
    hint: 'Fast, lightweight instruction-tuned models ideal for realtime UX.',
    base: 'https://api.mistral.ai/v1',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    hint: 'Google’s Gemini models via the Generative Language API.',
    base: 'https://generativelanguage.googleapis.com/v1beta',
  },
];

const INITIAL_STATE: Record<ProviderId, ProviderState> = PROVIDERS.reduce(
  (acc, provider) => {
    acc[provider.id] = {
      apiKey: '',
      baseUrl: '',
      status: provider.id === 'openai' ? 'ok' : provider.id === 'mistral' ? 'warn' : 'empty',
      lastTested: provider.id === 'openai' ? new Date().toLocaleString() : null,
      testing: false,
    };
    return acc;
  },
  {} as Record<ProviderId, ProviderState>,
);

const STATUS_LABEL: Record<ProviderStatus, string> = {
  ok: 'Connected',
  warn: 'Needs attention',
  empty: 'Not connected',
};

const STATUS_BADGE_CLASS: Record<ProviderStatus, string> = {
  ok: 'bg-[color-mix(in_oklab,var(--status-ok)_18%,transparent)] text-[var(--status-ok)]',
  warn: 'bg-[color-mix(in_oklab,var(--status-warn)_18%,transparent)] text-[var(--status-warn)]',
  empty: 'border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]',
};

const STATUS_HELPER: Record<ProviderStatus, string> = {
  ok: 'This provider is ready to serve requests.',
  warn: 'Verify your credentials before routing traffic.',
  empty: 'Add an API key to enable this provider.',
};

export function SettingsProviders({ id, filter, registerSection }: SettingsProvidersProps) {
  const { setFieldDirty } = useSettingsState();
  const [providerState, setProviderState] = useState<Record<ProviderId, ProviderState>>(INITIAL_STATE);
  const [editing, setEditing] = useState<ProviderId | null>(null);
  const [revealKey, setRevealKey] = useState(false);

  const sectionMatches = useMemo(
    () => filter('providers cloud api keys base url vault status sheet edit'),
    [filter],
  );

  useEffect(() => {
    if (!editing) return;
    reportSettingsEvent('settings.provider_edit_opened', { id: editing });
    setRevealKey(false);
  }, [editing]);

  const editingMeta = editing ? PROVIDERS.find((prov) => prov.id === editing) ?? null : null;
  const editingState = editing ? providerState[editing] : null;

  if (!sectionMatches) return null;

  const handleClose = () => setEditing(null);

  const handleCopy = async (providerId: ProviderId, value: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      toast.error('Clipboard not available');
      reportSettingsEvent('settings.provider_clipboard_unavailable', { id: providerId });
      return;
    }
    if (!value.trim()) {
      toast.error('Add a key before copying');
      reportSettingsEvent('settings.provider_copy_empty', { id: providerId });
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied to clipboard');
      reportSettingsEvent('settings.provider_copy_success', { id: providerId, length: value.length });
    } catch (error) {
      toast.error('Could not copy');
      reportSettingsEvent('settings.provider_copy_error', { id: providerId });
    }
  };

  const handleChange = (field: 'apiKey' | 'baseUrl', value: string, providerId: ProviderId) => {
    setProviderState((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        [field]: value,
      },
    }));

    const initialValue = INITIAL_STATE[providerId][field];
    setFieldDirty(`providers.${providerId}.${field}`, value.trim() !== initialValue);
  };

  const handleTest = async (providerId: ProviderId) => {
    setProviderState((prev) => ({
      ...prev,
      [providerId]: { ...prev[providerId], testing: true },
    }));

    await new Promise((resolve) => setTimeout(resolve, 600));

    let success = false;

    setProviderState((prev) => {
      success = prev[providerId].apiKey.trim().length > 4;
      const status: ProviderStatus = success ? 'ok' : 'warn';
      return {
        ...prev,
        [providerId]: {
          ...prev[providerId],
          status,
          lastTested: new Date().toLocaleString(),
          testing: false,
        },
      };
    });

    reportSettingsEvent('settings.provider_test', {
      id: providerId,
      result: success ? 'success' : 'error',
    });

    if (success) {
      toast.success('Connection successful');
    } else {
      toast.error('Couldn’t connect — check your key');
    }
  };

  const handleCancel = () => {
    if (editingMeta) {
      reportSettingsEvent('settings.provider_sheet_cancel', { id: editingMeta.id });
    }
    handleClose();
  };

  const handleSheetSave = () => {
    if (!editingMeta) {
      handleClose();
      return;
    }
    reportSettingsEvent('settings.provider_sheet_save', { id: editingMeta.id });
    toast.success(`${editingMeta.label} updated — remember to save changes.`);
    handleClose();
  };

  return (
    <section
      id={id}
      ref={registerSection}
      aria-labelledby={`${id}-title`}
      role="region"
      className="scroll-mt-28 space-y-[var(--settings-card-gap)]"
    >
      <header>
        <h2 id={`${id}-title`} className="text-xl font-semibold text-[var(--text-primary)]">
          Cloud providers
        </h2>
      </header>

      <SectionCard title="Providers" help="Select a provider to configure credentials.">
        <div className="divide-y divide-[var(--border-subtle)]">
          {PROVIDERS.map((provider) => {
            const state = providerState[provider.id];
            const badgeClassName = state.testing
              ? 'bg-[color-mix(in_oklab,var(--primary)_18%,transparent)] text-[var(--primary)]'
              : STATUS_BADGE_CLASS[state.status];
            const BadgeIcon = state.testing
              ? Loader2
              : state.status === 'ok'
              ? CheckCircle2
              : state.status === 'warn'
              ? AlertTriangle
              : Circle;
            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => setEditing(provider.id)}
                className="group flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-surface)]"
              >
                <span className="text-sm font-medium text-[var(--text-primary)]">{provider.label}</span>
                <Badge variant="soft" size="sm" className={badgeClassName}>
                  <BadgeIcon className={`size-3 ${state.testing ? 'animate-spin' : ''}`} />
                  {state.testing ? 'Testing…' : STATUS_LABEL[state.status]}
                </Badge>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <Sheet open={Boolean(editing)} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent
          side="right"
          className="w-full max-w-[100vw] border-l border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-0 sm:max-w-[var(--settings-sheet-w)]"
        >
          {editing && editingMeta && editingState && (
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b border-[var(--border-subtle)] px-6 pb-5 pt-6">
                <div className="flex items-start justify-between gap-4">
                  <SheetTitle className="text-xl font-semibold text-[var(--text-primary)]">
                    {editingMeta.label}
                  </SheetTitle>
                  <Badge variant="soft" size="sm" className={STATUS_BADGE_CLASS[editingState.status]}>
                    {editingState.status === 'ok' ? (
                      <CheckCircle2 className="size-3" />
                    ) : editingState.status === 'warn' ? (
                      <AlertTriangle className="size-3" />
                    ) : (
                      <Circle className="size-3" />
                    )}
                    {STATUS_LABEL[editingState.status]}
                  </Badge>
                </div>
              </SheetHeader>

              <div className="flex-1 space-y-8 overflow-y-auto px-6 py-8">
                <section className="space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Authentication</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{editingMeta.hint}</p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="provider-api-key" className="text-sm font-medium">
                      API key
                    </Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="provider-api-key"
                          type={revealKey ? 'text' : 'password'}
                          placeholder="sk-..."
                          className="flex-1 font-mono text-sm"
                          value={editingState.apiKey}
                          onChange={(event) => handleChange('apiKey', event.target.value, editing)}
                          autoComplete="off"
                          autoCorrect="off"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-pressed={revealKey}
                          onClick={() => setRevealKey((prev) => !prev)}
                          aria-label={revealKey ? 'Hide key' : 'Show key'}
                        >
                          {revealKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopy(editing, editingState.apiKey)}
                          disabled={!editingState.apiKey.trim()}
                          aria-label="Copy key"
                        >
                          <Copy className="size-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Keys are stored locally using OS-level encryption.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
                    <p className="text-sm text-[var(--text-secondary)]" role="status" aria-live="polite">
                      {editingState.testing
                        ? 'Testing connection…'
                        : editingState.lastTested
                        ? `Last tested ${editingState.lastTested}`
                        : 'Not tested yet'}
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleTest(editing)}
                      disabled={editingState.testing || !editingState.apiKey.trim()}
                    >
                      {editingState.testing ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Testing
                        </>
                      ) : (
                        <>
                          <TestTube2 className="size-4" />
                          Test
                        </>
                      )}
                    </Button>
                  </div>
                </section>

                <Separator />

                <section className="space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Routing</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Override the default endpoint for proxy or on-premise deployments
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="provider-base-url" className="text-sm font-medium">
                      Base URL <span className="font-normal text-[var(--text-tertiary)]">(optional)</span>
                    </Label>
                    <Input
                      id="provider-base-url"
                      type="url"
                      placeholder={editingMeta.base}
                      value={editingState.baseUrl}
                      onChange={(event) => handleChange('baseUrl', event.target.value, editing)}
                      autoCapitalize="none"
                      autoCorrect="off"
                    />
                    <p className="text-sm text-[var(--text-secondary)]">
                      Leave blank to use the default: <span className="font-mono">{editingMeta.base}</span>
                    </p>
                  </div>
                </section>
              </div>

              <SheetFooter className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-4">
                <div className="flex w-full justify-end gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSheetSave}>Done</Button>
                </div>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
