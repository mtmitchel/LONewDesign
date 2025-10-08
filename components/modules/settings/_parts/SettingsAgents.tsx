import React, { useMemo, useState } from 'react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { SectionCard, SummaryRow } from './SectionCard';
import { useSettingsState } from './SettingsState';
import { reportSettingsEvent } from './analytics';

interface SettingsAgentsProps {
  id: string;
  filter: (text: string) => boolean;
  registerSection: (node: HTMLElement | null) => void;
}

interface LocalModelRow {
  id: string;
  label: string;
  size: string;
  modified: string;
}

const INITIAL_ENDPOINT = 'http://localhost:11434';
const INITIAL_MODELS: LocalModelRow[] = [
  { id: 'tinyllama:1.1b', label: 'tinyllama:1.1b', size: '608 MB', modified: '10 days ago' },
  { id: 'gemma3:8b', label: 'gemma3:8b', size: '7.0 GB', modified: '4 days ago' },
];
const INITIAL_DEFAULT_MODEL = 'gemma3:8b';

export function SettingsAgents({ id, filter, registerSection }: SettingsAgentsProps) {
  const { setFieldDirty } = useSettingsState();
  const [endpoint, setEndpoint] = useState(INITIAL_ENDPOINT);
  const [models] = useState(INITIAL_MODELS);
  const [defaultModel, setDefaultModel] = useState<string>(INITIAL_DEFAULT_MODEL);

  const sectionMatches = useMemo(
    () => filter('agents models ollama local defaults writing connect server'),
    [filter],
  );

  if (!sectionMatches) return null;

  const handleEndpointChange = (value: string) => {
    setEndpoint(value);
    setFieldDirty('agents.endpoint', value.trim() !== INITIAL_ENDPOINT);
  };

  const handleModelSelect = (modelId: string) => {
    setDefaultModel(modelId);
    setFieldDirty('agents.default_model', modelId !== INITIAL_DEFAULT_MODEL);
  };

  const handlePullModel = () => {
    reportSettingsEvent('settings.model_pull_started', { source: 'local' });
    setFieldDirty('agents.model_pull', true);
    reportSettingsEvent('settings.model_pull_completed', { source: 'local' });
  };

  const defaultSummary = models.find((model) => model.id === defaultModel)?.label ?? 'Not selected';

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
          Agents and models
        </h2>
      </header>

      <SectionCard title="Ollama server" help="The local URL where your Ollama instance runs.">
        <div className="space-y-4">
          <SummaryRow label="Endpoint" value={<code className="text-[var(--text-secondary)]">{endpoint}</code>} />
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="ollama-endpoint">
              Endpoint URL
            </label>
            <Input
              id="ollama-endpoint"
              value={endpoint}
              onChange={(event) => handleEndpointChange(event.target.value)}
              aria-describedby="ollama-endpoint-help"
              className="font-mono"
            />
            <p id="ollama-endpoint-help" className="text-xs text-[var(--text-secondary)]">
              Ollama defaults to http://localhost:11434.
            </p>
          </div>
          <div className="pt-2">
            <Button variant="outline" onClick={() => reportSettingsEvent('settings.provider_test', { id: 'ollama' })}>
              Test connection
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Local models" help="Manage downloaded models. Pick one as default.">
        <div className="space-y-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-4 py-2 text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
              <span>Model</span>
              <span>Size</span>
              <span>Modified</span>
              <span className="text-right">Actions</span>
            </div>
            {models.map((model) => (
              <div
                key={model.id}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3 text-sm last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="defaultModel"
                    id={`default-${model.id}`}
                    checked={defaultModel === model.id}
                    onChange={() => handleModelSelect(model.id)}
                    aria-label={`Set ${model.label} as default model`}
                    className="size-4 accent-[var(--primary)]"
                  />
                  <label htmlFor={`default-${model.id}`} className="text-[var(--text-primary)]">
                    {model.label}
                  </label>
                </div>
                <span className="text-[var(--text-secondary)]">{model.size}</span>
                <span className="text-[var(--text-secondary)]">{model.modified}</span>
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm">
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-1">
            <Button onClick={handlePullModel}>Pull model</Button>
          </div>
        </div>
      </SectionCard>

      <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-secondary)]">
        Default model: <span className="font-medium text-[var(--text-primary)]">{defaultSummary}</span>
      </div>
    </section>
  );
}
