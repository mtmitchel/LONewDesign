import React, { useMemo, useState } from 'react';
import { SectionCard, SummaryRow } from './SectionCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Switch } from '../../../ui/switch';
import { Input } from '../../../ui/input';
import { Slider } from '../../../ui/slider';
import { Button } from '../../../ui/button';
import { useSettingsState } from './SettingsState';

interface SettingsAssistantProps {
  id: string;
  filter: (text: string) => boolean;
  registerSection: (node: HTMLElement | null) => void;
}

type WritingStyle = 'balanced' | 'formal' | 'creative';

type AssistantState = {
  provider: string;
  model: string;
  autoReplace: boolean;
  showConfidence: boolean;
  keepHistory: boolean;
  maxResponseLength: number;
  temperature: number;
  topP: number;
  style: WritingStyle;
};

const INITIAL_STATE: AssistantState = {
  provider: 'openai',
  model: 'gpt-4o',
  autoReplace: false,
  showConfidence: false,
  keepHistory: true,
  maxResponseLength: 1000,
  temperature: 0.4,
  topP: 0.9,
  style: 'balanced',
};

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openrouter', label: 'OpenRouter' },
];

const MODEL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
    { value: 'o3-mini', label: 'O3 mini' },
  ],
  anthropic: [
    { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3.5-haiku', label: 'Claude 3.5 Haiku' },
  ],
  openrouter: [
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude Sonnet via OpenRouter' },
    { value: 'meta-llama/llama-3.1-405b', label: 'Llama 3.1 405B' },
  ],
};

const WRITING_STYLE_LABEL: Record<WritingStyle, string> = {
  balanced: 'Balanced',
  creative: 'Creative',
  formal: 'Formal',
};

export function SettingsAssistant({ id, filter, registerSection }: SettingsAssistantProps) {
  const { setFieldDirty } = useSettingsState();
  const [form, setForm] = useState<AssistantState>(INITIAL_STATE);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const sectionMatches = useMemo(
    () => filter('assistant writing defaults provider model tone history confidence response length'),
    [filter],
  );

  if (!sectionMatches) return null;

  const providerModels = MODEL_OPTIONS[form.provider] ?? [];

  const updateField = <K extends keyof AssistantState>(field: K, value: AssistantState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      const initialValue = INITIAL_STATE[field];
      const changed = Array.isArray(value)
        ? JSON.stringify(value) !== JSON.stringify(initialValue)
        : value !== initialValue;
      setFieldDirty(`assistant.${String(field)}`, changed);
      return next;
    });
  };

  const summary = {
    provider: PROVIDER_OPTIONS.find((option) => option.value === form.provider)?.label ?? 'Not set',
    model: providerModels.find((option) => option.value === form.model)?.label ?? form.model,
    history: form.keepHistory ? 'On' : 'Off',
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
          AI writing assistant
        </h2>
      </header>

      <SectionCard title="Writing defaults" help="Control tone, history, and limits for quick edits.">
        <div className="space-y-4">
          <div className="space-y-2">
            <SummaryRow label="Default provider" value={summary.provider} />
            <SummaryRow label="Default model" value={summary.model} />
            <SummaryRow label="History" value={summary.history} />
          </div>

          <div className="grid gap-[var(--form-row-gap)]">
            <div className="grid gap-2">
              <label htmlFor="assistant-provider" className="text-sm font-medium text-[var(--text-primary)]">
                Default provider
              </label>
              <Select
                value={form.provider}
                onValueChange={(value) => {
                  updateField('provider', value);
                  const fallbackModel = (MODEL_OPTIONS[value] ?? [])[0]?.value ?? '';
                  updateField('model', fallbackModel || '');
                }}
              >
                <SelectTrigger id="assistant-provider">
                  <SelectValue placeholder="Choose provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="assistant-model" className="text-sm font-medium text-[var(--text-primary)]">
                Default model
              </label>
              <Select value={form.model} onValueChange={(value) => updateField('model', value)}>
                <SelectTrigger id="assistant-model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {providerModels.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-3 py-2">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Auto-replace quick edits</p>
                <p className="text-xs text-[var(--text-secondary)]">Skip the preview for grammar fixes.</p>
              </div>
              <Switch
                checked={form.autoReplace}
                onCheckedChange={(checked) => updateField('autoReplace', checked)}
                aria-label="Auto-replace quick edits"
              />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-3 py-2">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Show confidence scores</p>
                <p className="text-xs text-[var(--text-secondary)]">Display AI confidence for suggestions.</p>
              </div>
              <Switch
                checked={form.showConfidence}
                onCheckedChange={(checked) => updateField('showConfidence', checked)}
                aria-label="Show confidence scores"
              />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-3 py-2">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Keep conversation history</p>
                <p className="text-xs text-[var(--text-secondary)]">Maintain context across tools.</p>
              </div>
              <Switch
                checked={form.keepHistory}
                onCheckedChange={(checked) => updateField('keepHistory', checked)}
                aria-label="Keep conversation history"
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              className="justify-start px-0 text-sm text-[var(--text-primary)] underline decoration-dotted"
              onClick={() => setShowAdvanced((prev) => !prev)}
            >
              {showAdvanced ? 'Hide advanced' : 'Show advanced'}
            </Button>

            {showAdvanced && (
              <div className="grid gap-[var(--form-row-gap)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <div className="grid gap-2">
                  <label htmlFor="max-response-length" className="text-sm font-medium text-[var(--text-primary)]">
                    Maximum response length
                  </label>
                  <Slider
                    id="max-response-length"
                    min={100}
                    max={2000}
                    step={50}
                    value={[form.maxResponseLength]}
                    onValueChange={([value]) => updateField('maxResponseLength', value)}
                  />
                  <div className="text-xs text-[var(--text-secondary)]">{form.maxResponseLength} tokens</div>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="temperature" className="text-sm font-medium text-[var(--text-primary)]">
                    Temperature
                  </label>
                  <Input
                    id="temperature"
                    type="number"
                    value={form.temperature}
                    min={0}
                    max={1}
                    step={0.1}
                    onChange={(event) => updateField('temperature', Number(event.target.value))}
                  />
                  <p className="text-xs text-[var(--text-secondary)]">Lower values keep responses consistent.</p>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="top-p" className="text-sm font-medium text-[var(--text-primary)]">
                    Top P
                  </label>
                  <Input
                    id="top-p"
                    type="number"
                    value={form.topP}
                    min={0}
                    max={1}
                    step={0.1}
                    onChange={(event) => updateField('topP', Number(event.target.value))}
                  />
                  <p className="text-xs text-[var(--text-secondary)]">Controls nucleus sampling for varied output.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </section>
  );
}
