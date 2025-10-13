import React, { useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../../../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../ui/select';
import { toast } from 'sonner';
import type { ProviderConfig, ProviderId } from '../../../../modules/settings/state/providerSettings';
import { getModelMetadata } from '../../../../modules/settings/state/mistralModelMetadata';
import { PROVIDERS, type ProviderMeta } from '../config';
import type { DisplayConnectionState } from '../connectionStatus';

type ProviderOption = { id: ProviderId; label: string };

interface AssistantDefaultsPanelProps {
  providersConfig: Record<ProviderId, ProviderConfig>;
  assistantProvider: ProviderId | null;
  assistantModel: string | null;
  fallbackProvider: ProviderId | null;
  fallbackModel: string | null;
  onProviderChange: (id: ProviderId | null) => void;
  onModelChange: (modelId: string | null) => void;
  onFallbackProviderChange: (id: ProviderId | null) => void;
  onFallbackModelChange: (modelId: string | null) => void;
  onConfigureProvider: (providerId: ProviderId) => void;
  providerStates: Record<ProviderId, { connectionState: string; lastCheckedAt: number | null; lastError: string | null }>;
}

const dedupe = (ids: string[]) => Array.from(new Set(ids.filter(Boolean)));
const LOCAL_PROVIDER_LABEL = 'Local models';

export function AssistantDefaultsPanel({
  providersConfig,
  assistantProvider,
  assistantModel,
  fallbackProvider,
  fallbackModel,
  onProviderChange,
  onModelChange,
  onFallbackProviderChange,
  onFallbackModelChange,
  onConfigureProvider,
  providerStates,
}: AssistantDefaultsPanelProps): JSX.Element {
  const [fallbackEnabled, setFallbackEnabled] = useState(fallbackProvider !== null);

  const getProviderStatus = (providerId: ProviderId) => {
    const state = providerStates?.[providerId];
    if (!state) return 'not_configured';
    return state.connectionState;
  };

  const getStatusIcon = (providerId: ProviderId) => {
    const status = getProviderStatus(providerId);
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="size-3 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="size-3 text-red-500" />;
      default:
        return <CheckCircle2 className="size-3 text-gray-400" />;
    }
  };

  const getProviderModels = (providerId: ProviderId | null) => {
    if (!providerId) return [];
    const config = providersConfig[providerId];
    if (!config) return [];
    
    if (providerId === 'local') {
      // For local models, show all available models
      return config.availableModels || [];
    } else {
      // For cloud providers, only show enabled models that user has selected
      return config.enabledModels || [];
    }
  };

  const handleFallbackToggle = (enabled: boolean) => {
    setFallbackEnabled(enabled);
    if (!enabled) {
      onFallbackProviderChange(null);
      onFallbackModelChange(null);
    }
  };

  const isValidation = fallbackEnabled && 
    fallbackProvider === assistantProvider && 
    fallbackModel === assistantModel &&
    fallbackProvider !== null;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-4">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Assistant defaults</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Choose a primary provider and an optional fallback.</p>
        </div>

        {/* Primary Row */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--text-secondary)] w-16">Primary</span>
          <Select value={assistantProvider || ''} onValueChange={(value) => {
            const next = value === '' ? null : (value as ProviderId);
            onProviderChange(next);
            onModelChange(null);
          }}>
            <SelectTrigger className="w-48 border border-[var(--border-subtle)] bg-white">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <div className="text-xs font-medium text-[var(--text-tertiary)] px-2 py-1">Cloud providers</div>
              {PROVIDERS.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(provider.id)}
                    {provider.label}
                  </div>
                </SelectItem>
              ))}
              <div className="text-xs font-medium text-[var(--text-tertiary)] px-2 py-1 border-t border-[var(--border-subtle)] mt-1 pt-2">Local models</div>
              <SelectItem value="local">
                <div className="flex items-center gap-2">
                  {getStatusIcon('local')}
                  Local models
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={assistantModel || '__default__'} 
            onValueChange={(value) => onModelChange(value === '__default__' ? null : value)}
            disabled={!assistantProvider}
          >
            <SelectTrigger className="w-56 border border-[var(--border-subtle)] bg-white">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default__">Use provider default</SelectItem>
              {getProviderModels(assistantProvider).map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fallback Row */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--text-secondary)] w-16">Fallback</span>
          <Select value={fallbackEnabled ? 'on' : 'off'} onValueChange={(value) => handleFallbackToggle(value === 'on')}>
            <SelectTrigger className="w-20 border border-[var(--border-subtle)] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Off</SelectItem>
              <SelectItem value="on">On</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={fallbackProvider || ''} 
            onValueChange={(value) => {
              const next = value === '' ? null : (value as ProviderId);
              onFallbackProviderChange(next);
              onFallbackModelChange(null);
            }}
            disabled={!fallbackEnabled}
          >
            <SelectTrigger className="w-48 border border-[var(--border-subtle)] bg-white">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <div className="text-xs font-medium text-[var(--text-tertiary)] px-2 py-1">Cloud providers</div>
              {PROVIDERS.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(provider.id)}
                    {provider.label}
                  </div>
                </SelectItem>
              ))}
              <div className="text-xs font-medium text-[var(--text-tertiary)] px-2 py-1 border-t border-[var(--border-subtle)] mt-1 pt-2">Local models</div>
              <SelectItem value="local">
                <div className="flex items-center gap-2">
                  {getStatusIcon('local')}
                  Local models
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={fallbackModel || '__default__'} 
            onValueChange={(value) => onFallbackModelChange(value === '__default__' ? null : value)}
            disabled={!fallbackEnabled || !fallbackProvider}
          >
            <SelectTrigger className="w-56 border border-[var(--border-subtle)] bg-white">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default__">Use provider default</SelectItem>
              {getProviderModels(fallbackProvider).map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Validation */}
        {isValidation && (
          <p className="text-sm text-[var(--text-warn)] mt-2">
            Fallback matches primary—pick a different one.
          </p>
        )}
      </div>
    </div>
  );
}

export default AssistantDefaultsPanel;
