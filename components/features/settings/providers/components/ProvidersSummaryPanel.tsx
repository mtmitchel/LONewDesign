import React, { useState } from 'react';
import { Button } from '../../../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../ui/tooltip';
import { CheckCircle2, AlertTriangle, Pencil, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../ui/select';
import { ProviderStatusRow } from './ProviderStatusRow';
import type { ProviderMeta } from '../config';
import type { ProviderStateView } from '../logic';
import type { DisplayConnectionState } from '../connectionStatus';
import { getDisplayConnectionState } from '../connectionStatus';
import type { ProviderConfig, ProviderId } from '../../../../modules/settings/state/providerSettings';

function InlineBaseUrl({ 
  base, 
  onEdit, 
  editing, 
  value, 
  onValueChange, 
  disabled 
}: { 
  base: string; 
  onEdit: () => void; 
  editing: boolean;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean; 
}) {
  const displayUrl = base || 'http://127.0.0.1:11434';
  const truncatedUrl = displayUrl.length > 25 ? 
    `${displayUrl.slice(0, 12)}...${displayUrl.slice(-8)}` : 
    displayUrl;

  if (!editing) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-white px-2 py-1 text-xs font-mono text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:bg-[var(--bg-surface)]"
            aria-label="Edit base URL"
            disabled={disabled}
          >
            <Globe className="size-3.5" />
            {truncatedUrl}
          </button>
        </TooltipTrigger>
        <TooltipContent>{displayUrl}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      <Globe className="size-3.5 text-[var(--text-secondary)]" />
      <input
        type="url"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-48 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-white px-2 py-1 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
        placeholder="http://127.0.0.1:11434"
        disabled={disabled}
        autoFocus
      />
    </div>
  );
}

interface ProvidersSummaryPanelProps {
  providers: ProviderMeta[];
  providerState: Record<ProviderId, ProviderStateView>;
  isOffline: boolean;
  localProvider: ProviderConfig;
  isLocalBusy: boolean;
  onConfigure: (providerId: ProviderId) => void;
  onRunTest: (providerId: ProviderId) => void;
  onPullLocalModel: (modelName: string) => void;
  onRequestDeleteLocalModel: (modelName: string) => void;
  onRefreshLocalModels: () => void;
  onUpdateLocalBaseUrl: (baseUrl: string) => void;
  onUpdateLocalDefaultModel: (modelId: string) => void;
}

export function ProvidersSummaryPanel({
  providers,
  providerState,
  isOffline,
  localProvider,
  isLocalBusy,
  onConfigure,
  onRunTest,
  onPullLocalModel,
  onRequestDeleteLocalModel,
  onRefreshLocalModels,
  onUpdateLocalBaseUrl,
  onUpdateLocalDefaultModel,
}: ProvidersSummaryPanelProps): JSX.Element {
  const [editingBaseUrl, setEditingBaseUrl] = useState(false);
  const [baseUrlValue, setBaseUrlValue] = useState('');

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
  const localDisplayState = getDisplayConnectionState(localState, isOffline);

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
    <div className="grid grid-rows-2 gap-4">
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">Cloud providers</p>
          <Button size="sm" variant="outline" onClick={handleAddCloudProvider}>
            Add provider
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
              onRunTest={() => onRunTest(provider.id)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--text-primary)]">Local models</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePullLocalModel} disabled={isLocalBusy}>
              Pull model
            </Button>
            <Button size="sm" variant="outline" onClick={onRefreshLocalModels} disabled={isLocalBusy}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-white px-3 py-2 text-xs text-[var(--text-secondary)]">
            <div className="flex items-center justify-between gap-2">
              <span>Base URL</span>
              <div className="flex items-center gap-2">
                <InlineBaseUrl 
                  base={endpointLabel} 
                  onEdit={() => {
                    setBaseUrlValue(localProvider.baseUrl?.trim() || '');
                    setEditingBaseUrl(true);
                  }}
                  editing={editingBaseUrl}
                  value={baseUrlValue}
                  onValueChange={setBaseUrlValue}
                  disabled={isLocalBusy} 
                />
                {editingBaseUrl && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setEditingBaseUrl(false)} disabled={isLocalBusy}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => {
                      const trimmed = (baseUrlValue || '').trim();
                      onUpdateLocalBaseUrl(trimmed);
                      setEditingBaseUrl(false);
                    }} disabled={isLocalBusy}>
                      Save
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-white px-3 py-2 text-xs text-[var(--text-secondary)]">
            <span>Default model</span>
            <Select
              value={localProvider.defaultModel || ''}
              onValueChange={onUpdateLocalDefaultModel}
            >
              <SelectTrigger className="w-60 border border-[var(--border-subtle)] bg-white">
                <SelectValue placeholder="Select default…" />
              </SelectTrigger>
              <SelectContent>
                {localModels.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {localModels.length > 0 ? (
            <ul className="space-y-2" role="list">
              {localModels.map((model) => {
                const isDefault = localProvider.defaultModel === model;
                return (
                  <li
                    key={model}
                    className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-white px-3 py-2 h-14"
                  >
                    <div className="flex items-center gap-2">
                      {localDisplayState === 'connected' ? (
                        <CheckCircle2 className="size-4 text-green-500" aria-hidden />
                      ) : (
                        <CheckCircle2 className="size-4 text-gray-400" aria-hidden />
                      )}
                      {/* Placeholder for future model logo slot */}
                      <span className="inline-block w-5 h-5" aria-hidden />
                      <span className="text-sm text-[var(--text-primary)]">
                        {model}
                        {isDefault && (
                          <span className="ml-2 rounded border px-1.5 py-0.5 text-xs text-[var(--text-tertiary)]">Default</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRequestDeleteLocalModel(model)}
                        disabled={isLocalBusy}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] bg-white px-3 py-6 text-sm text-[var(--text-secondary)]">
              No local models installed. Pull a model to get started.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

export default ProvidersSummaryPanel;
