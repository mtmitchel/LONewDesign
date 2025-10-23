import React from 'react';
import type { ModelOption } from '../types';

const SUPPORTED_CHAT_PROVIDERS: string[] = ['local', 'mistral', 'openai', 'deepseek', 'glm', 'openrouter'];

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  local: 'Ollama',
  mistral: 'Mistral',
  openai: 'OpenAI',
  deepseek: 'DeepSeek',
  glm: 'GLM',
  openrouter: 'OpenRouter',
};

function formatModelLabel(provider: string, modelId: string): string {
  if (!modelId) return '';

  switch (provider) {
    case 'local':
      return `Ollama · ${modelId}`;
    case 'mistral':
      return modelId
        .replace(/^open-mistral-/, 'Mistral ')
        .replace(/^mistral-/, 'Mistral ')
        .replace(/^mixtral-/, 'Mixtral ')
        .replace(/^open-mixtral-/, 'Mixtral ')
        .replace(/^codestral-/, 'Codestral ')
        .replace(/^devstral-/, 'Devstral ')
        .replace(/^pixtral-/, 'Pixtral ')
        .replace(/^voxtral-/, 'Voxtral ')
        .replace(/^magistral-/, 'Magistral ')
        .replace(/^ministral-/, 'Ministral ')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, letter => letter.toUpperCase());
    case 'openrouter':
      if (modelId === 'openrouter/auto') {
        return 'OpenRouter Auto';
      }
      return `OpenRouter · ${modelId.replace('openrouter/', '').replace(/\//g, ' / ')}`;
    case 'openai':
      return `OpenAI · ${modelId}`;
    case 'deepseek':
      return `DeepSeek · ${modelId}`;
    case 'glm':
      return `GLM · ${modelId}`;
    default:
      return `${(PROVIDER_DISPLAY_NAMES[provider] ?? provider.toUpperCase())} · ${modelId}`;
  }
}

export function useModelSelection() {
  // Build model options with some default models for now
  const MODEL_OPTIONS = React.useMemo<ModelOption[]>(() => {
    const options: ModelOption[] = [
      { value: 'llama3.1:8b', label: 'Ollama · llama3.1:8b', provider: 'local' },
      { value: 'mistral-small-latest', label: 'Mistral Small', provider: 'mistral' },
      { value: 'gpt-4o', label: 'OpenAI · GPT-4o', provider: 'openai' },
      { value: 'deepseek-chat', label: 'DeepSeek · DeepSeek Chat', provider: 'deepseek' },
    ];

    return options;
  }, []);

  const [selectedModel, setSelectedModel] = React.useState<string>(() => MODEL_OPTIONS[0]?.value ?? '');
  const selectedOption = React.useMemo(
    () => MODEL_OPTIONS.find(option => option.value === selectedModel) ?? null,
    [MODEL_OPTIONS, selectedModel]
  );
  const selectedModelLabel = React.useMemo(() => {
    if (selectedOption?.label) return selectedOption.label;
    return selectedModel || 'Select a model';
  }, [selectedModel, selectedOption]);
  const modelAnnouncement = React.useMemo(
    () => `Model set to ${selectedModelLabel}`,
    [selectedModelLabel]
  );

  const onModelChange = React.useCallback(
    (model: string) => {
      setSelectedModel(model);
      console.debug('chat:model:change', { model });
    },
    []
  );

  return {
    MODEL_OPTIONS,
    selectedModel,
    selectedModelLabel,
    selectedOption,
    modelAnnouncement,
    onModelChange,
  };
}