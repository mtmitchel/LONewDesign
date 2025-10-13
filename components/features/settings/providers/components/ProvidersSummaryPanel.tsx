import React from 'react';
import { Button } from '../../../../ui/button';
import ConnectionBadge from './ConnectionBadge';
import { ProviderStatusRow } from './ProviderStatusRow';
import type { ProviderMeta } from '../config';
import type { ProviderStateView } from '../logic';
import type { DisplayConnectionState } from '../connectionStatus';
import type { ProviderConfig, ProviderId } from '../../../../modules/settings/state/providerSettings';

interface ProvidersSummaryPanelProps {
  providers: ProviderMeta[];
  providerState: Record<ProviderId, ProviderStateView>;
  isOffline: boolean;
  localProvider: ProviderConfig;
  isLocalBusy: boolean;
  onConfigure: (providerId: ProviderId) => void;
  onPullLocalModel: (modelName: string) => void;
  onRequestDeleteLocalModel: (modelName: string) => void;
  onRefreshLocalModels: () => void;
}

export function ProvidersSummaryPanel({
  providers,
  providerState,
  isOffline,
  localProvider,
  isLocalBusy,
  onConfigure,
  onPullLocalModel,
  onRequestDeleteLocalModel,
  onRefreshLocalModels,
}: ProvidersSummaryPanelProps): JSX.Element {
  const cloudRows = providers.map((provider) => {
    const state = providerState[provider.id];
    const displayState: DisplayConnectionState = isOffline ? 'offline' : state?.connectionState ?? 'not_configured';
    return {
      provider,
      state: state ?? {
        apiKey: '',
        baseUrl: '',
        connectionState: 'not_configured',
        lastCheckedAt: null,
        lastError: null,
      },
      displayState,
    };
  });

  const nextCloudToConfigure =
    providers.find((provider) => {
      const state = providerState[provider.id];
      return !state || state.connectionState === 'not_configured';
    }) ?? providers[0];

  const localState = providerState.local;
  const localDisplayState: DisplayConnectionState = isOffline
    ? 'offline'
    : localState?.connectionState ?? (localProvider.baseUrl ? 'not_verified' : 'not_configured');

  const localModels = localProvider.availableModels || [];

  const defaultModelLabel = localProvider.defaultModel?.trim() || 'Not set';
  const endpointLabel = localProvider.baseUrl?.trim() || 'Not set';

  const handleAddCloudProvider = () => {
    if (!nextCloudToConfigure) return;
    onConfigure(nextCloudToConfigure.id);
  };

  const handlePullLocalModel = () => {
    const entered = window.prompt('Enter an Ollama model to pull (e.g., llama3:8b)', '');
    const trimmed = entered?.trim();
    if (!trimmed) return;
    onPullLocalModel(trimmed);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Cloud providers</p>
            <p className="text-xs text-[var(--text-secondary)]">Connect hosted APIs to run the assistant in the cloud.</p>
          </div>
          <Button size="sm" variant="outline" onClick={handleAddCloudProvider}>
            Add cloud provider
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {cloudRows.map(({ provider, state, displayState }) => (
            <ProviderStatusRow
              key={provider.id}
              provider={provider}
              state={state}
              displayState={displayState}
              isOffline={isOffline}
              onConfigure={() => onConfigure(provider.id)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Local models</p>
            <p className="text-xs text-[var(--text-secondary)]">Use Ollama for offline or on-device inference.</p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">Endpoint {endpointLabel}</p>
          </div>
          <ConnectionBadge state={localDisplayState} />
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            <span>Default model</span>
            <span className="font-mono text-[var(--text-primary)]">{defaultModelLabel}</span>
          </div>

          {localModels.length > 0 ? (
            <ul className="space-y-2" role="list">
              {localModels.map((model) => (
                <li
                  key={model}
                  className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-3 py-2"
                >
                  <span className="text-sm text-[var(--text-primary)]">{model}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRequestDeleteLocalModel(model)}
                      disabled={isLocalBusy}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-3 py-6 text-sm text-[var(--text-secondary)]">
              No local models detected yet. Pull a model to get started.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onConfigure('local')} disabled={isLocalBusy}>
            Configure
          </Button>
          <Button size="sm" variant="outline" onClick={handlePullLocalModel} disabled={isLocalBusy}>
            Pull model
          </Button>
          <Button size="sm" variant="outline" onClick={onRefreshLocalModels} disabled={isLocalBusy}>
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProvidersSummaryPanel;
