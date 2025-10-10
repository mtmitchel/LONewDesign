import React, { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
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
import {
  ProviderConfig,
  ProviderId,
  useProviderSettings,
} from '../state/providerSettings';
import { getModelMetadata, getTierLabel, getTierBadgeClass, sortModelsByTier } from '../state/mistralModelMetadata';

interface SettingsProvidersProps {
  id: string;
  filter: (text: string) => boolean;
  registerSection: (node: HTMLElement | null) => void;
}

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

type ProviderBaseline = Record<ProviderId, { apiKey: string; baseUrl: string }>;

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
  {
    id: 'deepl',
    label: 'DeepL',
    hint: 'Professional translation API with native formality support. Use https://api-free.deepl.com for Free plan.',
    base: 'https://api-free.deepl.com',
  },
  {
    id: 'glm',
    label: 'GLM (ZhipuAI)',
    hint: 'GLM-4.6 model with 200K context window. OpenAI-compatible API for chat, coding, and reasoning tasks.',
    base: 'https://api.z.ai/api/paas/v4',
  },
];


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

type MistralTestResult = {
  ok: boolean;
  message?: string | null;
};

function isTauriContext(): boolean {
  if (typeof window === 'undefined') return false;
  const candidate = window as unknown as {
    __TAURI_INTERNALS__?: unknown;
    isTauri?: unknown;
    __TAURI__?: unknown;
  };
  return Boolean(candidate.__TAURI_INTERNALS__ ?? candidate.isTauri ?? candidate.__TAURI__);
}

function deriveStatus(providerId: ProviderId, apiKey: string): ProviderStatus {
  if (!apiKey.trim()) {
    return providerId === 'mistral' ? 'warn' : 'empty';
  }
  return 'ok';
}

function buildBaseline(configs: Record<ProviderId, ProviderConfig>): ProviderBaseline {
  return PROVIDERS.reduce((acc, provider) => {
    const config = configs[provider.id];
    acc[provider.id] = {
      apiKey: config?.apiKey ?? '',
      baseUrl: config?.baseUrl ?? '',
    };
    return acc;
  }, {} as ProviderBaseline);
}

function buildViewState(configs: Record<ProviderId, ProviderConfig>): Record<ProviderId, ProviderState> {
  return PROVIDERS.reduce((acc, provider) => {
    const config = configs[provider.id];
    const apiKey = config?.apiKey ?? '';
    const baseUrl = config?.baseUrl ?? '';
    acc[provider.id] = {
      apiKey,
      baseUrl,
      status: deriveStatus(provider.id, apiKey),
      lastTested: null,
      testing: false,
    };
    return acc;
  }, {} as Record<ProviderId, ProviderState>);
}

