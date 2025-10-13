import React, { useMemo } from 'react';
import { Label } from '../../../../ui/label';
import { Button } from '../../../../ui/button';
import { toast } from 'sonner';
import type { ProviderConfig, ProviderId } from '../../../../modules/settings/state/providerSettings';
import { getModelMetadata } from '../../../../modules/settings/state/mistralModelMetadata';
import { PROVIDERS, type ProviderMeta } from '../config';

type ProviderOption = { id: ProviderId; label: string };

interface AssistantDefaultsPanelProps {
  providersConfig: Record<ProviderId, ProviderConfig>;
  assistantProvider: ProviderId | null;
  assistantModel: string | null;
  onProviderChange: (id: ProviderId | null) => void;
  onModelChange: (modelId: string | null) => void;
  onConfigureProvider: (providerId: ProviderId) => void;
}

const dedupe = (ids: string[]) => Array.from(new Set(ids.filter(Boolean)));
const LOCAL_PROVIDER_LABEL = 'Local models';

export function AssistantDefaultsPanel({
  providersConfig,
  assistantProvider,
  assistantModel,
  onProviderChange,
  onModelChange,
  onConfigureProvider,
}: AssistantDefaultsPanelProps): JSX.Element {
  const providerOptions = useMemo(() => {
    const options = { cloud: [] as ProviderOption[], local: [] as ProviderOption[] };

    PROVIDERS.forEach((provider: ProviderMeta) => {
      if (providersConfig[provider.id]?.apiKey?.trim()) {
        options.cloud.push({ id: provider.id, label: provider.label });
      }
    });

    if (providersConfig.local?.baseUrl?.trim()) {
      options.local.push({ id: 'local', label: LOCAL_PROVIDER_LABEL });
    }

    return options;
  }, [providersConfig]);

  const modelGroups = useMemo(() => {
    if (!assistantProvider) return [];
    const providerConfig = providersConfig[assistantProvider];
    if (!providerConfig) return [];

    const groups: Array<{ label: string; models: string[]; icon: string }> = [];

    if (assistantProvider === 'local') {
      groups.push({
        label: 'Local runtime',
        models: dedupe(providerConfig.availableModels),
        icon: '💻',
      });
    } else {
      const enabled = dedupe([
        ...(assistantProvider === 'openrouter' ? ['openrouter/auto'] : []),
        ...providerConfig.enabledModels,
        providerConfig.defaultModel ?? '',
      ]);

      if (enabled.length > 0) {
        groups.push({ label: 'Cloud models', models: enabled, icon: '☁️' });
      }

      if (assistantProvider !== 'openrouter' && providerConfig.availableModels.length > enabled.length) {
        groups.push({ label: 'Additional models', models: dedupe(providerConfig.availableModels), icon: '🧮' });
      }
    }

    return groups;
  }, [assistantProvider, providersConfig]);

  const handleModelChange = (value: string) => {
    const next = value === '' ? null : value;
    onModelChange(next);
    if (next) {
      const metadata = getModelMetadata(next);
      const label = metadata.displayName ?? next;
      const shortName = label.length > 36 ? `${label.slice(0, 33)}…` : label;
      toast.success(`Model set to ${shortName}`);
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label htmlFor="assistant-provider-select" className="text-sm font-medium text-[var(--text-primary)]">
              Primary provider
            </Label>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Used for chat, intent classification, and writing assistance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              id="assistant-provider-select"
              value={assistantProvider ?? ''}
              onChange={(event) => {
                const value = event.target.value as ProviderId | '';
                const next = value === '' ? null : (value as ProviderId);
                onProviderChange(next);
                onModelChange(null);
                if (next) {
                  const matched = [...providerOptions.cloud, ...providerOptions.local].find((p) => p.id === next);
                  toast.success(`Assistant provider set to ${matched?.label ?? next}`);
                }
              }}
              className="w-48 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:border-[var(--border-default)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            >
              <option value="">Choose provider...</option>
              {providerOptions.cloud.length > 0 && (
                <optgroup label="Cloud providers">
                  {providerOptions.cloud.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.label}
                    </option>
                  ))}
                </optgroup>
              )}
              {providerOptions.local.length > 0 && (
                <optgroup label="Local models">
                  {providerOptions.local.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.label}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {assistantProvider && (
              <Button variant="outline" size="sm" onClick={() => onConfigureProvider(assistantProvider)}>
                Configure
              </Button>
            )}
          </div>
        </div>
      </div>

      {assistantProvider && modelGroups.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="assistant-model-select" className="text-sm font-medium text-[var(--text-primary)]">
            Model
          </Label>
          <select
            id="assistant-model-select"
            value={assistantModel ?? ''}
            onChange={(event) => handleModelChange(event.target.value)}
            className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:border-[var(--border-default)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
          >
            <option value="">Use provider default</option>
            {modelGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.models.map((modelId) => {
                  const metadata = getModelMetadata(modelId);
                  const displayName = metadata.displayName ?? modelId;
                  return (
                    <option key={modelId} value={modelId} title={displayName}>
                      {`${group.icon} ${assistantModel === modelId ? '✓ ' : ''}${displayName}`}
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
        </div>
      )}
    </section>
  );
}

export default AssistantDefaultsPanel;
