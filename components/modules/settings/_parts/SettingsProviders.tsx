import React, { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../../../ui/sheet';
import { Button } from '../../../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../ui/alert-dialog';
import { SectionCard } from './SectionCard';
import { useSettingsState } from './SettingsState';
import { reportSettingsEvent } from './analytics';
import { toast } from 'sonner';
import { ProviderId, useProviderSettings } from '../state/providerSettings';
import {
  AuthenticationPanel,
  AssistantDefaultsPanel,
  ConnectionPanel,
  ModelsPanel,
  ProvidersSummaryPanel,
  RoutingPanel,
  PROVIDERS,
  buildBaseline,
  buildViewState,
  getInitialConnectionState,
  hasConfiguredCredentials,
  type ProviderBaseline,
  type ProviderStateView,
  type DisplayConnectionState,
} from '../../../features/settings/providers';

interface SettingsProvidersProps {
  id: string;
  filter: (text: string) => boolean;
  registerSection: (node: HTMLElement | null) => void;
}
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

export function SettingsProviders({ id, filter, registerSection }: SettingsProvidersProps) {
  const { setFieldDirty } = useSettingsState();
  const { providers, updateProvider, resetProvider, assistantProvider, assistantModel, fallbackProvider, fallbackModel, setAssistantProvider, setAssistantModel, setFallbackProvider, setFallbackModel } = useProviderSettings(
    useShallow((state) => ({
      providers: state.providers,
      updateProvider: state.updateProvider,
      resetProvider: state.resetProvider,
      assistantProvider: state.assistantProvider,
      assistantModel: state.assistantModel,
      fallbackProvider: state.fallbackProvider,
      fallbackModel: state.fallbackModel,
      setAssistantProvider: state.setAssistantProvider,
      setAssistantModel: state.setAssistantModel,
      setFallbackProvider: state.setFallbackProvider,
      setFallbackModel: state.setFallbackModel,
    }))
  );
  
  const [providerState, setProviderState] = useState<Record<ProviderId, ProviderStateView>>(() =>
    buildViewState(providers),
  );
  const [baseline, setBaseline] = useState<ProviderBaseline>(() => buildBaseline(providers));
  const [editing, setEditing] = useState<ProviderId | null>(null);
  const [revealKey, setRevealKey] = useState(false);
  const [openrouterSearch, setOpenrouterSearch] = useState('');
  const [isLocalBusy, setIsLocalBusy] = useState(false);
  const [pendingLocalDelete, setPendingLocalDelete] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );

  useEffect(() => {
    console.log('[SettingsProviders] Provider API keys:', Object.entries(providers).reduce((acc, [id, config]) => {
      acc[id] = config.apiKey ? `${config.apiKey.substring(0, 10)}... (${config.apiKey.length} chars)` : '(empty)';
      return acc;
    }, {} as Record<string, string>));
  }, [providers]);

  useEffect(() => {
    console.log('[SettingsProviders] Provider states:', Object.entries(providerState).reduce((acc, [id, state]) => {
      acc[id] = {
        connectionState: state.connectionState,
        lastCheckedAt: state.lastCheckedAt,
        hasApiKey: !!state.apiKey,
      };
      return acc;
    }, {} as Record<string, unknown>));
  }, [providerState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sectionMatches = useMemo(
    () => filter('providers cloud api keys base url vault status sheet edit'),
    [filter],
  );

  useEffect(() => {
    setProviderState((prev) => {
      const mapped = buildViewState(providers);
      const providerIds: ProviderId[] = [...PROVIDERS.map((provider) => provider.id), 'local'];

      providerIds.forEach((providerId) => {
        const previous = prev[providerId];
        if (!previous) return;

        if (editing === providerId) {
          mapped[providerId] = { ...previous };
          return;
        }

        const connectionState = previous.connectionState === 'testing' ? 'not_verified' : previous.connectionState;

        mapped[providerId] = {
          ...mapped[providerId],
          connectionState,
          lastCheckedAt: previous.lastCheckedAt,
          lastError: previous.lastError,
        };
      });
      return mapped;
    });
    setBaseline(buildBaseline(providers));
  }, [providers, editing]);

  useEffect(() => {
    if (!editing) return;
    reportSettingsEvent('settings.provider_edit_opened', { id: editing });
    setRevealKey(false);
    if (editing === 'local') {
      void handleLocalRefresh();
    }
  }, [editing]);

  const editingMeta =
    editing === 'local'
      ? {
          id: 'local' as const,
          label: 'Local models',
          hint: 'Manage your local runtime and available models.',
          base: providers.local.baseUrl || 'http://127.0.0.1:11434',
        }
      : editing
        ? PROVIDERS.find((prov) => prov.id === editing) ?? null
        : null;
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

  const handlePaste = async (providerId: ProviderId) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
      toast.error('Clipboard not available');
      reportSettingsEvent('settings.provider_clipboard_unavailable', { id: providerId });
      return;
    }

    try {
      const value = await navigator.clipboard.readText();
      handleChange('apiKey', value, providerId);
      toast.success('Pasted from clipboard');
    } catch (error) {
      toast.error('Could not paste');
    }
  };

  const syncLocalModels = async (
    baseUrl: string,
    options: { silent?: boolean; manageBusy?: boolean } = {},
  ) => {
    if (!isTauriContext()) {
      if (!options.silent) {
        toast.error('Model management requires the desktop app');
      }
      return;
    }

    const shouldManageBusy = options.manageBusy ?? true;
    if (shouldManageBusy) {
      setIsLocalBusy(true);
    }

    try {
      const resolvedBase = baseUrl.trim() || providers.local.baseUrl || 'http://127.0.0.1:11434';
      const { invoke } = await import('@tauri-apps/api/core');
      const models = (await invoke('ollama_list_models', {
        baseUrl: resolvedBase,
      })) as Array<{ name: string }>;

      const modelIds = models.map((model) => model.name);
      const { providers: providerSnapshot } = useProviderSettings.getState();
      const currentEnabled = providerSnapshot.local.enabledModels;
      const nextEnabled =
        currentEnabled.length > 0
          ? currentEnabled.filter((id) => modelIds.includes(id))
          : modelIds;

      updateProvider('local', {
        availableModels: modelIds,
        enabledModels: nextEnabled,
        defaultModel: nextEnabled[0] ?? modelIds[0] ?? '',
      });

      setProviderState((prev) => {
        const previousLocal =
          prev.local ??
          {
            apiKey: '',
            baseUrl: resolvedBase,
            connectionState: getInitialConnectionState('local', '', resolvedBase),
            lastCheckedAt: null,
            lastError: null,
          };

        const nextConnectionState =
          previousLocal.connectionState === 'testing'
            ? (modelIds.length > 0 ? 'connected' : 'failed')
            : previousLocal.connectionState;

        return {
          ...prev,
          local: {
            ...previousLocal,
            baseUrl: resolvedBase,
            connectionState: nextConnectionState,
            lastCheckedAt: Date.now(),
            lastError: null,
          },
        };
      });

      if (!options.silent) {
        if (modelIds.length === 0) {
          toast.warning('Ollama responded but no models were found');
        } else {
          toast.success(`Found ${modelIds.length} local model${modelIds.length === 1 ? '' : 's'}`);
        }
      }
    } catch (error) {
      console.error('Failed to sync local models:', error);
      if (!options.silent) {
        toast.error(`Failed to fetch local models: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      if (shouldManageBusy) {
        setIsLocalBusy(false);
      }
    }
  };

  const resolveLocalBaseUrl = () => {
    const snapshot = useProviderSettings.getState();
    const candidate = snapshot.providers.local.baseUrl || providers.local.baseUrl || 'http://127.0.0.1:11434';
    return candidate.trim() || 'http://127.0.0.1:11434';
  };

  const handleLocalRefresh = async () => {
    const baseUrl = resolveLocalBaseUrl();
    await syncLocalModels(baseUrl);
  };

  const handleLocalPullModel = async (modelName: string) => {
    if (!modelName) return;
    if (!isTauriContext()) {
      toast.error('Model management requires the desktop app');
      return;
    }

    setIsLocalBusy(true);
    const baseUrl = resolveLocalBaseUrl();

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('ollama_pull_model', {
        baseUrl,
        model: modelName,
      });
      toast.success(`Pulled ${modelName}`);
      await syncLocalModels(baseUrl, { silent: true, manageBusy: false });
    } catch (error) {
      console.error('Failed to pull Ollama model:', error);
      toast.error(`Failed to pull ${modelName}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLocalBusy(false);
    }
  };

  const handleLocalDeleteModel = async (modelName: string): Promise<boolean> => {
    if (!modelName) return false;
    if (!isTauriContext()) {
      toast.error('Model management requires the desktop app');
      return false;
    }

    setIsLocalBusy(true);
    const baseUrl = resolveLocalBaseUrl();
    let success = false;

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('ollama_delete_model', {
        baseUrl,
        model: modelName,
      });
      toast.success(`Removed ${modelName}`);
      await syncLocalModels(baseUrl, { silent: true, manageBusy: false });
      success = true;
    } catch (error) {
      console.error('Failed to delete Ollama model:', error);
      toast.error(`Failed to delete ${modelName}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLocalBusy(false);
    }

    return success;
  };

  const handleChange = (field: 'apiKey' | 'baseUrl', value: string, providerId: ProviderId) => {
    setProviderState((prev) => {
      const current = prev[providerId];
      if (!current) return prev;

      const nextApiKey = field === 'apiKey' ? value : current.apiKey;
      const nextBaseUrl = field === 'baseUrl' ? value : current.baseUrl;
      const hasCredentials = hasConfiguredCredentials(providerId, nextApiKey, nextBaseUrl);
      const nextConnectionState = hasCredentials ? 'not_verified' : 'not_configured';

      return {
        ...prev,
        [providerId]: {
          ...current,
          apiKey: nextApiKey,
          baseUrl: nextBaseUrl,
          connectionState: nextConnectionState,
          lastCheckedAt: null,
          lastError: null,
        },
      };
    });

    // Auto-save: immediately persist to store
    updateProvider(providerId, { [field]: value });
  };

  const handleTest = async (providerId: ProviderId, trigger: 'manual' | 'auto' = 'manual') => {
    const provider = PROVIDERS.find((item) => item.id === providerId);
    const current = providerState[providerId];
    if (!current) return;

    if (isOffline) {
      if (trigger === 'manual') {
        toast.error('Offline — reconnect to run the test.');
      }
      return;
    }

    if (!hasConfiguredCredentials(providerId, current.apiKey, current.baseUrl)) {
      setProviderState((prev) => ({
        ...prev,
        [providerId]: {
          ...prev[providerId],
          connectionState: 'not_configured',
          lastCheckedAt: null,
          lastError: null,
        },
      }));

      if (trigger === 'manual') {
        toast.error('Add a valid API key before running a test.');
      }
      return;
    }

    setProviderState((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        connectionState: 'testing',
      },
    }));

    const baseUrl = current.baseUrl.trim() || provider?.base || '';
    let success = false;
    let message: string | null = null;

    try {
      if (providerId === 'mistral' && isTauriContext()) {
        const { invoke } = await import('@tauri-apps/api/core');
        const result = (await invoke('test_mistral_credentials', {
          apiKey: current.apiKey.trim(),
          baseUrl,
        })) as MistralTestResult;
        success = Boolean(result?.ok);
        message = result?.message ?? null;
      } else if (providerId === 'local' && isTauriContext()) {
        const { invoke } = await import('@tauri-apps/api/core');
        const result = (await invoke('test_ollama_connection', {
          baseUrl,
        })) as { ok: boolean; message?: string | null };
        success = Boolean(result?.ok);
        message = result?.message ?? null;
      } else {
        success = providerId === 'local' ? Boolean(baseUrl) : current.apiKey.trim().length > 4;
      }
    } catch (error) {
      console.error('[TEST] Error during test:', error);
      success = false;
      message = error instanceof Error ? error.message : String(error);
    }

    const testedAt = Date.now();

    setProviderState((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        connectionState: success ? 'connected' : 'failed',
        lastCheckedAt: testedAt,
        lastError: success ? null : message,
      },
    }));

    // Persist connection state to provider settings
    updateProvider(providerId, {
      connectionState: success ? 'connected' : 'failed',
      lastCheckedAt: testedAt,
      lastError: success ? null : message,
    });

    reportSettingsEvent('settings.provider_test', {
      id: providerId,
      result: success ? 'success' : 'error',
    });

    if (success) {
      toast.success('Connection verified');

      if (providerId === 'mistral') {
        if (!isTauriContext()) {
          console.warn('Not in Tauri context - cannot fetch models');
          toast.error('Model fetching requires the desktop app');
        } else {
          try {
            const { invoke } = await import('@tauri-apps/api/core');
            const models = (await invoke('fetch_mistral_models', {
              apiKey: current.apiKey.trim(),
              baseUrl,
            })) as Array<{ id: string }>;

            const modelIds = models.map((m) => m.id);
            const currentEnabled = providers[providerId].enabledModels;

            updateProvider(providerId, {
              availableModels: modelIds,
              enabledModels: currentEnabled.length === 0 ? modelIds : currentEnabled,
            });

            console.debug('Fetched Mistral models:', modelIds);
            if (modelIds.length > 0) {
              toast.success(`Found ${modelIds.length} Mistral models`);
            } else {
              toast.warning('No Mistral models were returned');
            }
          } catch (error) {
            console.error('Failed to fetch Mistral models:', error);
            toast.error(`Failed to fetch models: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }

      if (providerId === 'openrouter') {
        if (!isTauriContext()) {
          console.warn('Not in Tauri context - cannot fetch models');
          toast.error('Model fetching requires the desktop app');
        } else {
          try {
            const { invoke } = await import('@tauri-apps/api/core');
            const models = (await invoke('fetch_openrouter_models', {
              apiKey: current.apiKey.trim(),
            })) as Array<{ id: string }>;

            const modelIds = models.map((m) => m.id);
            const currentEnabled = providers[providerId].enabledModels;

            updateProvider(providerId, {
              availableModels: modelIds,
              enabledModels: currentEnabled.length > 0 ? currentEnabled : ['openrouter/auto'],
            });

            console.debug('Fetched OpenRouter models:', modelIds.length);
            if (modelIds.length > 0) {
              toast.success(`Found ${modelIds.length} OpenRouter models`);
            } else {
              toast.warning('No OpenRouter models were returned');
            }
          } catch (error) {
            console.error('Failed to fetch OpenRouter models:', error);
            toast.error(`Failed to fetch models: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }

      if (providerId === 'local') {
        await syncLocalModels(baseUrl, { silent: trigger === 'auto', manageBusy: false });
      }
    } else if (trigger === 'manual') {
      toast.error(message ?? 'Couldn’t connect — check your key');
    }
  };

  const handleCredentialBlur = () => {
    if (!editing) return;
    const state = providerState[editing];
    if (!state) return;
    if (!hasConfiguredCredentials(editing, state.apiKey, state.baseUrl)) return;
    if (state.connectionState !== 'not_verified') return;
    void handleTest(editing, 'auto');
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
          connectionState: getInitialConnectionState(editingMeta.id, snapshot.apiKey, snapshot.baseUrl),
          lastCheckedAt: null,
          lastError: null,
        },
      }));
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
    reportSettingsEvent('settings.provider_sheet_save', { id: editingMeta.id });
    toast.success(`${editingMeta.label} updated.`);
    void handleTest(editingMeta.id, 'auto');
    handleClose();
  };

  const handleClear = () => {
    if (!editingMeta) return;
    
    const confirmed = window.confirm(
      `Clear all settings for ${editingMeta.label}?\n\nThis will remove your API key and reset the base URL. This action cannot be undone.`
    );
    
    if (!confirmed) return;

    resetProvider(editingMeta.id);
    
    const defaultBase = editingMeta.base ?? '';
    setProviderState((prev) => ({
      ...prev,
      [editingMeta.id]: {
        apiKey: '',
        baseUrl: defaultBase,
        connectionState: getInitialConnectionState(editingMeta.id, '', defaultBase),
        lastCheckedAt: null,
        lastError: null,
      },
    }));
    setBaseline((prev) => ({
      ...prev,
      [editingMeta.id]: {
        apiKey: '',
        baseUrl: defaultBase,
      },
    }));
    
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
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Models
        </h2>
      </div>

      <SectionCard title="Models" help="Connect cloud providers and manage local models.">
        <ProvidersSummaryPanel
          providers={PROVIDERS}
          providerState={providerState}
          isOffline={isOffline}
          localProvider={providers.local}
          isLocalBusy={isLocalBusy}
          onConfigure={(providerId) => providerId !== 'local' && setEditing(providerId)}
          onPullLocalModel={handleLocalPullModel}
          onRequestDeleteLocalModel={(model) => setPendingLocalDelete(model)}
          onRefreshLocalModels={handleLocalRefresh}
          onUpdateLocalBaseUrl={async (baseUrl) => {
            updateProvider('local', { baseUrl });
            setProviderState((prev) => ({
              ...prev,
              local: {
                ...prev.local,
                baseUrl,
                connectionState: getInitialConnectionState('local', '', baseUrl),
                lastCheckedAt: null,
                lastError: null,
              },
            }));
            toast.success('Base URL saved.');
            await handleTest('local', 'auto');
          }}
          onUpdateLocalDefaultModel={(modelId) => {
            updateProvider('local', { defaultModel: modelId });
            toast.success('Default model updated.');
          }}
        />
      </SectionCard>

      <SectionCard
        title="Assistant defaults"
        help="Choose a primary provider and an optional fallback."
      >
        <AssistantDefaultsPanel
          providersConfig={providers}
          assistantProvider={assistantProvider}
          assistantModel={assistantModel}
          fallbackProvider={fallbackProvider}
          fallbackModel={fallbackModel}
          onProviderChange={setAssistantProvider}
          onModelChange={setAssistantModel}
          onFallbackProviderChange={setFallbackProvider}
          onFallbackModelChange={setFallbackModel}
          onConfigureProvider={(providerId) => setEditing(providerId)}
          providerStates={providerState}
        />
      </SectionCard>

      <Sheet open={Boolean(editing)} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent
          side="right"
          className="w-full max-w-[100vw] border-l border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-0 sm:max-w-[var(--settings-sheet-w)]"
        >
          {editing && editingMeta && editingState && (
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b border-[var(--border-subtle)] px-6 pb-5 pt-6">
                <SheetTitle className="text-xl font-semibold text-[var(--text-primary)]">
                  {editingMeta.label}
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-8">
                {(() => {
                  const displayState: DisplayConnectionState = isOffline ? 'offline' : editingState.connectionState;
                  const isTesting = editingState.connectionState === 'testing';
                  const canRunTest = hasConfiguredCredentials(editing, editingState.apiKey, editingState.baseUrl) && !isOffline;

                  return (
                    <ConnectionPanel
                      state={editingState}
                      displayState={displayState}
                      isOffline={isOffline}
                      isTesting={isTesting}
                      canRunTest={canRunTest}
                      onRunTest={() => handleTest(editing)}
                      onViewDetails={() => toast.info('Open the developer console to review full error details.')}
                    />
                  );
                })()}

                {editing !== 'local' ? (
                  <>
                    <AuthenticationPanel
                      apiKey={editingState.apiKey}
                      revealKey={revealKey}
                      helperText="Saved locally. Never shared."
                      onApiKeyChange={(value) => handleChange('apiKey', value, editing)}
                      onApiKeyBlur={handleCredentialBlur}
                      onToggleReveal={() => setRevealKey((prev) => !prev)}
                      onPaste={() => handlePaste(editing)}
                      onCopy={() => handleCopy(editing, editingState.apiKey)}
                    />

                    <RoutingPanel
                      baseUrl={editingState.baseUrl}
                      defaultBase={editingMeta.base}
                      onBaseUrlChange={(value) => handleChange('baseUrl', value, editing)}
                      onBaseUrlBlur={handleCredentialBlur}
                    />
                  </>
                ) : (
                  <section className="space-y-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                    <div className="space-y-2">
                      <label htmlFor="local-base-url" className="text-sm font-medium text-[var(--text-primary)]">
                        Base URL
                      </label>
                      <input
                        id="local-base-url"
                        type="url"
                        className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                        placeholder={editingMeta.base}
                        value={editingState.baseUrl}
                        onChange={(event) => handleChange('baseUrl', event.target.value, editing)}
                        onBlur={handleCredentialBlur}
                      />
                      <p className="text-xs text-[var(--text-secondary)]">Leave blank to use the default Ollama endpoint.</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-[var(--text-primary)]">Models</h3>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleLocalPullModel(window.prompt('Enter an Ollama model to pull (e.g., llama3:8b)', '')?.trim() ?? '')} disabled={isLocalBusy}>
                            Pull
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleLocalRefresh} disabled={isLocalBusy}>
                            Refresh
                          </Button>
                        </div>
                      </div>
                      {providers.local.availableModels.length > 0 ? (
                        <ul className="space-y-2" role="list">
                          {providers.local.availableModels.map((model) => (
                            <li
                              key={model}
                              className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]"
                            >
                              <span>{model}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPendingLocalDelete(model)}
                                disabled={isLocalBusy}
                              >
                                Delete
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-3 py-6 text-sm text-[var(--text-secondary)]">
                          No local models detected yet. Pull a model to get started.
                        </p>
                      )}
                    </div>
                  </section>
                )}

                {editing === 'mistral' && providers.mistral.availableModels.length > 0 && (
                  <ModelsPanel
                    providerId="mistral"
                    availableModels={providers.mistral.availableModels}
                    enabledModels={providers.mistral.enabledModels}
                    openRouterSearch={openrouterSearch}
                    onOpenRouterSearch={setOpenrouterSearch}
                    onToggleModel={(modelId, enabled) => {
                      const currentEnabled = providers.mistral.enabledModels;
                      updateProvider('mistral', {
                        enabledModels: enabled
                          ? [...currentEnabled, modelId]
                          : currentEnabled.filter((id) => id !== modelId),
                      });
                    }}
                    onToggleAll={() => {
                      const allModels = providers.mistral.availableModels;
                      const allSelected = allModels.length === providers.mistral.enabledModels.length;
                      updateProvider('mistral', {
                        enabledModels: allSelected ? [] : [...allModels],
                      });
                    }}
                    onUpdateEnabled={(ids) => {
                      updateProvider('mistral', { enabledModels: ids });
                    }}
                  />
                )}

                {editing === 'openrouter' && providers.openrouter.availableModels.length > 0 && (
                  <ModelsPanel
                    providerId="openrouter"
                    availableModels={providers.openrouter.availableModels}
                    enabledModels={providers.openrouter.enabledModels}
                    openRouterSearch={openrouterSearch}
                    onOpenRouterSearch={setOpenrouterSearch}
                    onToggleModel={(modelId, enabled) => {
                      const currentEnabled = providers.openrouter.enabledModels;
                      updateProvider('openrouter', {
                        enabledModels: enabled
                          ? [...currentEnabled, modelId]
                          : currentEnabled.filter((id) => id !== modelId),
                      });
                    }}
                    onUpdateEnabled={(ids) => {
                      updateProvider('openrouter', { enabledModels: ids });
                    }}
                  />
                )}

              </div>

              <SheetFooter className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-4">
                <div className="flex w-full justify-between gap-2">
                  <Button
                    variant="ghost"
                    onClick={handleClear}
                    className="text-[var(--status-error)] hover:bg-[color-mix(in_oklab,var(--status-error)_12%,transparent)] hover:text-[var(--status-error)]"
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

      <AlertDialog open={pendingLocalDelete !== null} onOpenChange={(open) => !open && setPendingLocalDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove local model?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes <code>{pendingLocalDelete ?? ''}</code> from your device. You can pull it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingLocalDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const target = pendingLocalDelete;
                if (!target) return;
                const success = await handleLocalDeleteModel(target);
                if (!success) {
                  setPendingLocalDelete(target);
                }
              }}
              disabled={isLocalBusy}
            >
              Remove model
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
