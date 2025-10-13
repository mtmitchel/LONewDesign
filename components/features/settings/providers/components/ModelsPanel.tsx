import React from 'react';
import { Separator } from '../../../../ui/separator';
import { Button } from '../../../../ui/button';
import { Input } from '../../../../ui/input';
import {
  getModelMetadata,
  getTierLabel,
  getTierBadgeClass,
  sortModelsByTier,
} from '../../../../modules/settings/state/mistralModelMetadata';
import type { ProviderId } from '../../../../modules/settings/state/providerSettings';

interface TieredModelListProps {
  providerId: ProviderId;
  availableModels: string[];
  enabledModels: string[];
  onToggleModel: (id: string, enabled: boolean) => void;
  onToggleAll?: () => void;
}

function TieredModelList({ providerId, availableModels, enabledModels, onToggleModel, onToggleAll }: TieredModelListProps): JSX.Element | null {
  if (availableModels.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Available Models</h3>
            <p className="text-sm text-[var(--text-secondary)]">Select which models appear in your chat dropdown.</p>
          </div>
          {onToggleAll && (
            <button onClick={onToggleAll} className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium shrink-0">
              {availableModels.length === enabledModels.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {sortModelsByTier(availableModels).map((modelId) => {
          const isEnabled = enabledModels.includes(modelId);
          const metadata = getModelMetadata(modelId);
          const tierLabel = getTierLabel(metadata.tier);
          const tierBadgeClass = getTierBadgeClass(metadata.tier);

          return (
            <label
              key={`${providerId}-${modelId}`}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 cursor-pointer hover:bg-[var(--hover-bg)]"
            >
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(event) => onToggleModel(modelId, event.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-default)] text-[var(--primary)]"
              />
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm font-mono text-[var(--text-primary)]">{metadata.displayName}</span>
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${tierBadgeClass}`}>
                  {tierLabel}
                </span>
              </div>
              {metadata.description && (
                <span className="text-xs text-[var(--text-tertiary)] hidden lg:inline">{metadata.description}</span>
              )}
            </label>
          );
        })}
      </div>
    </section>
  );
}

interface ModelsPanelProps {
  providerId: ProviderId;
  availableModels: string[];
  enabledModels: string[];
  openRouterSearch: string;
  onOpenRouterSearch: (value: string) => void;
  onToggleModel: (id: string, enabled: boolean) => void;
  onToggleAll?: () => void;
  onUpdateEnabled?: (ids: string[]) => void;
}

export function ModelsPanel({
  providerId,
  availableModels,
  enabledModels,
  openRouterSearch,
  onOpenRouterSearch,
  onToggleModel,
  onToggleAll,
  onUpdateEnabled,
}: ModelsPanelProps): JSX.Element | null {
  if (providerId === 'mistral') {
    return (
      <>
        <Separator />
        <TieredModelList
          providerId={providerId}
          availableModels={availableModels}
          enabledModels={enabledModels}
          onToggleModel={onToggleModel}
          onToggleAll={onToggleAll}
        />
      </>
    );
  }

  if (providerId === 'openrouter' && availableModels.length > 0) {
    const filtered = availableModels.filter((modelId) =>
      openRouterSearch === '' || modelId.toLowerCase().includes(openRouterSearch.toLowerCase()),
    );

    return (
      <>
        <Separator />
        <section className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Available Models</h3>
                <p className="text-sm text-[var(--text-secondary)]">Search and select from 200+ models across 80+ providers.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              placeholder="Search models (e.g., claude, gpt, llama)..."
              value={openRouterSearch}
              onChange={(event) => onOpenRouterSearch(event.target.value)}
              className="text-sm"
            />

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filtered.slice(0, 100).map((modelId) => {
                const isEnabled = enabledModels.includes(modelId);
                return (
                  <label
                    key={modelId}
                    className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 cursor-pointer hover:bg-[var(--hover-bg)]"
                  >
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? [...enabledModels, modelId]
                          : enabledModels.filter((id) => id !== modelId);
                        onUpdateEnabled?.(next);
                      }}
                      className="h-4 w-4 rounded border-[var(--border-default)] text-[var(--primary)]"
                    />
                    <span className="text-sm font-mono text-[var(--text-primary)]">{modelId}</span>
                  </label>
                );
              })}

              {filtered.length > 100 && (
                <p className="text-xs text-[var(--text-tertiary)] text-center py-2">
                  Showing first 100 results. Refine your search to see more.
                </p>
              )}
            </div>
          </div>
        </section>
      </>
    );
  }

  return null;
}

export default ModelsPanel;