export function SettingsProviders({ id, filter, registerSection }: SettingsProvidersProps) {
  const { setFieldDirty } = useSettingsState();
  const { providers, updateProvider, resetProvider, assistantProvider, assistantModel, setAssistantProvider, setAssistantModel } = useProviderSettings(
    useShallow((state) => ({
      providers: state.providers,
      updateProvider: state.updateProvider,
      resetProvider: state.resetProvider,
      assistantProvider: state.assistantProvider,
      assistantModel: state.assistantModel,
      setAssistantProvider: state.setAssistantProvider,
      setAssistantModel: state.setAssistantModel,
    }))
  );
  
  const [providerState, setProviderState] = useState<Record<ProviderId, ProviderState>>(() =>
    buildViewState(providers),
  );
  
  // Debug: Log which providers have API keys
  React.useEffect(() => {
    console.log('[SettingsProviders] Provider API keys:', Object.entries(providers).reduce((acc, [id, config]) => {
      acc[id] = config.apiKey ? `${config.apiKey.substring(0, 10)}... (${config.apiKey.length} chars)` : '(empty)';
      return acc;
    }, {} as Record<string, string>));
  }, [providers]);
  
  // Debug: Log providerState status
  React.useEffect(() => {
    console.log('[SettingsProviders] Provider states:', Object.entries(providerState).reduce((acc, [id, state]) => {
      acc[id] = {
        status: state.status,
        lastTested: state.lastTested || '(never)',
        hasApiKey: !!state.apiKey
      };
      return acc;
    }, {} as Record<string, any>));
  }, [providerState]);
  const [baseline, setBaseline] = useState<ProviderBaseline>(() => buildBaseline(providers));
  const [editing, setEditing] = useState<ProviderId | null>(null);
  const [revealKey, setRevealKey] = useState(false);
  const [openrouterSearch, setOpenrouterSearch] = useState('');

  const sectionMatches = useMemo(
    () => filter('providers cloud api keys base url vault status sheet edit'),
    [filter],
  );

  useEffect(() => {
    setProviderState((prev) => {
      const mapped = buildViewState(providers);
      PROVIDERS.forEach((provider) => {
        if (prev[provider.id]) {
          // Preserve status from previous state if a test was performed
          // Otherwise, derive it based on API key presence
          const shouldPreserveStatus = prev[provider.id].lastTested !== null;
          
          mapped[provider.id] = {
            apiKey: mapped[provider.id].apiKey,
            baseUrl: mapped[provider.id].baseUrl,
            status: shouldPreserveStatus ? prev[provider.id].status : deriveStatus(provider.id, mapped[provider.id].apiKey),
            lastTested: prev[provider.id].lastTested,
            testing: false,
          };
        }
      });
      return mapped;
    });
    setBaseline(buildBaseline(providers));
  }, [providers]);

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

    const baseValue = baseline[providerId]?.[field] ?? '';
    setFieldDirty(`providers.${providerId}.${field}`, value.trim() !== baseValue.trim());
  };

  const handleTest = async (providerId: ProviderId) => {
    const provider = PROVIDERS.find((item) => item.id === providerId);
    const current = providerState[providerId];

    setProviderState((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        testing: true,
      },
    }));

    if (!current?.apiKey.trim()) {
      setProviderState((prev) => ({
        ...prev,
        [providerId]: {
          ...prev[providerId],
          status: 'warn',
          lastTested: new Date().toLocaleString(),
          testing: false,
        },
      }));
      toast.error('Add an API key before testing');
      return;
    }

    const baseUrl = current.baseUrl.trim() || provider?.base || '';
    let success = false;
    let message: string | null = null;

    try {
      if (providerId === 'mistral' && isTauriContext()) {
        console.log('[TEST] Testing Mistral credentials...');
        const { invoke } = await import('@tauri-apps/api/core');
        console.log('[TEST] Calling test_mistral_credentials');
        const result = (await invoke('test_mistral_credentials', {
          apiKey: current.apiKey.trim(),
          baseUrl: baseUrl,
        })) as MistralTestResult;
        console.log('[TEST] Result:', result);
        success = Boolean(result?.ok);
        message = result?.message ?? null;
        console.log('[TEST] Success:', success, 'Message:', message);
      } else {
        console.log('[TEST] Fallback test (not Tauri or not Mistral)');
        success = current.apiKey.trim().length > 4;
      }
    } catch (error) {
      console.error('[TEST] Error during test:', error);
      success = false;
      message = error instanceof Error ? error.message : String(error);
    }

    const testedAt = new Date().toLocaleString();

    setProviderState((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        status: success ? 'ok' : 'warn',
        lastTested: testedAt,
        testing: false,
      },
    }));

    reportSettingsEvent('settings.provider_test', {
      id: providerId,
      result: success ? 'success' : 'error',
    });

    console.log('[TEST] Final result - Success:', success, 'Message:', message);
    
    if (success) {
      toast.success('Connection successful');
      
      // Fetch available models for Mistral after successful auth
      if (providerId === 'mistral') {
        if (!isTauriContext()) {
          console.warn('Not in Tauri context - cannot fetch models');
          toast.error('Model fetching requires Tauri app');
        } else {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const models = (await invoke('fetch_mistral_models', {
            apiKey: current.apiKey.trim(),
            baseUrl: baseUrl,
          })) as Array<{ id: string }>;
          
          const modelIds = models.map(m => m.id);
          const currentEnabled = providers[providerId].enabledModels;
          
          updateProvider(providerId, {
            availableModels: modelIds,
            // If no models are enabled yet, enable all by default
            enabledModels: currentEnabled.length === 0 ? modelIds : currentEnabled,
          });
          
          console.debug('Fetched Mistral models:', modelIds);
          toast.success(`Found ${modelIds.length} Mistral models`);
        } catch (error) {
          console.error('Failed to fetch Mistral models:', error);
          toast.error(`Failed to fetch models: ${error instanceof Error ? error.message : String(error)}`);
        }
        }
      }
      
      // Fetch available models for OpenRouter after successful auth
      if (providerId === 'openrouter') {
        if (!isTauriContext()) {
          console.warn('Not in Tauri context - cannot fetch models');
          toast.error('Model fetching requires Tauri app');
        } else {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const models = (await invoke('fetch_openrouter_models', {
            apiKey: current.apiKey.trim(),
          })) as Array<{ id: string }>;
          
          const modelIds = models.map(m => m.id);
          const currentEnabled = providers[providerId].enabledModels;
          
          updateProvider(providerId, {
            availableModels: modelIds,
            enabledModels: currentEnabled.length > 0 ? currentEnabled : ['openrouter/auto'],
          });
          
          console.debug('Fetched OpenRouter models:', modelIds.length);
          toast.success(`Found ${modelIds.length} OpenRouter models`);
        } catch (error) {
          console.error('Failed to fetch OpenRouter models:', error);
          toast.error(`Failed to fetch models: ${error instanceof Error ? error.message : String(error)}`);
        }
        }
      }
    } else {
      toast.error(message ?? 'Couldn’t connect — check your key');
    }
  };

  const handleCancel = () => {
    if (editingMeta) {
      reportSettingsEvent('settings.provider_sheet_cancel', { id: editingMeta.id });
      const snapshot = baseline[editingMeta.id] ?? { apiKey: '', baseUrl: '' };
      setProviderState((prev) => ({
        ...prev,
        [editingMeta.id]: {
          ...prev[editingMeta.id],
          apiKey: snapshot.apiKey,
          baseUrl: snapshot.baseUrl,
          status: deriveStatus(editingMeta.id, snapshot.apiKey),
          testing: false,
        },
      }));
      setFieldDirty(`providers.${editingMeta.id}.apiKey`, false);
      setFieldDirty(`providers.${editingMeta.id}.baseUrl`, false);
    }
    handleClose();
  };

  const handleSheetSave = () => {
    if (!editingMeta) {
      handleClose();
      return;
    }
    const snapshot = providerState[editingMeta.id];
    updateProvider(editingMeta.id, {
      apiKey: snapshot.apiKey,
      baseUrl: snapshot.baseUrl,
    });
    setBaseline((prev) => ({
      ...prev,
      [editingMeta.id]: {
        apiKey: snapshot.apiKey,
        baseUrl: snapshot.baseUrl,
      },
    }));
    setProviderState((prev) => ({
      ...prev,
      [editingMeta.id]: {
        ...prev[editingMeta.id],
        status: deriveStatus(editingMeta.id, snapshot.apiKey),
        testing: false,
      },
    }));
    setFieldDirty(`providers.${editingMeta.id}.apiKey`, false);
    setFieldDirty(`providers.${editingMeta.id}.baseUrl`, false);
    reportSettingsEvent('settings.provider_sheet_save', { id: editingMeta.id });
    toast.success(`${editingMeta.label} updated.`);
    handleClose();
  };

  const handleClear = () => {
    if (!editingMeta) return;
    
    const confirmed = window.confirm(
      `Clear all settings for ${editingMeta.label}?\n\nThis will remove your API key and reset the base URL. This action cannot be undone.`
    );
    
    if (!confirmed) return;

    resetProvider(editingMeta.id);
    
    const providerMeta = PROVIDERS.find((p) => p.id === editingMeta.id);
    setProviderState((prev) => ({
      ...prev,
      [editingMeta.id]: {
        apiKey: '',
        baseUrl: providerMeta?.base ?? '',
        status: 'empty',
        lastTested: null,
        testing: false,
      },
    }));
    setBaseline((prev) => ({
      ...prev,
      [editingMeta.id]: {
        apiKey: '',
        baseUrl: providerMeta?.base ?? '',
      },
    }));
    setFieldDirty(`providers.${editingMeta.id}.apiKey`, false);
    setFieldDirty(`providers.${editingMeta.id}.baseUrl`, false);
    
    reportSettingsEvent('settings.provider_clear', { id: editingMeta.id });
    toast.success(`${editingMeta.label} settings cleared.`);
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

      <SectionCard 
        title="Assistant Provider" 
        help="Choose which LLM provider powers the AI assistant for intent classification and writing tools."
      >
        <div className="space-y-3 px-4 py-3">
          <div className="space-y-1.5">
            <Label htmlFor="assistant-provider-select" className="text-sm font-medium text-[var(--text-primary)]">
              Provider
            </Label>
            <select
              id="assistant-provider-select"
              value={assistantProvider ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                const newProvider = value === '' ? null : value as ProviderId;
                setAssistantProvider(newProvider);
                // Clear model selection when provider changes
                setAssistantModel(null);
                toast.success(`Assistant provider ${value === '' ? 'cleared' : `set to ${value}`}`);
              }}
              className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            >
              <option value="">-- None selected --</option>
              {PROVIDERS.filter((p) => {
                const config = providers[p.id];
                return config && config.apiKey.trim() !== '';
              }).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--text-secondary)]">
              Only providers with configured API keys are shown. Configure providers below to add them.
            </p>
          </div>

          {assistantProvider && (() => {
            const providerConfig = providers[assistantProvider];
            const availableModels: string[] = [];
            
            // Build available models based on provider
            if (assistantProvider === 'mistral') {
              availableModels.push(...providerConfig.enabledModels);
            } else if (assistantProvider === 'glm' && providerConfig.defaultModel) {
              availableModels.push(providerConfig.defaultModel);
            } else if (assistantProvider === 'openrouter') {
              // Add openrouter/auto first if not already in enabled models
              if (!providerConfig.enabledModels.includes('openrouter/auto')) {
                availableModels.push('openrouter/auto');
              }
              availableModels.push(...providerConfig.enabledModels);
            } else {
              availableModels.push(...providerConfig.enabledModels);
            }

            const currentAssistantModel = assistantModel; // Capture from parent scope

            return availableModels.length > 0 ? (
              <div className="space-y-1.5">
                <Label htmlFor="assistant-model-select" className="text-sm font-medium text-[var(--text-primary)]">
                  Model
                </Label>
                <select
                  id="assistant-model-select"
                  value={currentAssistantModel ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAssistantModel(value === '' ? null : value);
                    toast.success(`Assistant model ${value === '' ? 'cleared' : `set to ${value}`}`);
                  }}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                >
                  <option value="">-- Use provider default --</option>
                  {availableModels.map((modelId) => (
                    <option key={modelId} value={modelId}>
                      {modelId}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[var(--text-secondary)]">
                  Select a specific model or leave blank to use the provider's default.
                </p>
              </div>
            ) : null;
          })()}
        </div>
      </SectionCard>

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

                {editing === 'mistral' && (() => {
                  console.log('[DEBUG] Mistral models check:', {
                    editing,
                    availableModels: providers.mistral.availableModels,
                    enabledModels: providers.mistral.enabledModels,
                    shouldShow: providers.mistral.availableModels.length > 0
                  });
                  return providers.mistral.availableModels.length > 0;
                })() && (
                  <>
                    <Separator />
                    <section className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Available Models</h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                              Select which models appear in your chat dropdown
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const allModels = providers.mistral.availableModels;
                              const allSelected = allModels.length === providers.mistral.enabledModels.length;
                              updateProvider('mistral', {
                                enabledModels: allSelected ? [] : [...allModels],
                              });
                            }}
                            className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium shrink-0"
                          >
                            {providers.mistral.availableModels.length === providers.mistral.enabledModels.length
                              ? 'Deselect All'
                              : 'Select All'}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {sortModelsByTier(providers.mistral.availableModels).map((modelId) => {
                          const isEnabled = providers.mistral.enabledModels.includes(modelId);
                          const metadata = getModelMetadata(modelId);
                          const tierLabel = getTierLabel(metadata.tier);
                          const tierBadgeClass = getTierBadgeClass(metadata.tier);
                          
                          return (
                            <label
                              key={modelId}
                              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 cursor-pointer hover:bg-[var(--hover-bg)]"
                            >
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => {
                                  const currentEnabled = providers.mistral.enabledModels;
                                  updateProvider('mistral', {
                                    enabledModels: e.target.checked
                                      ? [...currentEnabled, modelId]
                                      : currentEnabled.filter(id => id !== modelId),
                                  });
                                }}
                                className="h-4 w-4 rounded border-[var(--border-default)] text-[var(--primary)]"
                              />
                              <div className="flex-1 flex items-center gap-2">
                                <span className="text-sm font-mono text-[var(--text-primary)]">{metadata.displayName}</span>
                                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${tierBadgeClass}`}>
                                  {tierLabel}
                                </span>
                              </div>
                              {metadata.description && (
                                <span className="text-xs text-[var(--text-tertiary)] hidden lg:inline">
                                  {metadata.description}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </section>
                  </>
                )}

                {editing === 'openrouter' && providers.openrouter.availableModels.length > 0 && (
                  <>
                    <Separator />
                    <section className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">Available Models</h3>
                            <p className="text-sm text-[color:var(--text-secondary)]">
                              Search and select from 200+ models across 80+ providers
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Input
                          placeholder="Search models (e.g., claude, gpt, llama)..."
                          value={openrouterSearch}
                          onChange={(e) => setOpenrouterSearch(e.target.value)}
                          className="text-sm"
                        />
                        
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {providers.openrouter.availableModels
                            .filter(modelId => 
                              openrouterSearch === '' || 
                              modelId.toLowerCase().includes(openrouterSearch.toLowerCase())
                            )
                            .slice(0, 100)
                            .map((modelId) => {
                              const isEnabled = providers.openrouter.enabledModels.includes(modelId);
                              
                              return (
                                <label
                                  key={modelId}
                                  className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 cursor-pointer hover:bg-[var(--hover-bg)]"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={(e) => {
                                      const currentEnabled = providers.openrouter.enabledModels;
                                      updateProvider('openrouter', {
                                        enabledModels: e.target.checked
                                          ? [...currentEnabled, modelId]
                                          : currentEnabled.filter(id => id !== modelId),
                                      });
                                    }}
                                    className="h-4 w-4 rounded border-[var(--border-default)] text-[var(--primary)]"
                                  />
                                  <span className="text-sm font-mono text-[color:var(--text-primary)]">{modelId}</span>
                                </label>
                              );
                            })}
                          {providers.openrouter.availableModels.filter(modelId => 
                            openrouterSearch === '' || 
                            modelId.toLowerCase().includes(openrouterSearch.toLowerCase())
                          ).length > 100 && (
                            <p className="text-xs text-[color:var(--text-tertiary)] text-center py-2">
                              Showing first 100 results. Refine your search to see more.
                            </p>
                          )}
                        </div>
                      </div>
                    </section>
                  </>
                )}

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
                <div className="flex w-full justify-between gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleClear}
                    className="text-[var(--status-error)] hover:bg-[color-mix(in_oklab,var(--status-error)_10%,transparent)] hover:text-[var(--status-error)]"
                  >
                    Clear
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button onClick={handleSheetSave}>Done</Button>
                  </div>
                </div>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
